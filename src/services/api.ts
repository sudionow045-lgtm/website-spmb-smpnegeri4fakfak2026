// Service to interact with Google Apps Script Backend

// To use the real backend, replace this URL with your deployed Google Apps Script Web App URL
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwbb4ewxVYKow8RcX7iW4_oH0Y9ngZSKJBFacVoZ_ts7imAAALNqPPuP9Y_YKgPQJKt/exec";

// Helper function to handle fetch with better error reporting
const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, {
      ...options,
      // Ensure we always follow redirects (GAS requirement)
      redirect: 'follow'
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else {
      // If not JSON, it might be an HTML error page from GAS
      const text = await response.text();
      console.error("Non-JSON response received:", text);
      return {
        status: "error",
        message: "Server tidak memberikan respon JSON yang valid. Pastikan Web App sudah di-deploy dengan benar."
      };
    }
  } catch (error: any) {
    console.error("Fetch error:", error);
    // Return a structured error instead of throwing
    return {
      status: "error",
      message: error.message || "Gagal menghubungi server. Periksa koneksi internet Anda."
    };
  }
};

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'file' | 'textarea' | 'header';
  options?: string[];
  required: boolean;
}

export interface PanduanDokumen {
  id: string;
  icon: 'FileDigit' | 'FileBadge' | 'FileImage' | 'FileText';
  title: string;
  description: string;
}

export interface AppSettings {
  namaSekolah: string;
  alamat: string;
  telepon: string;
  email: string;
  deskripsi: string;
  statusPendaftaran: 'Buka' | 'Tutup';
  formFields: FormField[];
  persyaratanDaftarUlang?: string;
  tanggalDaftarUlang?: string;
  tanggalPengumuman?: string;
  logoSekolah?: string;
  kopSurat?: string;
  namaKepalaSekolah?: string;
  tandaTanganKepalaSekolah?: string;
  stempelSekolah?: string;
  tahunPendaftaran?: string;
  nomorSurat?: string;
  tempatSurat?: string;
  tanggalSurat?: string;
  nipKepalaSekolah?: string;
  catatanTambahan?: string;
  gambarHeaderBeranda?: string;
  koordinatSekolah?: string;
  tanggalCutoffUsia?: string;
  sambutanKepalaSekolah?: string;
  fotoKepalaSekolah?: string;
  visiSekolah?: string;
  misiSekolah?: string;
  panduanJudul?: string;
  panduanDeskripsi?: string;
  panduanPeringatan?: string;
  kontakPanitia?: string;
  panduanDokumen?: PanduanDokumen[];
  panduanAlur?: string[];
}

export interface RegistrationData {
  [key: string]: any;
}

export interface AdminData extends RegistrationData {
  Timestamp: string;
  'No Pendaftaran': string;
  Status: 'Proses' | 'Lulus' | 'Tidak Lulus';
  'Alasan Penolakan'?: string;
}

// Mock data for preview if GAS URL is not set
export const getInitialMockSettings = (): AppSettings => {
  const defaultSettings: AppSettings = {
    namaSekolah: "SMP NEGERI 4 FAKFAK",
    alamat: "Jl. Fakfak - Sanggram Fakfak - Papua Barat RT/RW: 003/001 Kec. Fakfak Tengah Kab. Fak-Fak",
    telepon: "082199379131",
    email: "info@smpnegeri4fakfak.sch.id",
    deskripsi: "Mencetak generasi penerus bangsa yang cerdas, berakhlak mulia, dan siap menghadapi tantangan masa depan dengan pendidikan berkualitas.",
    statusPendaftaran: "Buka",
    persyaratanDaftarUlang: "1. Membawa Bukti Kelulusan yang dicetak \n 2. Membawa Fotokopi SKL/IJAZAH (1 Lembar) \n 3. Membawa Fotokopi Akta Kelahiran (1 lembar) \n 4. Membawa Fotokopi Kartu Keluarga (1 lembar) \n 5. Membawa Fotokopi Sertifikat TKA (1 Lembar) \n 6. Membawa Pas Foto 3x4 (1 lembar)",
    tanggalDaftarUlang: "2024-07-15",
    tanggalPengumuman: "",
    logoSekolah: "https://iili.io/3tdgMhb.png",
    nipKepalaSekolah: "",
    catatanTambahan: "",
    gambarHeaderBeranda: "https://i.imgur.com/dyUirbi.jpeg",
    koordinatSekolah: "-2.9595913880821785, 132.3518155747581", // Lokasi SMP NEGERI 4 FAKFAK
    tanggalCutoffUsia: "2026-07-01", // Batas Tanggal Hitung Usia
    sambutanKepalaSekolah: "Selamat datang di website resmi SPMB SMP NEGERI 4 FAKFAK. Kami berkomitmen untuk memberikan pelayanan pendidikan terbaik bagi putra-putri Anda. Mari bergabung bersama kami untuk mencetak generasi penerus bangsa yang cerdas, berakhlak mulia, dan berprestasi.",
    fotoKepalaSekolah: "https://i.imgur.com/9wlgK8w.png",
    visiSekolah: "TERWUJUDNYA PESERTA DIDIK YANG BERIMAN, BERTAKWA KEPADA TUHAN YANG MAHA ESA DAN MEMILIKI CIPTA, RASA, KARSA YANG BERKARAKTER PANCASILA",
    misiSekolah: "1. Mengembangkan keimanan dan ketaqwaan Terhadap Tuhan Yang Maha Esa.\n2. Mengembangkan sikap Disiplin, jujur, mandiri dan bertanggungjawab berdasarkan nilai-nilai Pancasila serta budaya kearifan lokal.\n3. Mengembangkan sikap salam, senyum, sapa, sopan dan santun (5S)\n4. Mengembangkan kegiatan literasi dan numerasi peserta didik.\n5. Mengembangkan Ilmu pengetahuan dan teknologi di lingkungan sekolah.",
    formFields: [
      { id: "header1", label: "DATA IDENTITAS PESERTA DIDIK", type: "header", required: false },
      { id: "Nama Lengkap", label: "Nama Lengkap (Sesuai Ijazah/Akta)", type: "text", required: true },
      { id: "Jenis Kelamin", label: "Jenis Kelamin", type: "select", options: ["Laki-laki", "Perempuan"], required: true },
      { id: "NISN", label: "NISN", type: "number", required: true },
      { id: "NIK", label: "NIK / No. KITAS (Untuk WNA)", type: "number", required: true },
      { id: "Tempat Lahir", label: "Tempat Lahir", type: "text", required: true },
      { id: "Tanggal Lahir", label: "Tanggal Lahir", type: "date", required: true },
      { id: "Agama", label: "Agama & Kepercayaan", type: "select", options: ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu", "Lainnya"], required: true },
      { id: "Kewarganegaraan", label: "Kewarganegaraan", type: "select", options: ["Indonesia (WNI)", "Asing (WNA)"], required: true },

      { id: "header2", label: "DATA ALAMAT", type: "header", required: false },
      { id: "Alamat Lengkap", label: "Alamat Jalan / Dusun", type: "textarea", required: true },
      { id: "RT", label: "RT", type: "number", required: true },
      { id: "RW", label: "RW", type: "number", required: true },
      { id: "Desa/Kelurahan", label: "Desa / Kelurahan", type: "text", required: true },
      { id: "Kecamatan", label: "Kecamatan", type: "text", required: true },
      { id: "Kode Pos", label: "Kode Pos", type: "number", required: true },
      { id: "Jenis Tinggal", label: "Jenis Tinggal", type: "select", options: ["Bersama Orang Tua", "Wali", "Kos", "Asrama", "Panti Asuhan", "Lainnya"], required: true },
      { id: "Alat Transportasi", label: "Alat Transportasi ke Sekolah", type: "select", options: ["Jalan kaki", "Kendaraan pribadi", "Kendaraan umum", "Jemputan sekolah", "Kereta api", "Ojek", "Andong/Bendi/Sado/Kuda", "Perahu penyeberangan", "Lainnya"], required: true },

      { id: "header3", label: "DATA SEKOLAH ASAL", type: "header", required: false },
      { id: "NPSN Sekolah", label: "NPSN Sekolah Asal", type: "text", required: true },
      { id: "Asal Sekolah", label: "Nama Sekolah Asal (SD/MI)", type: "text", required: true },

      { id: "header4", label: "DATA ORANG TUA / WALI", type: "header", required: false },
      { id: "Nama Ayah Kandung", label: "Nama Ayah Kandung", type: "text", required: true },
      { id: "Pekerjaan Ayah", label: "Pekerjaan Ayah", type: "select", options: ["Tidak Bekerja", "Nelayan", "Petani", "Peternak", "PNS/TNI/Polri", "Karyawan Swasta", "Pedagang Kecil", "Pedagang Besar", "Wiraswasta", "Buruh", "Pensiunan", "Lainnya"], required: true },
      { id: "Pendidikan Ayah", label: "Pendidikan Terakhir Ayah", type: "select", options: ["Tidak Sekolah", "Putus SD", "SD Sederajat", "SMP Sederajat", "SMA Sederajat", "D1", "D2", "D3", "D4/S1", "S2", "S3"], required: true },
      { id: "Penghasilan Ayah", label: "Penghasilan Bulanan Ayah", type: "select", options: ["Kurang dari 500.000", "500.000 - 999.999", "1.000.000 - 1.999.999", "2.000.000 - 4.999.999", "5.000.000 - 20.000.000", "Lebih dari 20.000.000"], required: true },
      { id: "Tahun Lahir Ayah Kandung", label: "Tahun Lahir Ayah Kandung", type: "date", required: true },

      { id: "Nama Ibu Kandung", label: "Nama Ibu Kandung", type: "text", required: true },
      { id: "Pekerjaan Ibu Kandung", label: "Pekerjaan Ibu Kandung", type: "select", options: ["Ibu Rumah Tangga", "Nelayan", "Petani", "Peternak", "PNS/TNI/Polri", "Karyawan Swasta", "Pedagang Kecil", "Pedagang Besar", "Wiraswasta", "Buruh", "Pensiunan", "Lainnya"], required: true },
      { id: "Pendidikan Ibu Kandung", label: "Pendidikan Terakhir Ibu Kandung", type: "select", options: ["Tidak Sekolah", "Putus SD", "SD Sederajat", "SMP Sederajat", "SMA Sederajat", "D1", "D2", "D3", "D4/S1", "S2", "S3"], required: true },
      { id: "Penghasilan Ibu Kandung", label: "Penghasilan Bulanan Ibu Kandung", type: "select", options: ["Kurang dari 500.000", "500.000 - 999.999", "1.000.000 - 1.999.999", "2.000.000 - 4.999.999", "5.000.000 - 20.000.000", "Lebih dari 20.000.000"], required: true },
      { id: "Tahun Lahir Ibu Kandung", label: "Tahun Lahir Ibu Kandung", type: "date", required: true },

      { id: "No. WhatsApp Aktif", label: "No. WhatsApp Aktif (Untuk Informasi)", type: "number", required: true },

      { id: "header5", label: "DATA PERIODIK", type: "header", required: false },
      { id: "Status Anak", label: "Status Anak", type: "select", options: ["Anak Kandung", "Anak Tiri", "Anak Angkat", "Keponakan", "Lainnya"], required: true },
      { id: "Tinggi Badan", label: "Tinggi Badan (cm)", type: "number", required: true },
      { id: "Berat Badan", label: "Berat Badan (kg)", type: "number", required: true },
      { id: "Apakah Penerima KIP?", label: "Apakah Penerima KIP?", type: "select", option: ["Tidak", "Ya"], required: true },
      { id: "Jumlah Saudara Kandung", label: "Jumlah Saudara Kandung", type: "number", required: true },

      { id: "header6", label: "BERKAS", type: "header", required: false },
      { id: "Pas Foto 3x4", label: "Pas Foto 3x4 (Seragam SD)", type: "file", required: true },
      { id: "Kartu Keluarga", label: "Kartu Keluarga", type: "file", required: false },
      { id: "Akta Kelahiran", label: "Akta Kelahiran", type: "file", required: false },
      { id: "Ijazah / SKL", label: "Ijazah / Surat Keterangan Lulus", type: "file", required: false },
      { id: "Sertifikat TKA Lulusan 2026", label: "Sertifikat TKA Lulusan 2026", type: "file", required: false },
      { id: "KIP/PKH/KKS", label: "KIP / PKH / KKS (Opsional)", type: "file", required: false }
    ],
    panduanJudul: "Panduan Pendaftaran SPMB",
    panduanDeskripsi: "Persiapkan dokumen berikut sebelum mulai mengisi formulir pendaftaran.",
    panduanPeringatan: "Pastikan semua dokumen di-scan atau difoto dengan jelas dan dapat terbaca. Format file yang disarankan adalah JPG, PNG, atau PDF dengan ukuran maksimal 2MB per file.",
    kontakPanitia: "Ketua Panitia (Yuliana Solli, S.Pd : 0813-4110-1415)\nSekretaris (Lusia Glego, S.Pd : 0852-9813-3019)\nAnggota (Fredesvinda Dian Nugraheni, S.T : 0852-4453-6017)\nAnggota (Wa Nur Yanti, S.Pd : 0813-4407-2027)\nAnggota (Martina Horik, S.Pd : 0812-4004-1386)",
    panduanDokumen: [
      { id: "1", icon: "FileDigit", title: "Kartu Keluarga (KK)", description: "Asli atau fotokopi yang jelas. Pastikan NIK dan nama calon siswa tercantum dengan benar sesuai data kependudukan." },
      { id: "2", icon: "FileBadge", title: "Akta Kelahiran", description: "Dokumen asli atau fotokopi untuk verifikasi usia dan data diri calon siswa." },
      { id: "3", icon: "FileImage", title: "Pas Foto 3x4", description: "Pas foto terbaru berwarna (mengenakan seragam SD/MI) dengan latar belakang merah atau biru." },
      { id: "4", icon: "FileText", title: "Ijazah / SKL", description: "Ijazah asli atau Surat Keterangan Lulus (SKL) dari jenjang SD/MI/Sederajat." },
      { id: "5", icon: "FileBadge", title: "Sertifikat TKA", description: "Sertifikat Tes Kemampuan Agama (TKA) bagi yang memiliki (khusus lulusan tahun 2026)." },
      { id: "6", icon: "FileText", title: "KIP/PKH/KKS (Jika Ada)", description: "Bukti kepesertaan program bantuan pemerintah untuk jalur afirmasi (jika memiliki)." }
    ],
    panduanAlur: [
      "Siapkan seluruh dokumen persyaratan dalam bentuk file digital (foto/scan).",
      "Klik tombol 'Mulai Pendaftaran' di bawah atau menu 'Daftar' di navigasi.",
      "Isi seluruh kolom formulir dengan data yang valid dan sesuai dengan dokumen asli.",
      "Tandai lokasi rumah Anda di peta yang disediakan untuk perhitungan jarak.",
      "Unggah dokumen persyaratan pada kolom yang tersedia.",
      "Kirim formulir dan simpan Nomor Pendaftaran Anda untuk mengecek status kelulusan."
    ]
  };

  const stored = localStorage.getItem('mockSettings');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Ensure NPSN, Asal Sekolah, Sertifikat TKA, Status Anak, and Header Image fields exist
      const hasNPSN = parsed.formFields?.some((f: any) => f.id === "NPSN Sekolah");
      const hasTKA = parsed.formFields?.some((f: any) => f.id === "Sertifikat TKA Lulusan 2026");
      const hasKIP = parsed.formFields?.some((f: any) => f.id === "KIP/PKH/KKS");
      const hasStatusAnak = parsed.formFields?.some((f: any) => f.id === "Status Anak");
      const hasHeaderImg = parsed.gambarHeaderBeranda === "https://i.imgur.com/dyUirbi.jpeg";
      const hasNewRequirements = parsed.persyaratanDaftarUlang?.includes("Sertifikat TKA (1 Lembar)");
      const isWrongSchoolName = parsed.namaSekolah !== "SMP NEGERI 4 FAKFAK";

      if (!hasNPSN || !hasTKA || !hasKIP || !hasStatusAnak || !hasHeaderImg || !hasNewRequirements || isWrongSchoolName) {
        // Jika tidak ditemukan atau nama sekolah salah/lama, hapus local storage untuk memaksa reload pengaturan default baru
        localStorage.removeItem('mockSettings');
        return defaultSettings;
      }
      return { ...defaultSettings, ...parsed }; // Merge default settings with parsed local settings
    } catch (e) {
      console.error("Failed to parse mock settings from localStorage", e);
    }
  }
  return defaultSettings;
};

let mockSettings: AppSettings = getInitialMockSettings();

const saveMockSettings = (settings: AppSettings) => {
  mockSettings = settings;
  try {
    localStorage.setItem('mockSettings', JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save mock settings to localStorage", e);
  }
};

const getInitialMockData = (): AdminData[] => {
  const stored = localStorage.getItem('mockData');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse mock data from localStorage", e);
    }
  }
  return [];
};

let mockData: AdminData[] = getInitialMockData();

const saveMockData = (data: AdminData[]) => {
  mockData = data;
  try {
    localStorage.setItem('mockData', JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save mock data to localStorage", e);
  }
};

export const getSettings = async (): Promise<AppSettings> => {
  if (!GAS_WEB_APP_URL) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { ...mockSettings };
  }

  const result = await safeFetch(`${GAS_WEB_APP_URL}?action=getSettings&t=${Date.now()}`);

  if (result.status === "success") {
    const sanitizedData = {
      ...result.data,
      namaSekolah: result.data.namaSekolah === "SMP NEGERI 4 FAKFAK" ? "SMP NEGERI 4 FAKFAK" : result.data.namaSekolah,
      formFields: typeof result.data.formFields === 'string' ? JSON.parse(result.data.formFields) : result.data.formFields,
      panduanDokumen: typeof result.data.panduanDokumen === 'string' ? JSON.parse(result.data.panduanDokumen) : result.data.panduanDokumen,
      panduanAlur: typeof result.data.panduanAlur === 'string' ? JSON.parse(result.data.panduanAlur) : result.data.panduanAlur
    };
    return sanitizedData;
  }

  console.warn("Failed to fetch settings from server, using mock data as fallback:", result.message);
  return { ...mockSettings };
};

export const updateSettings = async (settings: Partial<AppSettings>) => {
  if (!GAS_WEB_APP_URL) {
    await new Promise(resolve => setTimeout(resolve, 800));
    saveMockSettings({ ...mockSettings, ...settings });
    return { status: "success" };
  }

  return await safeFetch(GAS_WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "updateSettings",
      settings
    }),
    headers: { "Content-Type": "text/plain;charset=utf-8" },
  });
};

export const submitRegistration = async (data: RegistrationData) => {
  if (!GAS_WEB_APP_URL) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const noPendaftaran = `REG-${Date.now().toString().slice(-6)}`;
    const newData: AdminData = {
      ...data,
      Timestamp: new Date().toISOString(),
      'No Pendaftaran': noPendaftaran,
      Status: 'Proses'
    };
    mockData = [newData, ...mockData];
    saveMockData(mockData);
    return { status: 'success', noPendaftaran };
  }

  return await safeFetch(GAS_WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "text/plain;charset=utf-8" },
  });
};

export const getSchoolInfo = async (npsn: string) => {
  if (!GAS_WEB_APP_URL) {
    // Fallback to direct fetch if GAS URL is not set (for local development)
    const endpoints = [
      `https://api-sekolah-indonesia.vercel.app/sekolah?npsn=${npsn}`,
      `https://api.fazriansyah.eu.org/v1/sekolah?npsn=${npsn}`,
      `https://sekolah.devapi.id/sekolah?npsn=${npsn}`
    ];

    for (const url of endpoints) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
        const result = await response.json();
        let schoolName = '';

        if (Array.isArray(result) && result.length > 0) schoolName = result[0].sekolah || result[0].nama;
        else if (result?.data?.satuanPendidikan?.nama) schoolName = result.data.satuanPendidikan.nama;
        else if (result?.data && Array.isArray(result.data) && result.data.length > 0) schoolName = result.data[0].nama || result.data[0].sekolah;
        else if (result.status === 'success' && result.data && result.data.length > 0) schoolName = result.data[0].sekolah || result.data[0].nama;

        if (schoolName) return { status: 'success', data: { sekolah: schoolName } };
      } catch (e) { continue; }
    }
    return { status: 'error', message: 'Not found' };
  }

  return await safeFetch(GAS_WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify({ action: "getSchoolInfo", npsn }),
    headers: { "Content-Type": "text/plain;charset=utf-8" },
  });
};

export const getRegistrations = async (): Promise<AdminData[]> => {
  if (!GAS_WEB_APP_URL) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [...mockData];
  }

  const result = await safeFetch(`${GAS_WEB_APP_URL}?t=${Date.now()}`);
  if (result.status === "success") {
    return result.data;
  }

  console.warn("Failed to fetch registrations, using mock data:", result.message);
  return [...mockData];
};

export const updateStatus = async (noPendaftaran: string, newStatus: string, alasan?: string) => {
  if (!GAS_WEB_APP_URL) {
    await new Promise(resolve => setTimeout(resolve, 800));
    const index = mockData.findIndex(d => d['No Pendaftaran'] === noPendaftaran);
    if (index !== -1) {
      const newData = [...mockData];
      newData[index] = { ...newData[index], Status: newStatus as any };
      if (alasan !== undefined) {
        newData[index]['Alasan Penolakan'] = alasan;
      }
      saveMockData(newData);
      return { status: "success" };
    }
    return { status: "error", message: "Data tidak ditemukan" };
  }

  return await safeFetch(GAS_WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "updateStatus",
      noPendaftaran,
      newStatus,
      alasan
    }),
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
  });
};

export const checkStatus = async (noPendaftaran: string) => {
  if (!GAS_WEB_APP_URL) {
    await new Promise(resolve => setTimeout(resolve, 800));
    const student = mockData.find(d => d['No Pendaftaran'] === noPendaftaran);
    if (student) {
      const namaKey = Object.keys(student).find(k => k.toLowerCase().includes('nama')) || 'Nama Lengkap';
      return {
        status: "success",
        data: {
          noPendaftaran: student['No Pendaftaran'],
          namaLengkap: student[namaKey] || 'Siswa',
          status: student.Status,
          alasanPenolakan: student['Alasan Penolakan']
        }
      };
    }
    return { status: "error", message: "Data tidak ditemukan" };
  }

  return await safeFetch(GAS_WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "checkStatus",
      noPendaftaran
    }),
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
  });
};

export const loginAdmin = async (username: string, password: string) => {
  if (!GAS_WEB_APP_URL) {
    await new Promise(resolve => setTimeout(resolve, 800));
    if (username === 'admin' && password === 'admin123####') {
      return { status: "success" };
    }
    return { status: "error", message: "Username atau password salah" };
  }

  return await safeFetch(GAS_WEB_APP_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "login",
      username,
      password
    }),
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
  });
};

