import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Download, Printer, CheckCircle, XCircle, Clock, FileText, Moon, Sun, Loader2, LogOut, Eye, X, Settings, LayoutDashboard, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getRegistrations, updateStatus, AdminData, updateSettings, formatDateForInput } from '../services/api';
import { cn, compressImage } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const calculateAge = (dateString: string, cutoffDateString?: string) => {
  if (!dateString) return '-';
  const birthDate = new Date(dateString);
  if (isNaN(birthDate.getTime())) return '-';

  let today = new Date();
  if (cutoffDateString) {
    const cutoff = new Date(cutoffDateString);
    if (!isNaN(cutoff.getTime())) {
      today = cutoff;
    }
  }

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return `${years} Tahun ${months} Bulan ${days} Hari`;
};

export default function AdminDashboard() {
  const { settings, refreshSettings } = useSettings();
  const [data, setData] = useState<AdminData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AdminData | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
  const [settingsTab, setSettingsTab] = useState<'school' | 'form' | 'surat' | 'daftar-ulang' | 'kepala-sekolah' | 'panduan'>('school');
  const itemsPerPage = 10;
  const navigate = useNavigate();

  // Settings State
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  const getFieldValue = (item: AdminData, fieldId: string) => {
    const field = settings?.formFields?.find((f) => f.id === fieldId);
    if (field && item[field.label] !== undefined) {
      return item[field.label];
    }
    return item[fieldId];
  };

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('isAdmin');
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await getRegistrations();
      setData(result);
    } catch (error) {
      Swal.fire('Error', 'Gagal mengambil data dari server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Keluar?',
      text: "Anda akan keluar dari sesi admin.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        sessionStorage.removeItem('isAdmin');
        navigate('/admin/login');
      }
    });
  };

  const handleUpdateStatus = async (noPendaftaran: string, newStatus: string) => {
    try {
      let alasan = undefined;

      if (newStatus === 'Tidak Lulus') {
        const { value: text, isConfirmed } = await Swal.fire({
          title: 'Alasan Tidak Lulus',
          input: 'textarea',
          inputLabel: 'Berikan alasan mengapa pendaftar tidak lulus',
          inputPlaceholder: 'Contoh: Usia belum mencukupi...',
          showCancelButton: true,
          confirmButtonText: 'Simpan',
          cancelButtonText: 'Batal',
          inputValidator: (value: string) => {
            if (!value) {
              return 'Alasan harus diisi!';
            }
          }
        });

        if (!isConfirmed) return;
        alasan = text;
      }

      Swal.fire({
        title: 'Memproses...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      await updateStatus(noPendaftaran, newStatus, alasan);

      setData((prev: AdminData[]) => prev.map((item: AdminData) =>
        item['No Pendaftaran'] === noPendaftaran ? { ...item, Status: newStatus as any, 'Alasan Penolakan': alasan } : item
      ));

      if (selectedStudent && selectedStudent['No Pendaftaran'] === noPendaftaran) {
        setSelectedStudent((prev: AdminData | null) => prev ? { ...prev, Status: newStatus as any, 'Alasan Penolakan': alasan } : null);
      }

      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: `Status berhasil diubah menjadi ${newStatus}`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Error', 'Gagal mengupdate status', 'error');
    }
  };

  const handleSaveSettings = async () => {
    if (!localSettings) return;
    setIsSavingSettings(true);
    try {
      await updateSettings(localSettings);
      await refreshSettings();
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Pengaturan berhasil disimpan',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Error', 'Gagal menyimpan pengaturan', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const exportToExcel = () => {
    const exportData = data.map((item: AdminData) => {
      const formattedItem: Record<string, any> = { ...item };

      const tglLahir = getFieldValue(item, 'Tanggal Lahir');
      if (tglLahir) {
        formattedItem['Tanggal Lahir'] = formatDate(tglLahir);
        formattedItem['Usia'] = calculateAge(tglLahir, settings?.tanggalCutoffUsia);
        formattedItem['Batas Tanggal Hitung Usia'] = formatDate(settings?.tanggalCutoffUsia || '');
      }

      if (item['Koordinat Lokasi']) {
        formattedItem['Link Maps'] = `https://www.google.com/maps/search/?api=1&query=${item['Koordinat Lokasi']}`;
      }

      Object.keys(formattedItem).forEach(key => {
        if (typeof formattedItem[key] === 'string' && formattedItem[key].startsWith('data:')) {
          formattedItem[key] = 'File Terlampir (Lihat di Dashboard)';
        }
      });

      return formattedItem;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Pendaftar");
    XLSX.writeFile(wb, `Data_SPMB_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const printCard = (student: AdminData) => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(37, 99, 235); // blue-600
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("KARTU PENDAFTARAN SPMB", 105, 20, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(settings?.namaSekolah || "Sekolah Dasar", 105, 30, { align: "center" });

    // Content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);

    const startY = 60;
    const lineHeight = 10;

    doc.setFont("helvetica", "bold");
    doc.text("No. Pendaftaran:", 20, startY);
    doc.setFont("helvetica", "normal");
    doc.text(student['No Pendaftaran'], 70, startY);

    doc.setFont("helvetica", "bold");
    doc.text("Nama Lengkap:", 20, startY + lineHeight);
    doc.setFont("helvetica", "normal");
    doc.text(getFieldValue(student, 'Nama Lengkap') || '-', 70, startY + lineHeight);

    doc.setFont("helvetica", "bold");
    doc.text("NIK:", 20, startY + lineHeight * 2);
    doc.setFont("helvetica", "normal");
    doc.text(getFieldValue(student, 'NIK') || '-', 70, startY + lineHeight * 2);

    doc.setFont("helvetica", "bold");
    doc.text("TTL:", 20, startY + lineHeight * 3);
    doc.setFont("helvetica", "normal");
    doc.text(`${getFieldValue(student, 'Tempat Lahir') || '-'}, ${formatDate(getFieldValue(student, 'Tanggal Lahir'))}`, 70, startY + lineHeight * 3);

    doc.setFont("helvetica", "bold");
    doc.text("Usia:", 20, startY + lineHeight * 4);
    doc.setFont("helvetica", "normal");
    doc.text(calculateAge(getFieldValue(student, 'Tanggal Lahir'), settings?.tanggalCutoffUsia), 70, startY + lineHeight * 4);

    doc.setFont("helvetica", "bold");
    doc.text("Batas Usia:", 20, startY + lineHeight * 5);
    doc.setFont("helvetica", "normal");
    doc.text(formatDate(settings?.tanggalCutoffUsia || ''), 70, startY + lineHeight * 5);

    doc.setFont("helvetica", "bold");
    doc.text("Status:", 20, startY + lineHeight * 6);
    doc.setFont("helvetica", "normal");
    doc.text(student.Status, 70, startY + lineHeight * 6);

    // Footer
    doc.setDrawColor(200, 200, 200);
    doc.line(20, startY + lineHeight * 8, 190, startY + lineHeight * 8);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Kartu ini adalah bukti sah pendaftaran SPMB ${settings?.namaSekolah || 'Sekolah'}.`, 105, startY + lineHeight * 9, { align: "center" });
    doc.text(`Dicetak pada: ${new Date().toLocaleString()}`, 105, startY + lineHeight * 9.5, { align: "center" });

    // Box around everything
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1);
    doc.rect(10, 10, 190, 160);

    doc.save(`Kartu_SPMB_${student['No Pendaftaran']}.pdf`);
  };

  const filteredData = useMemo(() => {
    return data.filter((item: AdminData) => {
      const nama = getFieldValue(item, 'Nama Lengkap') || '';
      const nik = getFieldValue(item, 'NIK') || '';
      const no = item['No Pendaftaran'] || '';

      const matchesSearch = nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nik.includes(searchTerm) ||
        no.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = statusFilter === 'Semua' || item.Status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [data, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Lulus':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"><CheckCircle size={12} /> Lulus</span>;
      case 'Tidak Lulus':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"><XCircle size={12} /> Tidak Lulus</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"><Clock size={12} /> Proses</span>;
    }
  };

  return (
    <div className={cn("min-h-screen transition-colors duration-300", isDarkMode ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
            <p className={cn("mt-1", isDarkMode ? "text-slate-400" : "text-slate-500")}>Kelola data pendaftaran SPMB {settings?.namaSekolah || 'Sekolah'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn("p-2 rounded-full transition-colors", isDarkMode ? "bg-slate-800 text-yellow-400 hover:bg-slate-700" : "bg-white text-slate-600 hover:bg-slate-100 shadow-sm border border-slate-200")}
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6 border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors",
              activeTab === 'dashboard'
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            )}
          >
            <LayoutDashboard size={18} /> Data Pendaftar
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              "px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors",
              activeTab === 'settings'
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            )}
          >
            <Settings size={18} /> Pengaturan
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {[
                { label: 'Total Pendaftar', value: data.length, color: 'bg-blue-500 text-white border-blue-600 shadow-md' },
                { label: 'Lulus', value: data.filter((item: AdminData) => item.Status === 'Lulus').length, color: 'bg-green-500 text-white border-green-600 shadow-md' },
                { label: 'Tidak Lulus', value: data.filter((item: AdminData) => item.Status === 'Tidak Lulus').length, color: 'bg-red-500 text-white border-red-600 shadow-md' },
                { label: 'Laki-laki', value: data.filter((item: AdminData) => { const jk = getFieldValue(item, 'Jenis Kelamin'); return jk && jk.toLowerCase().includes('laki'); }).length, color: 'bg-indigo-500 text-white border-indigo-600 shadow-md' },
                { label: 'Perempuan', value: data.filter((item: AdminData) => { const jk = getFieldValue(item, 'Jenis Kelamin'); return jk && jk.toLowerCase().includes('perempuan'); }).length, color: 'bg-pink-500 text-white border-pink-600 shadow-md' },
              ].map((stat, idx) => (
                <div key={idx} className={cn("p-4 rounded-xl border flex flex-col items-center justify-center text-center", stat.color)}>
                  <span className="text-sm font-medium opacity-90 mb-1">{stat.label}</span>
                  <span className="text-3xl font-bold">{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Filters & Search */}
            <div className={cn("rounded-xl shadow-sm border p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
              <div className="relative w-full md:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className={isDarkMode ? "text-slate-400" : "text-slate-400"} />
                </div>
                <input
                  type="text"
                  placeholder="Cari Nama, NIK, atau No. Pendaftaran..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className={cn("block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors",
                    isDarkMode ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500" : "bg-white border-slate-300 text-slate-900"
                  )}
                />
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Filter size={18} className={isDarkMode ? "text-slate-400" : "text-slate-500"} />
                  <select
                    value={statusFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className={cn("block w-full py-2 pl-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors",
                      isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900"
                    )}
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Proses">Proses</option>
                    <option value="Lulus">Lulus</option>
                    <option value="Tidak Lulus">Tidak Lulus</option>
                  </select>
                </div>
                <button
                  onClick={fetchData}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap disabled:opacity-70"
                >
                  <RefreshCw size={16} className={cn(isLoading && "animate-spin")} /> Segarkan
                </button>
                <button
                  onClick={exportToExcel}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                >
                  <Download size={16} /> Export
                </button>
              </div>
            </div>

            {/* Table */}
            <div className={cn("rounded-xl shadow-sm border overflow-hidden", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className={isDarkMode ? "bg-slate-700 text-slate-200" : "bg-blue-50 text-blue-800"}>
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">No. Pendaftaran</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Nama Lengkap</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Usia</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Batas Hitung Usia</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Jarak</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">NIK</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className={cn("divide-y", isDarkMode ? "divide-slate-700" : "divide-slate-200")}>
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-500 mb-4" />
                          <p className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Memuat data...</p>
                        </td>
                      </tr>
                    ) : currentData.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="mx-auto h-12 w-12 text-slate-400 mb-4"><FileText size={48} /></div>
                          <p className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Tidak ada data ditemukan</p>
                        </td>
                      </tr>
                    ) : (
                      currentData.map((item: AdminData, idx: number) => (
                        <motion.tr
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
                            {item['Jarak ke Sekolah (km)'] ? `${item['Jarak ke Sekolah (km)']} km` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                            {getFieldValue(item, 'NIK') || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
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
                              <button onClick={() => printCard(item)} className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-2 py-1 rounded transition-colors" title="Cetak Kartu">
                                <Printer size={18} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!isLoading && filteredData.length > 0 && (
                <div className={cn("px-6 py-4 border-t flex items-center justify-between", isDarkMode ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white")}>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Menampilkan <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> hingga <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> dari <span className="font-medium">{filteredData.length}</span> data
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Sebelumnya
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && localSettings && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className={cn("rounded-xl shadow-sm border p-6", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>

              <div className="flex items-center gap-4 mb-6 border-b dark:border-slate-700 pb-4 overflow-x-auto">
                <button
                  onClick={() => setSettingsTab('school')}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap",
                    settingsTab === 'school'
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                  )}
                >
                  Pengaturan Sekolah
                </button>
                <button
                  onClick={() => setSettingsTab('form')}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap",
                    settingsTab === 'form'
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                  )}
                >
                  Pengaturan Formulir
                </button>
                <button
                  onClick={() => setSettingsTab('surat')}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap",
                    settingsTab === 'surat'
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                  )}
                >
                  Pengaturan Surat
                </button>
                <button
                  onClick={() => setSettingsTab('daftar-ulang')}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap",
                    settingsTab === 'daftar-ulang'
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50"
                  )}
                >
                  Pengaturan Daftar Ulang
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
                      <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Status Pendaftaran</label>
                      <select
                        value={localSettings.statusPendaftaran}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLocalSettings({ ...localSettings, statusPendaftaran: e.target.value as any })}
                        className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                      >
                        <option value="Buka">Buka</option>
                        <option value="Tutup">Tutup</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Alamat</label>
                      <textarea
                        value={localSettings.alamat}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLocalSettings({ ...localSettings, alamat: e.target.value })}
                        rows={2}
                        className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Koordinat Sekolah (Latitude, Longitude)</label>
                      <input
                        type="text"
                        value={localSettings.koordinatSekolah || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, koordinatSekolah: e.target.value })}
                        placeholder="Contoh: -6.200000, 106.816666"
                        className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                      />
                      <p className="text-xs text-slate-500 mt-1">Gunakan format "Latitude, Longitude" (contoh: -6.200000, 106.816666). Digunakan untuk menghitung jarak rumah pendaftar ke sekolah.</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Batas Tanggal Hitung Usia</label>
                      <input
                        type="date"
                        value={formatDateForInput(localSettings.tanggalCutoffUsia)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, tanggalCutoffUsia: e.target.value })}
                        className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                      />
                      <p className="text-xs text-slate-500 mt-1">Tanggal acuan hitung usia (Contoh: 1 Juli 2026). Sistem akan menghitung usia pendaftar tepat pada tanggal tersebut.</p>
                    </div>
                    <div>
                      <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Telepon</label>
                      <input
                        type="text"
                        value={localSettings.telepon}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, telepon: e.target.value })}
                        className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                      />
                    </div>
                    <div>
                      <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Email</label>
                      <input
                        type="email"
                        value={localSettings.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, email: e.target.value })}
                        className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                      />
                    </div>
                    <div>
                      <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Kontak Panitia</label>
                      <textarea
                        value={localSettings.kontakPanitia || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLocalSettings({ ...localSettings, kontakPanitia: e.target.value })}
                        placeholder="Masukkan daftar kontak panitia (gunakan enter untuk baris baru)"
                        rows={5}
                        className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                      />
                    </div>
                    <div>
                      <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Tahun Pendaftaran</label>
                      <input
                        type="text"
                        value={localSettings.tahunPendaftaran || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, tahunPendaftaran: e.target.value })}
                        placeholder="Contoh: 2024"
                        className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Deskripsi Sekolah</label>
                      <textarea
                        value={localSettings.deskripsi}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLocalSettings({ ...localSettings, deskripsi: e.target.value })}
                        rows={3}
                        className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Logo Sekolah (Upload)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const compressed = await compressImage(file, 400);
                            setLocalSettings({ ...localSettings, logoSekolah: compressed });
                          }
                        }}
                        className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                      />
                      {localSettings.logoSekolah && <img src={localSettings.logoSekolah} alt="Logo Sekolah" className="mt-2 h-16 object-contain border rounded bg-white p-1" />}
                    </div>
                    <div className="md:col-span-2">
                      <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Gambar Header Beranda (Upload)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const compressed = await compressImage(file, 1200);
                            setLocalSettings({ ...localSettings, gambarHeaderBeranda: compressed });
                          }
                        }}
                        className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                      />
                      {localSettings.gambarHeaderBeranda && <img src={localSettings.gambarHeaderBeranda} alt="Header Beranda" className="mt-2 h-32 object-cover border rounded bg-white" />}
                    </div>
                    <div>
                      <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Tanggal Pengumuman Kelulusan</label>
                      <input
                        type="date"
                        value={formatDateForInput(localSettings.tanggalPengumuman)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, tanggalPengumuman: e.target.value })}
                        className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                      />
                      <p className="text-xs text-slate-500 mt-1">Sebelum tanggal ini, pendaftar akan melihat status "Proses".</p>
                    </div>
                  </div>
                )}

                {settingsTab === 'daftar-ulang' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Pengaturan Daftar Ulang</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Tanggal Daftar Ulang</label>
                        <input
                          type="date"
                          value={formatDateForInput(localSettings.tanggalDaftarUlang)}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, tanggalDaftarUlang: e.target.value })}
                          className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Persyaratan Daftar Ulang</label>
                        <textarea
                          value={localSettings.persyaratanDaftarUlang || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLocalSettings({ ...localSettings, persyaratanDaftarUlang: e.target.value })}
                          rows={5}
                          placeholder="1. Syarat pertama&#10;2. Syarat kedua"
                          className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === 'kepala-sekolah' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Profil Kepala Sekolah & Visi Misi</h3>
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
                      <div className="md:col-span-2">
                        <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Foto Kepala Sekolah</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const compressed = await compressImage(file, 800);
                              setLocalSettings({ ...localSettings, fotoKepalaSekolah: compressed });
                            }
                          }}
                          className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                        />
                        {localSettings.fotoKepalaSekolah && <img src={localSettings.fotoKepalaSekolah} alt="Foto Kepala Sekolah" className="mt-2 h-32 object-cover border rounded bg-white" />}
                      </div>
                      <div className="md:col-span-2">
                        <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Sambutan Kepala Sekolah</label>
                        <textarea
                          value={localSettings.sambutanKepalaSekolah || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLocalSettings({ ...localSettings, sambutanKepalaSekolah: e.target.value })}
                          rows={5}
                          placeholder="Masukkan kata sambutan kepala sekolah..."
                          className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Visi Sekolah</label>
                        <textarea
                          value={localSettings.visiSekolah || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLocalSettings({ ...localSettings, visiSekolah: e.target.value })}
                          rows={3}
                          placeholder="Masukkan visi sekolah..."
                          className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Misi Sekolah</label>
                        <textarea
                          value={localSettings.misiSekolah || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLocalSettings({ ...localSettings, misiSekolah: e.target.value })}
                          rows={5}
                          placeholder="1. Misi pertama&#10;2. Misi kedua"
                          className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === 'panduan' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Pengaturan Halaman Panduan</h3>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Judul Panduan</label>
                        <input
                          type="text"
                          value={localSettings.panduanJudul || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, panduanJudul: e.target.value })}
                          className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                          placeholder="Panduan Pendaftaran SPMB"
                        />
                      </div>
                      <div>
                        <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Deskripsi Panduan</label>
                        <textarea
                          value={localSettings.panduanDeskripsi || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLocalSettings({ ...localSettings, panduanDeskripsi: e.target.value })}
                          rows={2}
                          className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                          placeholder="Persiapkan dokumen berikut sebelum mulai mengisi formulir pendaftaran."
                        />
                      </div>
                      <div>
                        <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Pesan Peringatan (Alert)</label>
                        <textarea
                          value={localSettings.panduanPeringatan || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLocalSettings({ ...localSettings, panduanPeringatan: e.target.value })}
                          rows={3}
                          className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                          placeholder="Pastikan semua dokumen di-scan atau difoto dengan jelas dan dapat terbaca..."
                        />
                      </div>

                      <div className="border-t pt-6 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-md font-semibold">Dokumen yang Harus Disiapkan</h4>
                          <button
                            onClick={() => {
                              if (!localSettings) return;
                              const newDocs = [...(localSettings.panduanDokumen || [])];
                              newDocs.push({ id: Date.now().toString(), icon: 'FileText', title: 'Dokumen Baru', description: 'Deskripsi dokumen' });
                              setLocalSettings({ ...localSettings, panduanDokumen: newDocs });
                            }}
                            className="text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-200 transition-colors dark:bg-blue-900/40 dark:text-blue-400 dark:hover:bg-blue-900/60"
                          >
                            + Tambah Dokumen
                          </button>
                        </div>
                        <div className="space-y-4">
                          {(localSettings.panduanDokumen || []).map((doc, index) => (
                            <div key={doc.id} className={cn("p-4 rounded-lg border grid grid-cols-1 md:grid-cols-12 gap-4 items-start", isDarkMode ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-slate-50")}>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-medium mb-1 opacity-70">Ikon</label>
                                <select
                                  value={doc.icon}
                                  onChange={e => {
                                    const newDocs = [...(localSettings.panduanDokumen || [])];
                                    newDocs[index] = { ...newDocs[index], icon: e.target.value as any };
                                    setLocalSettings({ ...localSettings, panduanDokumen: newDocs });
                                  }}
                                  className={cn("w-full px-3 py-2 text-sm border rounded-md", isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-300")}
                                >
                                  <option value="FileDigit">FileDigit (KK)</option>
                                  <option value="FileBadge">FileBadge (Akta)</option>
                                  <option value="FileImage">FileImage (Foto)</option>
                                  <option value="FileText">FileText (Ijazah/Umum)</option>
                                </select>
                              </div>
                              <div className="md:col-span-3">
                                <label className="block text-xs font-medium mb-1 opacity-70">Nama Dokumen</label>
                                <input
                                  type="text"
                                  value={doc.title}
                                  onChange={e => {
                                    const newDocs = [...(localSettings.panduanDokumen || [])];
                                    newDocs[index] = { ...newDocs[index], title: e.target.value };
                                    setLocalSettings({ ...localSettings, panduanDokumen: newDocs });
                                  }}
                                  className={cn("w-full px-3 py-2 text-sm border rounded-md", isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-300")}
                                />
                              </div>
                              <div className="md:col-span-6">
                                <label className="block text-xs font-medium mb-1 opacity-70">Deskripsi</label>
                                <textarea
                                  value={doc.description}
                                  onChange={e => {
                                    const newDocs = [...(localSettings.panduanDokumen || [])];
                                    newDocs[index] = { ...newDocs[index], description: e.target.value };
                                    setLocalSettings({ ...localSettings, panduanDokumen: newDocs });
                                  }}
                                  rows={2}
                                  className={cn("w-full px-3 py-2 text-sm border rounded-md", isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-300")}
                                />
                              </div>
                              <div className="md:col-span-1 flex justify-end">
                                <button
                                  onClick={() => {
                                    const newDocs = (localSettings.panduanDokumen || []).filter((_, i) => i !== index);
                                    setLocalSettings({ ...localSettings, panduanDokumen: newDocs });
                                  }}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors dark:hover:bg-red-900/20 mt-5"
                                  title="Hapus Dokumen"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t pt-6 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-md font-semibold">Alur Pendaftaran</h4>
                          <button
                            onClick={() => {
                              if (!localSettings) return;
                              const newAlur = [...(localSettings.panduanAlur || [])];
                              newAlur.push('Langkah baru');
                              setLocalSettings({ ...localSettings, panduanAlur: newAlur });
                            }}
                            className="text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-200 transition-colors dark:bg-blue-900/40 dark:text-blue-400 dark:hover:bg-blue-900/60"
                          >
                            + Tambah Langkah
                          </button>
                        </div>
                        <div className="space-y-3">
                          {(localSettings.panduanAlur || []).map((step, index) => (
                            <div key={index} className="flex gap-3 items-start">
                              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 mt-1 dark:bg-slate-700 dark:text-slate-300">
                                {index + 1}
                              </div>
                              <textarea
                                value={step}
                                onChange={e => {
                                  const newAlur = [...(localSettings.panduanAlur || [])];
                                  newAlur[index] = e.target.value;
                                  setLocalSettings({ ...localSettings, panduanAlur: newAlur });
                                }}
                                rows={2}
                                className={cn("flex-grow px-3 py-2 text-sm border rounded-md", isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-300")}
                              />
                              <button
                                onClick={() => {
                                  const newAlur = (localSettings.panduanAlur || []).filter((_, i) => i !== index);
                                  setLocalSettings({ ...localSettings, panduanAlur: newAlur });
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors dark:hover:bg-red-900/20 mt-1"
                                title="Hapus Langkah"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === 'surat' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Pengaturan Surat Kelulusan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Nomor Surat</label>
                        <input
                          type="text"
                          value={localSettings.nomorSurat || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, nomorSurat: e.target.value })}
                          className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                          placeholder="Contoh: 421.2/001/SMP/2026"
                        />
                      </div>

                      <div>
                        <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Tempat Surat</label>
                        <input
                          type="text"
                          value={localSettings.tempatSurat || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, tempatSurat: e.target.value })}
                          className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                          placeholder="Contoh: Fakfak"
                        />
                      </div>

                      <div>
                        <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Tanggal Surat (Kosongkan untuk tanggal hari ini)</label>
                        <input
                          type="text"
                          value={localSettings.tanggalSurat || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, tanggalSurat: e.target.value })}
                          className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                          placeholder="Contoh: 25 Juli 2026"
                        />
                      </div>

                      <div>
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
                          placeholder="Contoh: 19700101 199512 1 001"
                        />
                      </div>

                      <div>
                        <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Kop Surat (Gambar)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const compressed = await compressImage(file, 1200);
                              setLocalSettings({ ...localSettings, kopSurat: compressed });
                            }
                          }}
                          className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                        />
                        {localSettings.kopSurat && <img src={localSettings.kopSurat} alt="Kop Surat" className="mt-2 h-16 object-contain border rounded bg-white" />}
                      </div>

                      <div>
                        <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Tanda Tangan Kepala Sekolah (Gambar)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const compressed = await compressImage(file, 400);
                              setLocalSettings({ ...localSettings, tandaTanganKepalaSekolah: compressed });
                            }
                          }}
                          className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                        />
                        {localSettings.tandaTanganKepalaSekolah && <img src={localSettings.tandaTanganKepalaSekolah} alt="Tanda Tangan" className="mt-2 h-16 object-contain border rounded bg-white" />}
                      </div>

                      <div>
                        <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Stempel Sekolah (Gambar transparan disarankan)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const compressed = await compressImage(file, 400);
                              setLocalSettings({ ...localSettings, stempelSekolah: compressed });
                            }
                          }}
                          className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                        />
                        {localSettings.stempelSekolah && <img src={localSettings.stempelSekolah} alt="Stempel" className="mt-2 h-16 object-contain border rounded bg-white" />}
                      </div>

                      <div className="md:col-span-2">
                        <label className={cn("block text-sm font-medium mb-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>Catatan Tambahan / Pengumuman Lain</label>
                        <textarea
                          value={localSettings.catatanTambahan || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLocalSettings({ ...localSettings, catatanTambahan: e.target.value })}
                          rows={3}
                          placeholder="Contoh: Harap membawa materai 10.000 saat daftar ulang."
                          className={cn("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500", isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-300")}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === 'form' && (
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Pengaturan Field Formulir</h3>
                      <button
                        onClick={() => {
                          if (!localSettings) return;
                          const newFields = [...localSettings.formFields, { id: `Field-${Date.now()}`, label: 'Field Baru', type: 'text' as const, required: false }];
                          setLocalSettings({ ...localSettings, formFields: newFields });
                        }}
                        className="text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-md font-medium transition-colors dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        + Tambah Field
                      </button>
                    </div>

                    <div className="space-y-4">
                      {localSettings.formFields.map((field, index) => (
                        <div key={index} className={cn("p-4 rounded-lg border grid grid-cols-1 md:grid-cols-12 gap-4 items-end", isDarkMode ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-slate-50")}>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-medium mb-1 opacity-70">ID (Unik)</label>
                            <input
                              type="text"
                              value={field.id}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const newFields = [...localSettings.formFields];
                                newFields[index] = { ...newFields[index], id: e.target.value };
                                setLocalSettings({ ...localSettings, formFields: newFields });
                              }}
                              className={cn("w-full px-3 py-2 text-sm border rounded-md", isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-300")}
                            />
                          </div>
                          <div className="md:col-span-4">
                            <label className="block text-xs font-medium mb-1 opacity-70">Label</label>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const newFields = [...localSettings.formFields];
                                newFields[index] = { ...newFields[index], label: e.target.value };
                                setLocalSettings({ ...localSettings, formFields: newFields });
                              }}
                              className={cn("w-full px-3 py-2 text-sm border rounded-md", isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-300")}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium mb-1 opacity-70">Tipe</label>
                            <select
                              value={field.type}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                const newFields = [...localSettings.formFields];
                                newFields[index] = { ...newFields[index], type: e.target.value as any };
                                setLocalSettings({ ...localSettings, formFields: newFields });
                              }}
                              className={cn("w-full px-3 py-2 text-sm border rounded-md", isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-300")}
                            >
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="date">Date</option>
                              <option value="select">Select</option>
                              <option value="textarea">Textarea</option>
                              <option value="file">File</option>
                              <option value="header">Header/Judul</option>
                            </select>
                          </div>
                          <div className="md:col-span-2 flex items-center h-[38px]">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const newFields = [...localSettings.formFields];
                                  newFields[index] = { ...newFields[index], required: e.target.checked };
                                  setLocalSettings({ ...localSettings, formFields: newFields });
                                }}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm">Wajib</span>
                            </label>
                          </div>
                          <div className="md:col-span-1 flex justify-end">
                            <button
                              onClick={() => {
                                const newFields = localSettings.formFields.filter((_, i) => i !== index);
                                setLocalSettings({ ...localSettings, formFields: newFields });
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors dark:hover:bg-red-900/20"
                              title="Hapus Field"
                            >
                              <X size={18} />
                            </button>
                          </div>
                          {field.type === 'select' && (
                            <div className="md:col-span-12 mt-2">
                              <label className="block text-xs font-medium mb-1 opacity-70">Opsi (Pisahkan dengan koma)</label>
                              <input
                                type="text"
                                value={field.options?.join(', ') || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const newFields = [...localSettings.formFields];
                                  newFields[index] = { ...newFields[index], options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) };
                                  setLocalSettings({ ...localSettings, formFields: newFields });
                                }}
                                placeholder="Laki-laki, Perempuan"
                                className={cn("w-full px-3 py-2 text-sm border rounded-md", isDarkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-300")}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
                  >
                    {isSavingSettings ? <Loader2 size={18} className="animate-spin" /> : null}
                    Simpan Pengaturan
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn("w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl", isDarkMode ? "bg-slate-800 text-white" : "bg-white text-slate-900")}
            >
              <div className={cn("sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                <h2 className="text-xl font-bold">Detail Pendaftar</h2>
                <button onClick={() => setSelectedStudent(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Data Section */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold border-b pb-2 mb-4 dark:border-slate-700">Data Pendaftar</h3>
                      <dl className="grid grid-cols-1 gap-y-3 text-sm">
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-slate-500 dark:text-slate-400">No. Pendaftaran</dt>
                          <dd className="col-span-2 font-medium">{selectedStudent['No Pendaftaran']}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-slate-500 dark:text-slate-400">Status</dt>
                          <dd className="col-span-2">{getStatusBadge(selectedStudent.Status)}</dd>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-slate-500 dark:text-slate-400">Waktu Daftar</dt>
                          <dd className="col-span-2 font-medium">{new Date(selectedStudent.Timestamp).toLocaleString()}</dd>
                        </div>

                        {/* Dynamic Fields */}
                        {(settings?.formFields || []).filter(f => f.type !== 'file').map(field => {
                          if (field.type === 'header') {
                            return (
                              <div key={field.id} className="col-span-3 pt-4 border-b border-slate-100 dark:border-slate-700 pb-1 mb-2">
                                <h4 className="font-bold text-blue-600 dark:text-blue-400 text-sm uppercase">{field.label}</h4>
                              </div>
                            );
                          }
                          const value = getFieldValue(selectedStudent, field.id);
                          return (
                            <React.Fragment key={field.id}>
                              <div className="grid grid-cols-3 gap-4">
                                <dt className="text-slate-500 dark:text-slate-400">{field.label}</dt>
                                <dd className="col-span-2 font-medium">
                                  {field.id === 'Tanggal Lahir'
                                    ? formatDate(value)
                                    : (value || '-')}
                                </dd>
                              </div>
                              {field.id === 'Tanggal Lahir' && (
                                <>
                                  <div className="grid grid-cols-3 gap-4">
                                    <dt className="text-slate-500 dark:text-slate-400">Usia</dt>
                                    <dd className="col-span-2 font-medium">{calculateAge(value, settings?.tanggalCutoffUsia)}</dd>
                                  </div>
                                  <div className="grid grid-cols-3 gap-4">
                                    <dt className="text-slate-500 dark:text-slate-400">Batas Hitung Usia</dt>
                                    <dd className="col-span-2 font-medium">{formatDate(settings?.tanggalCutoffUsia || '')}</dd>
                                  </div>
                                </>
                              )}
                            </React.Fragment>
                          )
                        })}

                        {selectedStudent['Koordinat Lokasi'] && (
                          <div className="grid grid-cols-3 gap-4 mt-2">
                            <dt className="text-slate-500 dark:text-slate-400">Koordinat Lokasi</dt>
                            <dd className="col-span-2 font-medium">
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${selectedStudent['Koordinat Lokasi']}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                {selectedStudent['Koordinat Lokasi']}
                              </a>
                            </dd>
                          </div>
                        )}

                        {selectedStudent['Jarak ke Sekolah (km)'] && (
                          <div className="grid grid-cols-3 gap-4">
                            <dt className="text-slate-500 dark:text-slate-400">Jarak ke Sekolah</dt>
                            <dd className="col-span-2 font-medium text-blue-700">{selectedStudent['Jarak ke Sekolah (km)']} km</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    <div className="pt-4 flex gap-3">
                      {selectedStudent.Status !== 'Lulus' && (
                        <button onClick={() => handleUpdateStatus(selectedStudent['No Pendaftaran'], 'Lulus')} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors">
                          Ubah ke Lulus
                        </button>
                      )}
                      {selectedStudent.Status !== 'Tidak Lulus' && (
                        <button onClick={() => handleUpdateStatus(selectedStudent['No Pendaftaran'], 'Tidak Lulus')} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition-colors">
                          Ubah ke Tidak Lulus
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Files Section */}
                  <div>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4 dark:border-slate-700">Berkas Upload</h3>
                    <div className="space-y-4">
                      {(settings?.formFields || []).filter(f => f.type === 'file').map(field => {
                        const fileUrl = getFieldValue(selectedStudent, field.id);
                        return (
                          <div key={field.id} className={cn("p-4 rounded-xl border", isDarkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50")}>
                            <p className="text-sm font-medium mb-2">{field.label}</p>
                            {fileUrl ? (
                              fileUrl.startsWith('data:image') ? (
                                <img src={fileUrl} alt={field.label} className="w-full h-32 object-cover rounded-lg border" />
                              ) : (
                                <a href={fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-sm flex items-center gap-2">
                                  <FileText size={16} /> Buka {field.label}
                                </a>
                              )
                            ) : (
                              <span className="text-sm text-slate-500">Tidak ada file</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
