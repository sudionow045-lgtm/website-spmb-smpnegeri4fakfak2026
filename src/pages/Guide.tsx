import { motion } from 'motion/react';
import { FileText, CheckCircle2, AlertCircle, ArrowRight, FileImage, FileBadge, FileDigit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const iconMap = {
  FileDigit: FileDigit,
  FileBadge: FileBadge,
  FileImage: FileImage,
  FileText: FileText,
};

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  amber: 'bg-amber-100 text-amber-600',
  slate: 'bg-slate-100 text-slate-600',
};

const colorMap = {
  FileDigit: 'blue',
  FileBadge: 'green',
  FileImage: 'purple',
  FileText: 'amber',
};

export default function Guide() {
  const { settings } = useSettings();

  const judul = settings?.panduanJudul || "Panduan Pendaftaran SPMB";
  const deskripsi = settings?.panduanDeskripsi || "Persiapkan dokumen berikut sebelum mulai mengisi formulir pendaftaran.";
  const peringatan = settings?.panduanPeringatan || "Pastikan semua dokumen di-scan atau difoto dengan jelas dan dapat terbaca. Format file yang disarankan adalah JPG, PNG, atau PDF dengan ukuran maksimal 2MB per file.";
  const dokumen = settings?.panduanDokumen || [
    { id: "1", icon: "FileDigit", title: "Kartu Keluarga (KK)", description: "Asli atau fotokopi yang jelas. Pastikan NIK dan nama calon siswa tercantum dengan benar sesuai data kependudukan." },
    { id: "2", icon: "FileBadge", title: "Akta Kelahiran", description: "Dokumen asli atau fotokopi untuk verifikasi usia dan data diri calon siswa." },
    { id: "3", icon: "FileImage", title: "Pas Foto 3x4", description: "Pas foto terbaru berwarna (mengenakan seragam SD/MI) dengan latar belakang merah atau biru." },
    { id: "4", icon: "FileText", title: "Ijazah / SKL", description: "Ijazah asli atau Surat Keterangan Lulus (SKL) dari jenjang SD/MI/Sederajat." },
    { id: "5", icon: "FileBadge", title: "Sertifikat TKA", description: "Sertifikat Tes Kemampuan Akademik (TKA) bagi yang memiliki (khusus lulusan tahun 2026)." },
    { id: "6", icon: "FileText", title: "KIP/PKH/KKS (Jika Ada)", description: "Bukti Kepesertaan program bantuan pemerintah untuk jalur afirmasi (jika memiliki)." }
  ];
  const alur = settings?.panduanAlur || [
    "Siapkan seluruh dokumen persyaratan dalam bentuk file digital (foto/scan).",
    "Klik tombol 'Mulai Pendaftaran' di bawah atau menu 'Daftar' di navigasi.",
    "Isi seluruh kolom formulir dengan data yang valid dan sesuai dengan dokumen asli.",
    "Tandai lokasi rumah Anda di peta yang disediakan untuk perhitungan jarak.",
    "Unggah dokumen persyaratan pada kolom yang tersedia.",
    "Kirim formulir dan simpan Nomor Pendaftaran Anda untuk mengecek status kelulusan."
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="bg-blue-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">{judul}</h1>
            <p className="text-blue-100">{deskripsi}</p>
          </div>

          <div className="p-8">
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FileText className="text-blue-600" />
                Dokumen yang Harus Disiapkan
              </h2>
              {peringatan && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <AlertCircle className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">{peringatan}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dokumen.map((doc) => {
                  const IconComponent = iconMap[doc.icon as keyof typeof iconMap] || FileText;
                  const colorKey = colorMap[doc.icon as keyof typeof colorMap] || 'slate';
                  const colorClass = colorClasses[colorKey as keyof typeof colorClasses];

                  return (
                    <div key={doc.id} className="border border-slate-200 rounded-xl p-5 flex gap-4 items-start hover:border-blue-300 transition-colors">
                      <div className={`${colorClass} p-3 rounded-lg shrink-0`}>
                        <IconComponent size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">{doc.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <CheckCircle2 className="text-green-600" />
                Alur Pendaftaran
              </h2>
              <div className="space-y-4">
                {alur.map((step, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center shrink-0 border border-slate-200">
                      {idx + 1}
                    </div>
                    <p className="text-slate-700 pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {settings?.kontakPanitia && (
              <div className="mb-10 bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="bg-blue-600 text-white p-1.5 rounded-lg"><ArrowRight size={18} /></div>
                  Butuh Bantuan?
                </h2>
                <p className="text-slate-600 mb-4 text-sm">
                  Jika Anda mengalami kesulitan saat melakukan pendaftaran, silakan hubungi panitia melalui kontak berikut:
                </p>
                <div className="inline-flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-blue-100 shadow-sm">
                  <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                    <div className="font-bold text-xs">WA</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {settings.kontakPanitia.split('\n').map((line, idx) => (
                      <span key={idx} className="font-bold text-slate-900">{line}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-6 border-t border-slate-100">
              <Link
                to="/daftar"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                Mulai Pendaftaran <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
