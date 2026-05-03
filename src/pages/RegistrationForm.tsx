import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Upload, AlertCircle, FileText, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';
import { submitRegistration, RegistrationData, FormField, getSchoolInfo } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { compressImage } from '../lib/utils';

export default function RegistrationForm() {
  const { settings } = useSettings();
  const isClosed = settings?.statusPendaftaran === 'Tutup';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingSchool, setIsFetchingSchool] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [formData, setFormData] = useState<RegistrationData>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchSchool = async (npsn: string) => {
    if (!npsn || npsn.length < 8) return;

    console.log("Searching school for NPSN:", npsn);
    setIsFetchingSchool(true);
    try {
      const response = await getSchoolInfo(npsn);
      console.log("School API Response:", response);

      if (response.status === 'success' && response.data?.sekolah) {
        const schoolName = response.data.sekolah;
        console.log("Found School:", schoolName);
        setFormData(prev => ({ ...prev, 'Asal Sekolah': schoolName }));
        Swal.fire({
          icon: 'success',
          title: 'Sekolah Ditemukan',
          text: schoolName,
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Gagal Mengambil Data',
          text: 'NPSN tidak ditemukan atau server pusat sedang sibuk. Silakan isi Nama Sekolah secara manual.',
          confirmButtonColor: '#3b82f6'
        });
      }
    } catch (error) {
      console.error('Error fetching school data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal mengambil data sekolah.',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } finally {
      setIsFetchingSchool(false);
    }
  };

  // Auto-fill school name when NPSN changes
  // Commented out to avoid double triggers since we handle it in onChange
  /*
  React.useEffect(() => {
    const npsnValue = formData['NPSN Sekolah'];
    if (npsnValue && npsnValue.length === 8) {
      handleSearchSchool(npsnValue);
    }
  }, [formData['NPSN Sekolah']]);
  */

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Terlalu Besar',
        text: 'Ukuran maksimal file adalah 2MB',
        confirmButtonColor: '#3b82f6'
      });
      e.target.value = '';
      return;
    }

    // Convert to Base64 with compression if it's an image
    try {
      let result: string;
      if (file.type.startsWith('image/')) {
        result = await compressImage(file);
      } else {
        const reader = new FileReader();
        result = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      setFormData(prev => ({ ...prev, [fieldId]: result }));
      setPreviews(prev => ({ ...prev, [fieldId]: result }));
    } catch (error) {
      console.error("Failed to process file", error);
    }
  };

  const printProof = (noPendaftaran: string) => {
    const doc = new jsPDF() as any;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Helper for date formatting
    const formatDate = (dateString: string) => {
      if (!dateString) return '-';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = date.getDate();
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    };

    // 1. Draw Page Border
    doc.setDrawColor(37, 99, 235); // blue-600
    doc.setLineWidth(0.5);
    doc.rect(margin - 5, margin - 5, pageWidth - (margin * 2) + 10, pageHeight - (margin * 2) + 10);

    // 2. Header / Kop Surat
    let currentY = margin;
    if (settings?.kopSurat) {
      try {
        doc.addImage(settings.kopSurat, 'JPEG', margin, margin, pageWidth - (margin * 2), 30);
        currentY += 35;
      } catch (e) {
        console.error("Error adding kop surat", e);
      }
    } else {
      // Default Professional Header
      doc.setFillColor(37, 99, 235);
      doc.rect(margin, margin, pageWidth - (margin * 2), 35, 'F');

      // Logo if exists
      if (settings?.logoSekolah) {
        try {
          doc.addImage(settings.logoSekolah, 'PNG', margin + 5, margin + 5, 25, 25);
        } catch (e) { }
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("BUKTI PENDAFTARAN SPMB", 105, margin + 12, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      const schoolName = settings?.namaSekolah || 'SMP NEGERI 4 FAKFAK';
      doc.text(schoolName, 105, margin + 20, { align: "center" });

      doc.setFontSize(9);
      const schoolAddr = settings?.alamat || '';
      const splitAddr = doc.splitTextToSize(schoolAddr, pageWidth - 80);
      doc.text(splitAddr, 105, margin + 26, { align: "center" });

      currentY += 45;
    }

    // 3. Registration Info & Photo Area
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`NO. PENDAFTARAN : ${noPendaftaran}`, margin, currentY);

    const today = new Date();
    const dateStr = formatDate(today.toISOString());
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Dicetak pada: ${dateStr}`, pageWidth - margin, currentY, { align: 'right' });

    currentY += 10;

    // Student Photo (Top Right)
    const photoField = settings?.formFields?.find(f => f.label.toLowerCase().includes('foto') || f.label.toLowerCase().includes('pas foto'));
    if (photoField && formData[photoField.id]) {
      try {
        doc.setDrawColor(200, 200, 200);
        doc.rect(pageWidth - margin - 30, currentY, 30, 40); // 3x4 ratio
        doc.addImage(formData[photoField.id], 'JPEG', pageWidth - margin - 29, currentY + 1, 28, 38);
      } catch (e) { }
    }

    // 4. Data Table
    const tableData: any[] = [];

    settings?.formFields?.forEach(field => {
      if (field.type === 'header') {
        tableData.push([{ content: field.label, colSpan: 2, styles: { fillColor: [240, 245, 255], textColor: [37, 99, 235], fontStyle: 'bold', fontSize: 10 } }]);
      } else if (field.type !== 'file') {
        // Gabungkan Tempat dan Tanggal Lahir jika field adalah Tanggal Lahir
        if (field.id === 'Tempat Lahir') return; // Lewati field Tempat Lahir karena akan digabung

        let value = formData[field.id] || '-';
        let label = field.label;

        if (field.id === 'Tanggal Lahir') {
          const tempatLahir = formData['Tempat Lahir'] || '-';
          value = `${tempatLahir}, ${formatDate(value)}`;
          label = 'Tempat, Tgl Lahir';
        } else if (field.type === 'date') {
          value = formatDate(value);
        }

        tableData.push([
          { content: label, styles: { cellWidth: 60, fontStyle: 'bold', fontSize: 9 } },
          { content: value, styles: { fontSize: 9 } }
        ]);
      }
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin + 35 }, // Leave space for photo
      body: tableData,
      theme: 'grid',
      styles: { cellPadding: 2, fontSize: 9, valign: 'middle' },
      columnStyles: {
        0: { fillColor: [250, 250, 250] }
      },
      didDrawPage: (data: any) => {
        // Adjust footer position if needed
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // 5. Signature Area
    const tempat = settings?.tempatSurat || 'Fakfak';
    const tanggal = settings?.tanggalSurat || dateStr;

    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = margin + 10;
    }

    doc.setFontSize(10);
    doc.text(`${tempat}, ${tanggal}`, pageWidth - margin - 60, currentY);
    doc.text('Pendaftar/Orang Tua,', pageWidth - margin - 60, currentY + 6);

    doc.setDrawColor(150, 150, 150);
    doc.line(pageWidth - margin - 60, currentY + 30, pageWidth - margin - 10, currentY + 30);
    doc.setFontSize(8);
    doc.text('( Nama Terang & Tanda Tangan )', pageWidth - margin - 60, currentY + 34);

    // 6. Professional Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Sistem Informasi SPMB Online - SMP NEGERI 4 FAKFAK", 105, pageHeight - margin, { align: "center" });
    doc.text("Simpan bukti ini sebagai syarat verifikasi berkas dan cek kelulusan.", 105, pageHeight - margin + 4, { align: "center" });

    doc.save(`Bukti_Pendaftaran_${noPendaftaran}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAgreed) {
      Swal.fire({
        icon: 'warning',
        title: 'Pernyataan Belum Disetujui',
        text: 'Anda harus menyetujui pernyataan kebenaran data sebelum mengirim formulir.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    // Basic validation for files
    const missingFiles = settings?.formFields?.filter(f => f.type === 'file' && f.required && !formData[f.id]);
    if (missingFiles && missingFiles.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Berkas Belum Lengkap',
        text: `Mohon unggah dokumen: ${missingFiles.map(f => f.label).join(', ')}`,
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    // Length validation for NISN, NIK, and NPSN
    const nisn = formData['NISN']?.toString() || '';
    const nik = formData['NIK']?.toString() || '';
    const npsn = formData['NPSN Sekolah']?.toString() || '';

    if (nisn && nisn.length !== 10) {
      Swal.fire({
        icon: 'error',
        title: 'NISN Tidak Valid',
        text: 'NISN wajib berjumlah 10 digit nomor.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (nik && nik.length !== 16) {
      Swal.fire({
        icon: 'error',
        title: 'NIK Tidak Valid',
        text: 'NIK wajib berjumlah 16 digit nomor.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (npsn && npsn.length !== 8) {
      Swal.fire({
        icon: 'error',
        title: 'NPSN Tidak Valid',
        text: 'NPSN Sekolah Asal wajib berjumlah 8 digit nomor.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await submitRegistration(formData);

      if (response.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Pendaftaran Berhasil!',
          html: `Nomor Pendaftaran Anda:<br><b style="font-size: 1.5rem; color: #2563eb;">${response.noPendaftaran}</b><br><br>Simpan nomor ini untuk mengecek status kelulusan.`,
          confirmButtonColor: '#3b82f6',
          confirmButtonText: 'Unduh Bukti Pendaftaran',
          showCancelButton: true,
          cancelButtonText: 'Tutup',
          allowOutsideClick: false
        }).then((result) => {
          if (result.isConfirmed) {
            printProof(response.noPendaftaran);
          }
          // Reset form
          window.location.href = '/';
        });
      } else {
        throw new Error(response.message || 'Terjadi kesalahan');
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Terjadi kesalahan saat mengirim data. Silakan coba lagi.',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isClosed) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 text-center p-8">
          <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Pendaftaran Ditutup</h2>
          <p className="text-slate-600 mb-8">
            Mohon maaf, pendaftaran peserta didik baru saat ini sedang ditutup. Silakan kembali lagi nanti atau hubungi pihak sekolah untuk informasi lebih lanjut.
          </p>
          <Link
            to="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const renderField = (field: FormField) => {
    const commonClasses = "w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";

    switch (field.type) {
      case 'header':
        return null;
      case 'textarea':
        return (
          <textarea
            name={field.id}
            required={field.required}
            rows={3}
            value={formData[field.id] || ''}
            onChange={handleChange}
            className={`${commonClasses} resize-none`}
            placeholder={field.label}
          />
        );
      case 'select':
        return (
          <select
            name={field.id}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={handleChange}
            className={`${commonClasses} bg-white`}
          >
            <option value="">Pilih {field.label}</option>
            {field.options?.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'file':
        return (
          <div className="relative flex-grow border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 transition-colors bg-slate-50 group overflow-hidden h-40">
            <input
              type="file"
              accept="image/jpeg, image/png, application/pdf"
              required={field.required}
              onChange={(e) => handleFileChange(e, field.id)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {previews[field.id] ? (
              <div className="absolute inset-0">
                {previews[field.id].startsWith('data:image') ? (
                  <img src={previews[field.id]} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-blue-50">
                    <FileText className="w-12 h-12 text-blue-500 mb-2" />
                    <span className="text-sm text-blue-700 font-medium">File Terpilih</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-medium">Ubah File</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <Upload className="w-8 h-8 text-slate-400 mb-2 group-hover:text-blue-500 transition-colors" />
                <span className="text-sm text-slate-500 group-hover:text-blue-600">Klik atau Drag file</span>
              </div>
            )}
          </div>
        );
      case 'number':
        // Special handling for NISN, NIK, and NPSN to enforce length and better UX
        if (field.id === 'NISN' || field.id === 'NIK' || field.id === 'NPSN Sekolah' || field.id === 'No. WhatsApp Aktif') {
          const maxLength = field.id === 'NISN' ? 10 : field.id === 'NIK' ? 16 : field.id === 'NPSN Sekolah' ? 8 : 15;
          return (
            <div className="relative">
              <input
                type="text"
                name={field.id}
                required={field.required}
                inputMode="numeric"
                value={formData[field.id] || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= maxLength) {
                    setFormData(prev => ({ ...prev, [field.id]: val }));
                    // Trigger school search if NPSN reaches 8 digits
                    if (field.id === 'NPSN Sekolah' && val.length === 8) {
                      handleSearchSchool(val);
                    }
                  }
                }}
                className={`${commonClasses} ${field.id === 'NPSN Sekolah' ? 'pr-20' : ''}`}
                placeholder={`${field.label} (${maxLength} Digit)`}
              />
              {field.id === 'NPSN Sekolah' && (
                <button
                  type="button"
                  onClick={() => handleSearchSchool(formData[field.id])}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                >
                  Cek
                </button>
              )}
              {field.id === 'NPSN Sekolah' && isFetchingSchool && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                </div>
              )}
            </div>
          );
        }
        return (
          <input
            type="number"
            name={field.id}
            required={field.required}
            min="0"
            step="0.1"
            value={formData[field.id] || ''}
            onChange={handleChange}
            className={commonClasses}
            placeholder={field.label}
            onKeyPress={(e) => {
              if (!/[0-9.]/.test(e.key)) {
                e.preventDefault();
              }
            }}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            name={field.id}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={handleChange}
            className={commonClasses}
          />
        );
      default:
        return (
          <div className="relative group">
            <input
              type={field.type}
              name={field.id}
              required={field.required}
              value={formData[field.id] || ''}
              onChange={handleChange}
              className={`${commonClasses} ${field.id === 'Asal Sekolah' && isFetchingSchool
                ? 'bg-slate-50 pr-10'
                : ''
                }`}
              placeholder={field.label}
            />
            {field.id === 'Asal Sekolah' && isFetchingSchool && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100"
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-10 text-white text-center">
            <h2 className="text-3xl font-bold mb-2">Formulir Pendaftaran SPMB</h2>
            <p className="text-blue-100">Lengkapi data diri calon peserta didik dengan benar dan valid.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-10">

            {(() => {
              if (!settings?.formFields || !Array.isArray(settings.formFields)) return null;

              const elements: React.ReactNode[] = [];
              let currentGroup: FormField[] = [];
              let currentHeader: FormField | null = null;

              const renderGroup = (header: FormField | null, fields: FormField[], groupIdx: number) => {
                if (fields.length === 0 && !header) return null;

                const isFileGroup = fields.some(f => f.type === 'file');

                return (
                  <div key={header?.id || `group-${groupIdx}`} className="space-y-6">
                    {header && (
                      <div className="pt-4 first:pt-0">
                        <h3 className="text-lg font-bold text-slate-900 border-b-2 border-blue-500 pb-2 mb-6 flex items-center gap-2 uppercase tracking-wide">
                          {header.label}
                        </h3>
                      </div>
                    )}
                    <div className={isFileGroup ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
                      {fields.map((field, fIdx) => (
                        <div key={field.id || `${groupIdx}-${fIdx}`} className={field.type === 'textarea' ? 'col-span-1 md:col-span-2' : ''}>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            {field.label} {field.required && '*'}
                          </label>
                          {renderField(field)}

                          {field.id === 'Kode Pos' && (
                            <div className="col-span-1 md:col-span-2">
                              {/* Map section removed */}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {isFileGroup && (
                      <p className="text-sm text-slate-500 flex items-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <AlertCircle size={16} className="text-blue-500 shrink-0" />
                        Format file: JPG/PNG/PDF. Ukuran maksimal: 2MB per file.
                      </p>
                    )}
                  </div>
                );
              };

              let groupCount = 0;
              settings.formFields.forEach((field) => {
                if (field.type === 'header') {
                  if (currentHeader || currentGroup.length > 0) {
                    elements.push(renderGroup(currentHeader, currentGroup, groupCount++));
                  }
                  currentHeader = field;
                  currentGroup = [];
                } else {
                  currentGroup.push(field);
                }
              });

              if (currentHeader || currentGroup.length > 0) {
                elements.push(renderGroup(currentHeader, currentGroup, groupCount++));
              }

              return elements;
            })()}

            {/* Pernyataan Kebenaran Data */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                </div>
                <div className="text-sm text-slate-700">
                  <span className="font-semibold block mb-1">Pernyataan Kebenaran Data</span>
                  Saya menyatakan bahwa data yang saya isikan dalam formulir pendaftaran ini adalah benar dan dapat dipertanggungjawabkan. Apabila di kemudian hari ditemukan data yang tidak sesuai, saya bersedia menerima sanksi sesuai ketentuan yang berlaku.
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={24} />
                    Memproses...
                  </>
                ) : (
                  'Kirim Pendaftaran'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
