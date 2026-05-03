import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Trophy, ChevronRight, CheckCircle2, Calendar, FileText, CheckSquare, AlertCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function Home() {
  const { settings } = useSettings();
  const isClosed = settings?.statusPendaftaran === 'Tutup';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-16 pb-32">
        <div
          className={`absolute inset-0 bg-cover bg-center ${settings?.gambarHeaderBeranda ? 'opacity-30' : 'opacity-5'}`}
          style={{ backgroundImage: `url('${settings?.gambarHeaderBeranda || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop'}')` }}
        ></div>
        <div className={`absolute inset-0 bg-gradient-to-br from-blue-50/90 via-white/80 to-green-50/90 ${settings?.gambarHeaderBeranda ? '' : 'backdrop-blur-sm'}`}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm mb-8 shadow-sm border ${isClosed ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}
            >
              <span className="relative flex h-3 w-3">
                {!isClosed && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isClosed ? 'bg-red-500' : 'bg-blue-500'}`}></span>
              </span>
              {isClosed ? `Pendaftaran SPMB ${new Date().getFullYear()} Telah Ditutup` : `Pendaftaran SPMB ${new Date().getFullYear()} Telah Dibuka`}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6"
            >
              Membangun Generasi <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">
                Cerdas & Berkarakter
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed"
            >
              Bergabunglah bersama {(!settings?.namaSekolah || settings.namaSekolah === 'SMP NEGERI 4 FAKFAK') ? 'SMP NEGERI 4 FAKFAK' : settings.namaSekolah}. Kami berkomitmen memberikan pendidikan dasar terbaik dengan fasilitas modern dan tenaga pendidik profesional.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {isClosed ? (
                <button
                  disabled
                  className="inline-flex justify-center items-center gap-2 bg-slate-400 text-white px-8 py-4 rounded-full text-lg font-semibold cursor-not-allowed shadow-sm"
                >
                  <AlertCircle size={20} /> Pendaftaran Ditutup
                </button>
              ) : (
                <Link
                  to="/daftar"
                  className="inline-flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                  Daftar Sekarang <ChevronRight size={20} />
                </Link>
              )}
              <Link
                to="/panduan"
                className="inline-flex justify-center items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-sm hover:shadow-md"
              >
                Panduan Pendaftaran <BookOpen size={20} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Profil Sekolah / Features */}
      <section className="py-24 bg-slate-50 relative -mt-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <BookOpen className="text-blue-500" size={32} />,
                title: "Kurikulum Modern",
                desc: "Menerapkan kurikulum merdeka belajar yang adaptif dengan perkembangan zaman dan teknologi."
              },
              {
                icon: <Users className="text-green-500" size={32} />,
                title: "Guru Profesional",
                desc: "Dididik oleh tenaga pengajar tersertifikasi, berpengalaman, dan berdedikasi tinggi pada pendidikan."
              },
              {
                icon: <Trophy className="text-amber-500" size={32} />,
                title: "Fasilitas Lengkap",
                desc: "Ruang kelas nyaman, perpustakaan digital, lab komputer, dan fasilitas olahraga yang memadai."
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center mb-6 border border-slate-100">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Sambutan & Visi Misi */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Sambutan Kepala Sekolah
              </h2>
              <div className="prose prose-lg text-slate-600">
                {settings?.sambutanKepalaSekolah?.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-4">
                    {paragraph}
                  </p>
                ))}
                <div className="flex items-center gap-4 mt-8">
                  <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden">
                    <img src={settings?.fotoKepalaSekolah || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&auto=format&fit=crop"} alt="Kepala Sekolah" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{settings?.namaKepalaSekolah || 'Kepala Sekolah'}</h4>
                    <p className="text-sm text-slate-500">Kepala Sekolah {settings?.namaSekolah}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-slate-50 rounded-3xl p-8 md:p-10 border border-slate-100"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <span className="bg-blue-100 text-blue-600 p-2 rounded-lg"><Trophy size={24} /></span>
                Visi & Misi
              </h3>

              <div className="mb-8">
                <h4 className="text-lg font-semibold text-slate-800 mb-3">Visi</h4>
                <p className="text-slate-600 italic bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  "{settings?.visiSekolah || 'Visi sekolah belum diatur.'}"
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-slate-800 mb-3">Misi</h4>
                <ul className="space-y-3">
                  {(settings?.misiSekolah ? settings.misiSekolah.split('\n') : []).map((misi, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-600">
                      <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={20} />
                      <span>{misi.replace(/^\d+\.\s*/, '')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Alur SPMB */}
      <section id="alur" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://i.imgur.com/iHPVfwS.jpeg')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Alur Pendaftaran SPMB</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Ikuti langkah-langkah mudah berikut untuk mendaftarkan putra/putri Anda di {(!settings?.namaSekolah || settings.namaSekolah === 'SMP NEGERI 4 FAKFAK') ? 'SMP NEGERI 4 FAKFAK' : settings.namaSekolah}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 z-0"></div>

            {[
              {
                step: "01",
                icon: <FileText size={28} />,
                title: "Isi Formulir",
                desc: "Lengkapi data diri calon siswa dan orang tua secara online."
              },
              {
                step: "02",
                icon: <BookOpen size={28} />,
                title: "Upload Berkas",
                desc: "Unggah dokumen persyaratan (Foto, KK, Akta Kelahiran)."
              },
              {
                step: "03",
                icon: <CheckSquare size={28} />,
                title: "Verifikasi",
                desc: "Panitia akan memverifikasi data dan dokumen yang diunggah."
              },
              {
                step: "04",
                icon: <Calendar size={28} />,
                title: "Pengumuman",
                desc: "Cek status kelulusan dan cetak bukti pendaftaran."
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-6 shadow-xl relative group hover:bg-blue-600 transition-colors duration-300">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm border-4 border-slate-900">
                    {item.step}
                  </div>
                  <div className="text-slate-300 group-hover:text-white transition-colors">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            {isClosed ? (
              <button
                disabled
                className="inline-flex justify-center items-center gap-2 bg-slate-700 text-slate-400 px-8 py-4 rounded-full text-lg font-bold cursor-not-allowed shadow-lg"
              >
                <AlertCircle size={20} /> Pendaftaran Ditutup
              </button>
            ) : (
              <Link
                to="/daftar"
                className="inline-flex justify-center items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 px-8 py-4 rounded-full text-lg font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                Mulai Pendaftaran <ChevronRight size={20} />
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
