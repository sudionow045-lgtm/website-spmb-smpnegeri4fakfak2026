import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, CheckCircle, XCircle, Clock, Loader2, ArrowLeft, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { checkStatus } from '../services/api';
import { cn } from '../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSettings } from '../context/SettingsContext';

export default function CheckStatus() {
  const { settings } = useSettings();
  const [noPendaftaran, setNoPendaftaran] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    noPendaftaran: string;
    namaLengkap: string;
    status: string;
    alasanPenolakan?: string;
  } | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noPendaftaran.trim()) return;

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await checkStatus(noPendaftaran);
      if (response.status === 'success') {
        setResult(response.data);
      } else {
        setError(response.message || 'Data tidak ditemukan');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menghubungi server');
    } finally {
      setIsLoading(false);
    }
  };

  const printBuktiLulus = (data: any) => {
    if (!data) return;

    const doc = new jsPDF() as any;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let currentY = 20;

    // 1. Draw Page Border
    doc.setDrawColor(37, 99, 235); // blue-600
    doc.setLineWidth(0.5);
    doc.rect(margin - 10, margin - 10, pageWidth - (margin * 2) + 20, pageHeight - (margin * 2) + 20);

    // 2. Header (Kop Surat)
    if (settings?.kopSurat) {
      try {
        doc.addImage(settings.kopSurat, 'JPEG', margin, 15, pageWidth - (margin * 2), 35);
        currentY = 55;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.8);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        doc.setLineWidth(0.2);
        doc.line(margin, currentY + 1, pageWidth - margin, currentY + 1);
        currentY += 10;
      } catch (e) {
        console.error("Error adding kop surat", e);
      }
    } else {
      // Default Header if no kopSurat
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(settings?.namaSekolah || 'SMP NEGERI 4 FAKFAK', 105, currentY, { align: 'center' });
      currentY += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(settings?.alamat || '', 105, currentY, { align: 'center' });
      currentY += 10;
      doc.setLineWidth(0.8);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;
    }

    // 3. Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('BUKTI KELULUSAN SPMB', 105, currentY, { align: 'center' });
    currentY += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tahun Ajaran ${settings?.tahunPendaftaran || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`}`, 105, currentY, { align: 'center' });
    currentY += 6;
    if (settings?.nomorSurat) {
      doc.setFontSize(11);
      doc.text(`Nomor: ${settings.nomorSurat}`, 105, currentY, { align: 'center' });
      currentY += 6;
    }
    currentY += 10;

    // 4. Content Text
    doc.setFontSize(11);
    doc.text('Berdasarkan hasil seleksi Penerimaan Peserta Didik Baru (SPMB),', margin, currentY);
    currentY += 7;
    doc.text('Panitia Seleksi menyatakan bahwa:', margin, currentY);
    currentY += 15;

    // Get name with multiple fallbacks to ensure it shows up
    const studentName = data.namaLengkap || data['Nama Lengkap'] || data['Nama Lengkap (Sesuai Ijazah/Akta)'] || '-';

    // 5. Data Table (Simplified for certificate look)
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin + 10, right: margin + 10 },
      body: [
        ['No. Pendaftaran', ': ' + (data.noPendaftaran || data['No Pendaftaran'] || '-')],
        ['Nama Lengkap', ': ' + studentName],
        ['Status', { content: ': LULUS', styles: { fontStyle: 'bold', textColor: [0, 128, 0] } }]
      ],
      theme: 'plain',
      styles: { fontSize: 12, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // 6. Requirements
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Keterangan:', margin, currentY);
    currentY += 7;
    doc.setFont('helvetica', 'normal');
    doc.text('Peserta yang dinyatakan LULUS diharapkan segera melakukan daftar ulang pada:', margin, currentY);
    currentY += 7;

    if (settings?.tanggalDaftarUlang) {
      const tgl = new Date(settings.tanggalDaftarUlang).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.text(`Tanggal: ${tgl}`, margin + 5, currentY);
      currentY += 7;
    }

    doc.text('Dengan membawa persyaratan sebagai berikut:', margin, currentY);
    currentY += 7;

    const reqText = settings?.persyaratanDaftarUlang || '1. Bukti Kelulusan ini (dicetak)\n2. Fotokopi Akta Kelahiran (2 lembar)\n3. Fotokopi Kartu Keluarga (2 lembar)\n4. Pas Foto 3x4 (4 lembar)';
    const splitReq = doc.splitTextToSize(reqText, pageWidth - (margin * 2) - 10);
    doc.text(splitReq, margin + 5, currentY);

    currentY += splitReq.length * 6 + 20;

    // 7. Signature Area
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    const tempat = settings?.tempatSurat || 'Fakfak';
    const tanggal = settings?.tanggalSurat || dateStr;

    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = margin + 20;
    }

    const sigX = pageWidth - margin - 70;
    doc.text(`${tempat}, ${tanggal}`, sigX, currentY);
    doc.text('Kepala Sekolah,', sigX, currentY + 6);

    if (settings?.stempelSekolah) {
      try {
        doc.addImage(settings.stempelSekolah, 'PNG', sigX - 15, currentY + 8, 35, 35);
      } catch (e) { }
    }

    if (settings?.tandaTanganKepalaSekolah) {
      try {
        doc.addImage(settings.tandaTanganKepalaSekolah, 'PNG', sigX, currentY + 10, 45, 20);
      } catch (e) { }
    }

    doc.setFont('helvetica', 'bold');
    doc.text(settings?.namaKepalaSekolah || 'Kepala Sekolah', sigX, currentY + 38);
    doc.setFont('helvetica', 'normal');
    if (settings?.nipKepalaSekolah) {
      doc.text(`NIP. ${settings.nipKepalaSekolah}`, sigX, currentY + 43);
    }

    // 8. Catatan Tambahan
    if (settings?.catatanTambahan) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      const splitCatatan = doc.splitTextToSize(`*Catatan: ${settings.catatanTambahan}`, pageWidth - (margin * 2));
      doc.text(splitCatatan, margin, pageHeight - margin - 10);
    }

    doc.save(`Bukti_Kelulusan_${data.noPendaftaran}.pdf`);
  };

  const getStatusDisplay = (status: string, data?: any) => {
    let displayStatus = status;
    if (settings?.tanggalPengumuman) {
      const pengumumanDate = new Date(settings.tanggalPengumuman);
      const now = new Date();
      // Reset hours to compare just dates, or compare exact time. Let's compare exact time or start of day.
      // Usually it's start of day.
      pengumumanDate.setHours(0, 0, 0, 0);
      if (now < pengumumanDate) {
        displayStatus = 'Proses';
      }
    }

    switch (displayStatus) {
      case 'Lulus':
        return (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">Selamat! Anda Lulus</h3>
            <p className="text-green-700 mb-4">Silakan cetak bukti kelulusan dan lakukan daftar ulang.</p>

            <div className="bg-white rounded-lg p-4 border border-green-100 text-left mb-4">
              <h4 className="font-semibold text-green-800 mb-2 text-sm">Persyaratan Daftar Ulang:</h4>
              {settings?.tanggalDaftarUlang && (
                <p className="text-sm text-green-700 mb-2 font-medium">Tanggal Daftar Ulang: {new Date(settings.tanggalDaftarUlang).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              )}
              <div className="text-sm text-green-700 whitespace-pre-line">
                {settings?.persyaratanDaftarUlang || '1. Membawa Bukti Kelulusan yang dicetak\n2. Membawa Fotokopi Akta Kelahiran (2 lembar)\n3. Membawa Fotokopi Kartu Keluarga (2 lembar)\n4. Membawa Pas Foto 3x4 (4 lembar)\n5. Melakukan pembayaran administrasi awal'}
              </div>
            </div>

            <button
              onClick={() => printBuktiLulus(data)}
              className="inline-flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-sm"
            >
              <Printer size={20} /> Cetak Bukti Kelulusan
            </button>
          </div>
        );
      case 'Tidak Lulus':
        return (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="text-red-600" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-red-800 mb-2">Mohon Maaf, Anda Tidak Lulus</h3>
            <p className="text-red-700 mb-4">Tetap semangat dan jangan menyerah.</p>
            {data?.alasanPenolakan && (
              <div className="bg-white rounded-lg p-4 border border-red-100 text-left">
                <h4 className="font-semibold text-red-800 mb-1 text-sm">Alasan:</h4>
                <p className="text-sm text-red-700 whitespace-pre-line">{data.alasanPenolakan}</p>
              </div>
            )}
          </div>
        );
      default:
        const isBeforePengumuman = settings?.tanggalPengumuman && new Date() < new Date(new Date(settings.tanggalPengumuman).setHours(0, 0, 0, 0));
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="text-amber-600" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-amber-800 mb-2">Data Sedang Diproses</h3>
            <p className="text-amber-700">
              {isBeforePengumuman
                ? `Pengumuman kelulusan akan dibuka pada tanggal ${new Date(settings.tanggalPengumuman!).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.`
                : 'Berkas Anda sedang dalam tahap verifikasi panitia.'}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full">
        <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 mb-6 transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Kembali ke Beranda
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100"
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">Cek Status Kelulusan</h2>
            <p className="text-blue-100 text-sm">Masukkan nomor pendaftaran Anda untuk melihat hasil seleksi SPMB.</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSearch} className="mb-8">
              <label className="block text-sm font-medium text-slate-700 mb-2">Nomor Pendaftaran</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={noPendaftaran}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNoPendaftaran(e.target.value)}
                  className="flex-grow px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Contoh: SPMB-YYYY-XXX"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-70 flex items-center justify-center"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                </button>
              </div>
            </form>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 text-red-600 p-4 rounded-xl text-sm text-center border border-red-100">
                {error}
              </motion.div>
            )}

            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="block text-slate-500 mb-1">No. Pendaftaran</span>
                      <span className="font-semibold text-slate-900">{result.noPendaftaran}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 mb-1">Nama Lengkap</span>
                      <span className="font-semibold text-slate-900">{result.namaLengkap || (result as any)['Nama Lengkap'] || (result as any)['Nama Lengkap (Sesuai Ijazah/Akta)'] || '-'}</span>
                    </div>
                  </div>
                </div>

                {getStatusDisplay(result.status, result)}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
