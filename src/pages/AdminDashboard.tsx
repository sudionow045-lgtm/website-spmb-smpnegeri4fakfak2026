import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LogOut, Eye, Check, X, Download, Menu, X as XIcon, Settings, ChevronLeft, ChevronRight, Search, Moon, Sun, CheckCircle, XCircle, Maximize2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminData, fetchAdminData, updateStudentStatus } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '../utils/cn';

export default function AdminDashboard() {
  const { settings, refreshSettings } = useSettings();
  const [data, setData] = useState<AdminData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AdminData | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
  const [settingsTab, setSettingsTab] = useState<'school' | 'form' | 'surat' | 'daftar-ulang' | 'kepala-sekolah' | 'panduan'>('school');
  const itemsPerPage = 10;
  const navigate = useNavigate();

  // Settings State
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchAdminData();
        if (result?.status === 'success' && Array.isArray(result.data)) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const getFieldValue = useCallback((item: any, fieldName: string): string => {
    if (!item) return '';
    
    const variations = [
      fieldName,
      fieldName.toLowerCase(),
      fieldName.replace(/\s+/g, '_'),
      fieldName.replace(/\s+/g, ''),
    ];

    for (const variation of variations) {
      if (item[variation] !== undefined && item[variation] !== null) {
        return String(item[variation]).trim();
      }
    }

    for (const key of Object.keys(item)) {
      if (key.toLowerCase() === fieldName.toLowerCase()) {
        return String(item[key]).trim();
      }
    }

    return '';
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    navigate('/admin/login');
  };

  const handleUpdateStatus = async (noPendaftaran: string, newStatus: string) => {
    const result = await Swal.fire({
      title: 'Ubah Status?',
      text: `Ubah status pendaftar menjadi ${newStatus}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Ubah!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const response = await updateStudentStatus(noPendaftaran, newStatus);
        if (response.status === 'success') {
          setData(data.map(item => 
            item['No Pendaftaran'] === noPendaftaran 
              ? { ...item, Status: newStatus }
              : item
          ));
          if (selectedStudent?.['No Pendaftaran'] === noPendaftaran) {
            setSelectedStudent({ ...selectedStudent, Status: newStatus });
          }
          Swal.fire('Berhasil!', 'Status pendaftar berhasil diubah.', 'success');
        }
      } catch (error) {
        Swal.fire('Error!', 'Gagal mengubah status.', 'error');
      }
    }
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('id-ID', options);
    } catch {
      return dateStr;
    }
  };

  const formatDateStr = (dateStr: string): string => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const calculateAge = (birthDateStr: string, cutoffDateStr?: string): string => {
    if (!birthDateStr) return '-';
    try {
      const birthDate = new Date(birthDateStr);
      const today = cutoffDateStr ? new Date(cutoffDateStr) : new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      const months = (monthDiff + 12) % 12;
      return `${age} tahun ${months} bulan`;
    } catch {
      return '-';
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClass = "px-3 py-1 rounded-full text-xs font-semibold";
    switch (status) {
      case 'Lulus':
        return <span className={cn(baseClass, "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400")}>Lulus</span>;
      case 'Tidak Lulus':
        return <span className={cn(baseClass, "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400")}>Tidak Lulus</span>;
      default:
        return <span className={cn(baseClass, "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400")}>Proses</span>;
    }
  };

  const printCard = async (student: AdminData) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [210, 140] });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const cardHeight = 120;

    // 1. Border
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin + 2, margin + 2, pageWidth - (margin * 2) - 4, cardHeight - 4);

    // 2. Header
    doc.setFillColor(37, 99, 235);
    doc.rect(margin + 2, margin + 2, pageWidth - (margin * 2) - 4, 35, 'F');

    // Logo if exists
    if (settings?.logoSekolah) {
      try {
        const logoBase64 = await getBase64FromUrl(settings.logoSekolah);
        if (logoBase64) {
          doc.addImage(logoBase64, 'PNG', margin + 8, margin + 7, 25, 25);
        }
      } catch (e) { }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("KARTU PENDAFTARAN SPMB", 110, margin + 15, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const schoolName = settings?.namaSekolah || 'SMP NEGERI 4 FAKFAK';
    doc.text(schoolName, 110, margin + 23, { align: "center" });

    doc.setFontSize(9);
    doc.text(`Tahun Pelajaran: ${settings?.tahunPendaftaran || '2026/2027'}`, 110, margin + 30, { align: "center" });

    // 3. Content
    doc.setTextColor(0, 0, 0);
    let currentY = margin + 45;

    // Student Photo (Top Right)
    const photoUrl = getStudentPhoto(student);

    if (photoUrl) {
      try {
        const photoBase64 = await getBase64FromUrl(photoUrl);
        if (photoBase64) {
          doc.addImage(photoBase64, 'JPEG', pageWidth - margin - 40, currentY, 30, 40);
        }
      } catch (e) { }
    } else {
      doc.setDrawColor(200, 200, 200);
      doc.rect(pageWidth - margin - 40, currentY, 30, 40);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("PAS FOTO 3X4", pageWidth - margin - 25, currentY + 20, { align: 'center' });
    }

    // 4. Data Table
    const tableData = [
      ['No. Pendaftaran', ': ' + (student['No Pendaftaran'] || '-')],
      ['Nama Lengkap', ': ' + (getFieldValue(student, 'Nama Lengkap') || student['Nama Lengkap'] || student['Nama Lengkap (Sesuai Ijazah/Akta)'] || '-')],
      ['NISN', ': ' + (getFieldValue(student, 'NISN') || student['NISN'] || '-')],
      ['NIK', ': ' + (getFieldValue(student, 'NIK') || student['NIK'] || '-')],
      ['Tempat, Tgl Lahir', ': ' + (getFieldValue(student, 'Tempat Lahir') || '-') + ', ' + formatDateStr(getFieldValue(student, 'Tanggal Lahir'))],
      ['Jenis Kelamin', ': ' + (getFieldValue(student, 'Jenis Kelamin') || '-')],
      ['Sekolah Asal', ': ' + (getFieldValue(student, 'Asal Sekolah') || student['Asal Sekolah'] || student['Nama Sekolah Asal (SD/MI)'] || '-')],
      ['Status', ': ' + (student.Status || 'Proses')]
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin + 5, right: margin + 45 },
      body: tableData,
      theme: 'plain',
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold', fontSize: 9 },
        1: { cellWidth: 120, fontSize: 9 }
      },
      didDrawCell: (data: any) => {
        if (data.column.index === 0) {
          data.cell.styles.textColor = [0, 0, 0];
        }
      }
    });

    // 5. Signatures
    const sigY = doc.internal.pageSize.getHeight() - 20;
    const sigX = pageWidth - margin - 40;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");

    if (settings?.fotoKepalaSekolah) {
      try {
        const fotoBase64 = await getBase64FromUrl(settings.fotoKepalaSekolah);
        if (fotoBase64) {
          doc.addImage(fotoBase64, 'JPEG', sigX - 10, sigY - 30, 20, 25);
        }
      } catch (e) { }
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(settings?.namaKepalaSekolah || '-', sigX, sigY, { align: 'center' });
    doc.text(`NIP. ${settings?.nipKepalaSekolah || '-'}`, sigX, sigY + 35);

    // 6. Footer Info
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setDrawColor(230, 230, 230);
    doc.line(margin + 5, margin + cardHeight - 10, pageWidth - margin - 5, margin + cardHeight - 10);
    doc.text("Kartu ini wajib dibawa saat verifikasi berkas dan tes seleksi.", 105, margin + cardHeight - 5, { align: "center" });

    doc.save(`Kartu_SPMB_${student['No Pendaftaran']}.pdf`);
  };

  const filteredData = useMemo(() => {
    return data.filter((item: AdminData) => {
      const nama = getFieldValue(item, 'Nama Lengkap') || '';
      const nik = getFieldValue(item, 'NIK') || '';
      const noPendaftaran = item['No Pendaftaran'] || '';
      
      const matchesSearch = nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           nik.includes(searchTerm) ||
                           noPendaftaran.includes(searchTerm);
      const matchesStatus = statusFilter === 'Semua' || item.Status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [data, searchTerm, statusFilter, getFieldValue]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIdx, startIdx + itemsPerPage);

  const getBase64FromUrl = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      return null;
    }
  };

  const getStudentPhoto = (student: AdminData): string => {
    const photoUrl = getFieldValue(student, 'Foto') || 
                    getFieldValue(student, 'Pas Foto') || 
                    (student as any)['Pas Foto'] ||
                    (student as any)['Foto'];
    return photoUrl || '';
  };

  const handleSaveSettings = async () => {
    try {
      await Swal.fire({
        title: 'Menyimpan...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
      
      await refreshSettings(localSettings);
      
      Swal.fire('Berhasil!', 'Pengaturan berhasil disimpan.', 'success');
    } catch (error) {
      Swal.fire('Error!', 'Gagal menyimpan pengaturan.', 'error');
    }
  };

  return (
    <div className={cn("min-h-screen", isDarkMode ? "bg-slate-900 text-white" : "bg-slate-50")}>
      {/* Header */}
      <div className={cn("sticky top-0 z-40 border-b", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Dashboard Admin SPMB</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn("p-2 rounded-lg", isDarkMode ? "bg-slate-700 text-yellow-400" : "bg-slate-200 text-slate-600")}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={cn("px-4 py-2 font-medium border-b-2 transition-colors", 
              activeTab === 'dashboard' 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-slate-600 dark:text-slate-400"
            )}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn("px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2",
              activeTab === 'settings' 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-slate-600 dark:text-slate-400"
            )}
          >
            <Settings size={18} /> Pengaturan
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={cn("p-6 rounded-lg border", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Total Pendaftar</p>
                <p className="text-3xl font-bold text-blue-600">{data.length}</p>
              </div>
              <div className={cn("p-6 rounded-lg border", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Lulus</p>
                <p className="text-3xl font-bold text-green-600">{data.filter(d => d.Status === 'Lulus').length}</p>
              </div>
              <div className={cn("p-6 rounded-lg border", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Tidak Lulus</p>
                <p className="text-3xl font-bold text-red-600">{data.filter(d => d.Status === 'Tidak Lulus').length}</p>
              </div>
              <div className={cn("p-6 rounded-lg border", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Proses</p>
                <p className="text-3xl font-bold text-yellow-600">{data.filter(d => d.Status === 'Proses').length}</p>
              </div>
            </div>

            {/* Search & Filter */}
            <div className={cn("rounded-lg border p-4 space-y-4", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama, NIK, atau No. Pendaftaran..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={cn("w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none", isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-300")}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={cn("px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none", isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-300")}
                >
                  <option>Semua</option>
                  <option>Proses</option>
                  <option>Lulus</option>
                  <option>Tidak Lulus</option>
                </select>
              </div>
            </div>

            {/* Data Table */}
            <div className={cn("rounded-xl shadow-sm border overflow-hidden", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className={isDarkMode ? "bg-slate-700 text-slate-200" : "bg-blue-50 text-blue-800"}>
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">No. Pendaftaran</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Nama Lengkap</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Usia</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Batas Hitung Usia</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Jarak Rumah Dengan Sekolah</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">NIK</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className={cn("divide-y", isDarkMode ? "divide-slate-700" : "divide-slate-200")}>
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                          Tidak ada data pendaftar
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((item: AdminData, idx: number) => (
                        <tr
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.05 }}
                          key={item['No Pendaftaran']}
                          className={cn("hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors")}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                            {item['No Pendaftaran']}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium">{getFieldValue(item, 'Nama Lengkap') || '-'}</div>
                            <div className={cn("text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>{getFieldValue(item, 'Tempat Lahir') || '-'}, {formatDate(getFieldValue(item, 'Tanggal Lahir'))}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {calculateAge(getFieldValue(item, 'Tanggal Lahir'), settings?.tanggalCutoffUsia)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {formatDate(settings?.tanggalCutoffUsia || '')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {getFieldValue(item, 'Jarak Rumah Dengan Sekolah') || item['Jarak ke Sekolah (km)'] ? `${getFieldValue(item, 'Jarak Rumah Dengan Sekolah') || item['Jarak ke Sekolah (km)']} km` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                            {getFieldValue(item, 'NIK') || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {getStatusBadge(item.Status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => setSelectedStudent(item)} className="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 px-2 py-1 rounded transition-colors" title="Lihat Detail">
                                <Eye size={18} />
                              </button>
                              {item.Status !== 'Lulus' && (
                                <button onClick={() => handleUpdateStatus(item['No Pendaftaran'], 'Lulus')} className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50 px-2 py-1 rounded transition-colors" title="Ubah ke Lulus">
                                  <CheckCircle size={18} />
                                </button>
                              )}
                              {item.Status !== 'Tidak Lulus' && (
                                <button onClick={() => handleUpdateStatus(item['No Pendaftaran'], 'Tidak Lulus')} className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 px-2 py-1 rounded transition-colors" title="Ubah ke Tidak Lulus">
                                  <XCircle size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className={cn("text-sm", isDarkMode ? "text-slate-400" : "text-slate-600")}>
                  Halaman {currentPage} dari {totalPages} ({filteredData.length} data)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn("px-3 py-2 rounded-lg border transition-colors",
                        currentPage === page
                          ? "bg-blue-600 text-white border-blue-600"
                          : "hover:bg-slate-100 dark:hover:bg-slate-700"
                      )}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Detail Modal */}
            {selectedStudent && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className={cn("rounded-xl max-w-2xl w-full max-h-96 overflow-y-auto", isDarkMode ? "bg-slate-800" : "bg-white")}>
                  <div className="sticky top-0 flex items-center justify-between p-6 border-b" style={{backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc'}}>
                    <h2 className="text-xl font-bold">Detail Pendaftar</h2>
                    <button onClick={() => setSelectedStudent(null)} className="text-slate-600 hover:text-slate-900 dark:text-slate-400">
                      <XIcon size={24} />
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Photo */}
                    <div className="flex justify-center">
                      <div className="relative group w-48 h-64 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        {(() => {
                          const photoUrl = getStudentPhoto(selectedStudent);
                          return photoUrl ? (
                            <>
                              <img
                                src={photoUrl}
                                alt="Foto siswa"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(getFieldValue(selectedStudent, 'Nama Lengkap') || 'Siswa') + '&background=random&size=200';
                                }}
                                style={{
                                  imageRendering: 'auto',
                                  filter: 'brightness(1.08) contrast(1.12) saturate(1.1)'
                                }}
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize2 size={20} className="text-white" />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <User size={48} />
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg leading-tight mb-1">{getFieldValue(selectedStudent, 'Nama Lengkap') || 'Nama Tidak Tersedia'}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">NIK: {getFieldValue(selectedStudent, 'NIK') || '-'}</p>

                      <div className="grid grid-cols-2 gap-2 text-left">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Usia</p>
                          <p className="text-xs font-bold truncate">{calculateAge(getFieldValue(selectedStudent, 'Tanggal Lahir'), settings?.tanggalCutoffUsia).split(' ')[0]} Thn</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">NISN</p>
                          <p className="text-xs font-bold truncate">{getFieldValue(selectedStudent, 'NISN') || '-'}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Tempat Lahir</p>
                          <p className="text-xs font-bold truncate">{getFieldValue(selectedStudent, 'Tempat Lahir') || '-'}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Tanggal Lahir</p>
                          <p className="text-xs font-bold truncate">{formatDate(getFieldValue(selectedStudent, 'Tanggal Lahir'))}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Jarak</p>
                          <p className="text-xs font-bold truncate">{getFieldValue(selectedStudent, 'Jarak Rumah Dengan Sekolah') || selectedStudent['Jarak ke Sekolah (km)'] || '-'} km</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Tindakan Cepat</p>
                      <div className="grid grid-cols-1 gap-2">
                        {selectedStudent.Status !== 'Lulus' && (
                          <button
                            onClick={() => handleUpdateStatus(selectedStudent['No Pendaftaran'], 'Lulus')}
                            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md"
                          >
                            <CheckCircle size={18} /> Luluskan
                          </button>
                        )}
                        {selectedStudent.Status !== 'Tidak Lulus' && (
                          <button
                            onClick={() => handleUpdateStatus(selectedStudent['No Pendaftaran'], 'Tidak Lulus')}
                            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md"
                          >
                            <XCircle size={18} /> Tolak Pendaftar
                          </button>
                        )}
                        <button
                          onClick={() => printCard(selectedStudent)}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md"
                        >
                          <Download size={18} /> Cetak Kartu
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className={cn("rounded-lg border p-6 space-y-6", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setSettingsTab('school')}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap",
                  settingsTab === 'school'
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                )}
              >
                Sekolah
              </button>
              <button
                onClick={() => setSettingsTab('kepala-sekolah')}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap",
                  settingsTab === 'kepala-sekolah'
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                )}
              >
                Kepala Sekolah
              </button>
              <button
                onClick={() => setSettingsTab('panduan')}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap",
                  settingsTab === 'panduan'
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                )}
              >
                Panduan Pendaftaran
              </button>
            </div>

            <div className="space-y-6">
              {settingsTab === 'school' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Nama Sekolah</label>
                    <input
                      type="text"
                      value={localSettings.namaSekolah}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, namaSekolah: e.target.value })}
                      className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                    />
                  </div>
                  <div>
                    <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>NPSN</label>
                    <input
                      type="text"
                      value={localSettings.npsn}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, npsn: e.target.value })}
                      className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Logo Sekolah (URL)</label>
                    <input
                      type="url"
                      value={localSettings.logoSekolah}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, logoSekolah: e.target.value })}
                      className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              )}

              {settingsTab === 'kepala-sekolah' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Profil Kepala Sekolah</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Nama Kepala Sekolah</label>
                      <input
                        type="text"
                        value={localSettings.namaKepalaSekolah || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, namaKepalaSekolah: e.target.value })}
                        className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                        placeholder="Contoh: Drs. H. Ahmad, M.Pd."
                      />
                    </div>

                    <div>
                      <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>NIP Kepala Sekolah</label>
                      <input
                        type="text"
                        value={localSettings.nipKepalaSekolah || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, nipKepalaSekolah: e.target.value })}
                        className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                      />
                    </div>

                    <div>
                      <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Foto Kepala Sekolah (URL)</label>
                      <input
                        type="url"
                        value={localSettings.fotoKepalaSekolah || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, fotoKepalaSekolah: e.target.value })}
                        className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'panduan' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Panduan Pendaftaran</h3>
                  <p className={cn("text-sm", isDarkMode ? "text-slate-400" : "text-slate-600")}>
                    Konten panduan pendaftaran akan ditampilkan di halaman panduan pendaftaran.
                  </p>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-2 pt-6 border-t" style={{borderColor: isDarkMode ? '#475569' : '#e2e8f0'}}>
              <button
                onClick={() => setLocalSettings(settings)}
                className="px-6 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setShowPhotoModal(null)}>
          <img src={showPhotoModal} alt="Foto siswa" className="max-w-2xl max-h-96 rounded-lg" />
        </div>
      )}
    </div>
  );
}
