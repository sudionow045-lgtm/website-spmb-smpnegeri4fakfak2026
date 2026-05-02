/**
 * Google Apps Script Backend for SPMB SMP
 * Deploy as a Web App:
 * 1. Click "Deploy" -> "New deployment"
 * 2. Select type: "Web app"
 * 3. Execute as: "Me"
 * 4. Who has access: "Anyone"
 * 5. Click "Deploy" and copy the Web App URL.
 */

const SHEET_NAME = "Data Pendaftar";
const ADMIN_SHEET_NAME = "Admin";
const SETTINGS_SHEET_NAME = "Pengaturan";
const FOLDER_NAME = "SPMB SMP";

const DEFAULT_FORM_FIELDS = [
  // --- DATA IDENTITAS PESERTA DIDIK ---
  { id: "Nama Lengkap", label: "Nama Lengkap (Sesuai Ijazah/Akta)", type: "text", required: true },
  { id: "Jenis Kelamin", label: "Jenis Kelamin", type: "select", options: ["Laki-laki", "Perempuan"], required: true },
  { id: "NISN", label: "NISN", type: "text", required: true },
  { id: "NIK", label: "NIK / No. KITAS (Untuk WNA)", type: "text", required: true },
  { id: "Tempat Lahir", label: "Tempat Lahir", type: "text", required: true },
  { id: "Tanggal Lahir", label: "Tanggal Lahir", type: "date", required: true },
  { id: "Agama", label: "Agama & Kepercayaan", type: "select", options: ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu", "Lainnya"], required: true },
  { id: "Kewarganegaraan", label: "Kewarganegaraan", type: "select", options: ["Indonesia (WNI)", "Asing (WNA)"], required: true },
  
  // --- DATA ALAMAT ---
  { id: "Alamat Lengkap", label: "Alamat Jalan / Dusun", type: "textarea", required: true },
  { id: "RT", label: "RT", type: "text", required: true },
  { id: "RW", label: "RW", type: "text", required: true },
  { id: "Desa/Kelurahan", label: "Desa / Kelurahan", type: "text", required: true },
  { id: "Kecamatan", label: "Kecamatan", type: "text", required: true },
  { id: "Kode Pos", label: "Kode Pos", type: "text", required: true },
  { id: "Jenis Tinggal", label: "Jenis Tinggal", type: "select", options: ["Bersama Orang Tua", "Wali", "Kos", "Asrama", "Panti Asuhan", "Lainnya"], required: true },
  { id: "Alat Transportasi", label: "Alat Transportasi ke Sekolah", type: "select", options: ["Jalan kaki", "Kendaraan pribadi", "Kendaraan umum", "Jemputan sekolah", "Kereta api", "Ojek", "Andong/Bendi/Sado/Kuda", "Perahu penyeberangan", "Lainnya"], required: true },
  
  // --- DATA SEKOLAH ASAL ---
  { id: "NPSN Sekolah", label: "NPSN Sekolah Asal", type: "text", required: true },
  { id: "Asal Sekolah", label: "Nama Sekolah Asal (SD/MI)", type: "text", required: true },
  
  // --- DATA ORANG TUA / WALI ---
  { id: "Nama Ayah Kandung", label: "Nama Ayah Kandung", type: "text", required: true },
  { id: "Pekerjaan Ayah Kandung", label: "Pekerjaan Ayah Kandung", type: "select", options: ["Tidak Bekerja", "Nelayan", "Petani", "Peternak", "PNS/TNI/Polri", "Karyawan Swasta", "Pedagang Kecil", "Pedagang Besar", "Wiraswasta", "Buruh", "Pensiunan", "Lainnya"], required: true },  
  { id: "Pendidikan Ayah Kandung", label: "Pendidikan Terakhir Ayah Kandung", type: "select", options: ["Tidak Sekolah", "Putus SD", "SD Sederajat", "SMP Sederajat", "SMA Sederajat", "D1", "D2", "D3", "D4/S1", "S2", "S3"], required: true },
  { id: "Penghasilan Ayah Kandung", label: "Panan Ayah Kanan Ayah Kandung", type: "select", options: ["Kurang dari 500.000", "500.000 - 999.999", "1.000.000 - 1.999.999", "2.000.000 - 4.999.999", "5.000.000 - 20.000.000", "Lebih dari 20.000.000"], required: true },
  { id: "Tahun Lahir Ayah Kandung", label: "Tahun Lahir Ayah Kandung", type: "date", required: true },
   
  { id: "Pekerjaan Ibu Kandung", label: "Pekerjaan Ibu Kandung", type: "select", options: ["Ibu Rumah Tangga", "Nelayan", "Petani", "Peternak", "PNS/TNI/Polri", "Karyawan Swasta", "Pedagang Kecil", "Pedagang Besar", "Wiraswasta", "Buruh", "Pensiunan", "Lainnya"], required: true },
  { id: "Pendidikan Ibu Kandung", label: "Pendidikan Terakhir Ibu Kandung", type: "select", options: ["Tidak Sekolah", "Putus SD", "SD Sederajat", "SMP Sederajat", "SMA Sederajat", "D1", "D2", "D3", "D4/S1", "S2", "S3"], required: true },
  { id: "Pendidikan Ibu Kandung", label: "Pendidikan Terakhir Ibu Kandung", type: "select", options: ["Tidak Sekolah", "Putus SD", "SD Sederajat", "SMP Sederajat", "SMA Sederajat", "D1", "D2", "D3", "D4/S1", "S2", "S3"], required: true },
  { id: "Penghasilan Ibu Kandung", label: "Pengahasilan Ibu Kandung", type: "select", options: ["Kurang dari 500.000", "500.000 - 999.999", "1.000.000 - 1.999.999", "2.000.000 - 4.999.999", "5.000.000 - 20.000.000", "Lebih dari 20.000.000"], required: true },
  { id: "Tahun Lahir Ibu Kandung", label: "Tahun Lahir Ibu Kandung", type: "date", required: true },
  
  { id: "No. WhatsApp Aktif", label: "No. WhatsApp Aktif (Untuk Informasi)", type: "text", required: true },
  
  // --- DATA PERIODIK ---
  { id: "Status Anak", label: "Status Anak", type: "select", options: ["Anak Kandung", "Anak Tiri", "Anak Angkat", "Keponakan", "Lainnya"], required: true },
  { id: "Tinggi Badan", label: "Tinggi Badan (cm)", type: "number", required: true },
  { id: "Berat Badan", label: "Berat Badan (kg)", type: "number", required: true },
  { id: "Jumlah Saudara Kandung", label: "Jumlah Saudara Kandung", type: "number", required: true },
  
  // --- BERKAS ---
  { id: "Pas Foto 3x4", label: "Pas Foto 3x4 (Seragam SD)", type: "file", required: true },
  { id: "Kartu Keluarga", label: "Kartu Keluarga", type: "file", required: false },
  { id: "Akta Kelahiran", label: "Akta Kelahiran", type: "file", required: false },
  { id: "Ijazah / SKL", label: "Ijazah / Surat Keterangan Lulus", type: "file", required: false },
  { id: "Sertifikat TKA Lulusan 2026", label: "Sertifikat TKA Lulusan 2026", type: "file", required: false },
  { id: "KIP/PKH/KKS", label: "KIP / PKH / KKS (Opsional)", type: "file", required: false }
];

const DEFAULT_SETTINGS = {
  namaSekolah: "SMP NEGERI 4 FAKFAK",
  alamat: "Jl. Fakfak - Sanggram Fakfak - Papua Barat RT/RW: 003/001 Kec. Fakfak Tengah Kab. Fak-Fak",
  telepon: "082199379131",
    email: "info@smpnegeri4fakfak.sch.id",
    deskripsi: "Mencetak generasi penerus bangsa yang cerdas, berakhlak mulia, dan siap menghadapi tantangan masa depan dengan pendidikan berkualitas.",
  statusPendaftaran: "Buka",
  logoSekolah: "https://iili.io/3tdgMhb.png",
  fotoKepalaSekolah: "https://i.imgur.com/IsRemqW.jpeg",
  koordinatSekolah: "-2.9595913880821785, 132.3518155747581",
  visiSekolah: "TERWUJUDNYA PESERTA DIDIK YANG BERIMAN, BERTAKWA KEPADA TUHAN YANG MAHA ESA DAN MEMILIKI CIPTA, RASA, KARSA YANG BERKARAKTER PANCASILA",
  misiSekolah: "1. Mengembangkan keimanan dan ketaqwaan Terhadap Tuhan Yang Maha Esa.\n2. Mengembangkan sikap Disiplin, jujur, mandiri dan bertanggungjawab berdasarkan nilai-nilai Pancasila serta budaya kearifan lokal.\n3. Mengembangkan sikap salam, senyum, sapa, sopan dan santun (5S)\n4. Mengembangkan kegiatan literasi dan numerasi peserta didik.\n5. Mengembangkan Ilmu pengetahuan dan teknologi di lingkungan sekolah.",
  kontakPanitia: "Ketua Panitia (Yuliana Solli, S.Pd : 0813-4110-1415)\nSekretaris (Lusia Glego, S.Pd : 0852-9813-3019)\nAnggota (Fredesvinda Dian Nugraheni, S.T : 0852-4453-6017)\nAnggota (Wa Nur Yanti, S.Pd : 0813-4407-2027)\nAnggota (Martina Horik, S.Pd : 0812-4004-1386)",
  panduanJudul: "Panduan Pendaftaran SPMB",
  panduanDeskripsi: "Persiapkan dokumen berikut sebelum mulai mengisi formulir pendaftaran.",
  panduanPeringatan: "Pastikan semua dokumen di-scan atau difoto dengan jelas dan dapat terbaca. Format file yang disarankan adalah JPG, PNG, atau PDF dengan ukuran maksimal 2MB per file.",
  panduanDokumen: JSON.stringify([
    { id: "1", icon: "FileDigit", title: "Kartu Keluarga (KK)", description: "Asli atau fotokopi yang jelas. Pastikan NIK dan nama calon siswa tercantum dengan benar sesuai data kependudukan." },
    { id: "2", icon: "FileBadge", title: "Akta Kelahiran", description: "Dokumen asli atau fotokopi untuk verifikasi usia dan data diri calon siswa." },
    { id: "3", icon: "FileImage", title: "Pas Foto 3x4", description: "Pas foto terbaru berwarna (mengenakan seragam SD/MI) dengan latar belakang merah atau biru." },
    { id: "4", icon: "FileText", title: "Ijazah / SKL", description: "Ijazah asli atau Surat Keterangan Lulus (SKL) dari jenjang SD/MI/Sederajat." },
    { id: "5", icon: "FileBadge", title: "Sertifikat TKA", description: "Sertifikat Tes Kemampuan Agama (TKA) bagi yang memiliki (khusus lulusan tahun 2026)." },
    { id: "6", icon: "FileText", title: "KIP/PKH/KKS (Jika Ada)", description: "Bukti kepesertaan program bantuan pemerintah untuk jalur afirmasi (jika memiliki)." }
  ]),
  panduanAlur: JSON.stringify([
    "Siapkan seluruh dokumen persyaratan dalam bentuk file digital (foto/scan).",
    "Klik tombol 'Mulai Pendaftaran' di bawah atau menu 'Daftar' di navigasi.",
    "Isi seluruh kolom formulir dengan data yang valid dan sesuai dengan dokumen asli.",
    "Tandai lokasi rumah Anda di peta yang disediakan untuk perhitungan jarak.",
    "Unggah dokumen persyaratan pada kolom yang tersedia.",
    "Kirim formulir dan simpan Nomor Pendaftaran Anda untuk mengecek status kelulusan."
  ]),
  formFields: JSON.stringify(DEFAULT_FORM_FIELDS)
};

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Setup Data Pendaftar Sheet
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = ["Timestamp", "No Pendaftaran", "Status"];
    DEFAULT_FORM_FIELDS.forEach(f => headers.push(f.id));
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e0e0e0");
    sheet.setFrozenRows(1);
  }

  // Setup Admin Sheet
  let adminSheet = ss.getSheetByName(ADMIN_SHEET_NAME);
  if (!adminSheet) {
    adminSheet = ss.insertSheet(ADMIN_SHEET_NAME);
    adminSheet.appendRow(["Username", "Password"]);
    adminSheet.appendRow(["admin", "admin123####"]); // Default credentials
    adminSheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#e0e0e0");
  }

  // Setup Settings Sheet
  let settingsSheet = ss.getSheetByName(SETTINGS_SHEET_NAME);
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet(SETTINGS_SHEET_NAME);
    settingsSheet.appendRow(["Key", "Value"]);
    Object.keys(DEFAULT_SETTINGS).forEach(key => {
      settingsSheet.appendRow([key, DEFAULT_SETTINGS[key]]);
    });
    settingsSheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#e0e0e0");
  } else {
    // Check for missing keys in existing settings sheet
    const data = settingsSheet.getDataRange().getValues();
    const existingKeys = data.map(row => row[0]);
    Object.keys(DEFAULT_SETTINGS).forEach(key => {
      if (!existingKeys.includes(key)) {
        settingsSheet.appendRow([key, DEFAULT_SETTINGS[key]]);
      }
    });
  }

  // Setup Drive Folder
  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (!folders.hasNext()) {
    DriveApp.createFolder(FOLDER_NAME);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === "login") return handleLogin(data.username, data.password);
    if (data.action === "checkStatus") return handleCheckStatus(data.noPendaftaran);
    if (data.action === "updateStatus") return updateStatus(data.noPendaftaran, data.newStatus);
    if (data.action === "updateSettings") return handleUpdateSettings(data.settings);
    if (data.action === "getSchoolInfo") return getSchoolInfo(data.npsn);
    
    return handleRegistration(data);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    if (e.parameter.action === "getSettings") {
      return handleGetSettings();
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Sheet not found"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const result = rows.map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        if (row[index] instanceof Date) {
           obj[header] = row[index].toISOString();
        } else {
           obj[header] = row[index];
        }
      });
      return obj;
    });
    
    // Sort by timestamp descending
    result.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      data: result
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleGetSettings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SETTINGS_SHEET_NAME);
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      data: DEFAULT_SETTINGS
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getValues();
  const settings = {};
  for (let i = 1; i < data.length; i++) {
    settings[data[i][0]] = data[i][1];
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    data: settings
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleUpdateSettings(newSettings) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SETTINGS_SHEET_NAME);
  if (!sheet) throw new Error("Settings sheet not found");

  const data = sheet.getDataRange().getValues();
  
  Object.keys(newSettings).forEach(key => {
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(
          typeof newSettings[key] === 'object' ? JSON.stringify(newSettings[key]) : newSettings[key]
        );
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, typeof newSettings[key] === 'object' ? JSON.stringify(newSettings[key]) : newSettings[key]]);
    }
  });

  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Pengaturan berhasil disimpan"
  })).setMimeType(ContentService.MimeType.JSON);
}

function getSchoolInfo(npsn) {
  try {
    const endpoints = [
      `https://api-sekolah-indonesia.vercel.app/sekolah?npsn=${npsn}`,
      `https://api.fazriansyah.eu.org/v1/sekolah?npsn=${npsn}`,
      `https://sekolah.devapi.id/sekolah?npsn=${npsn}`
    ];

    let schoolName = "";

    for (let url of endpoints) {
      try {
        const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
        const content = response.getContentText();
        const result = JSON.parse(content);

        if (Array.isArray(result) && result.length > 0) {
          schoolName = result[0].sekolah || result[0].nama;
        } else if (result && result.data) {
          if (result.data.satuanPendidikan && result.data.satuanPendidikan.nama) {
            schoolName = result.data.satuanPendidikan.nama;
          } else if (Array.isArray(result.data) && result.data.length > 0) {
            schoolName = result.data[0].nama || result.data[0].sekolah;
          }
        } else if (result && result.status === "success" && result.data && result.data.length > 0) {
          schoolName = result.data[0].sekolah || result.data[0].nama;
        }

        if (schoolName) break;
      } catch (e) {
        continue;
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: schoolName ? "success" : "error",
      data: { sekolah: schoolName }
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleRegistration(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  // Check if registration is open
  const settingsSheet = ss.getSheetByName(SETTINGS_SHEET_NAME);
  let isOpen = true;
  if (settingsSheet) {
    const settingsData = settingsSheet.getDataRange().getValues();
    for (let i = 1; i < settingsData.length; i++) {
      if (settingsData[i][0] === "statusPendaftaran" && settingsData[i][1] === "Tutup") {
        isOpen = false;
        break;
      }
    }
  }

  if (!isOpen) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Pendaftaran sedang ditutup."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Generate No Pendaftaran
  const year = new Date().getFullYear();
  const lastRow = sheet.getLastRow();
  let nextId = 1;
  if (lastRow > 1) {
    // Find No Pendaftaran column index
    const noRegIdx = headers.indexOf("No Pendaftaran");
    if (noRegIdx !== -1) {
      const lastNo = sheet.getRange(lastRow, noRegIdx + 1).getValue();
      const parts = String(lastNo).split("-");
      if (parts.length === 3) {
        nextId = parseInt(parts[2], 10) + 1;
      }
    }
  }
  const noPendaftaran = `SPMB-${year}-${String(nextId).padStart(3, '0')}`;
  
  const folder = getOrCreateFolder(FOLDER_NAME);
  const rowData = new Array(headers.length).fill("");
  
  // Fill known headers
  headers.forEach((header, index) => {
    if (header === "Timestamp") rowData[index] = new Date();
    else if (header === "No Pendaftaran") rowData[index] = noPendaftaran;
    else if (header === "Status") rowData[index] = "Proses";
    else if (data[header] !== undefined) {
      let value = data[header];
      if (typeof value === 'string' && value.startsWith('data:')) {
        value = uploadFile(value, `${noPendaftaran}_${header}`, folder);
      }
      rowData[index] = value;
    }
  });

  // Check for new fields in data that aren't in headers
  Object.keys(data).forEach(key => {
    if (key !== "action" && !headers.includes(key)) {
      headers.push(key);
      sheet.getRange(1, headers.length).setValue(key);
      
      let value = data[key];
      if (typeof value === 'string' && value.startsWith('data:')) {
        value = uploadFile(value, `${noPendaftaran}_${key}`, folder);
      }
      rowData.push(value);
    }
  });
  
  sheet.appendRow(rowData);
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Pendaftaran berhasil",
    noPendaftaran: noPendaftaran
  })).setMimeType(ContentService.MimeType.JSON);
}

// ... (keep handleLogin, handleCheckStatus, updateStatus, getOrCreateFolder, uploadFile, doOptions as they were)

function handleLogin(username, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ADMIN_SHEET_NAME);
  if (!sheet) throw new Error("Sheet Admin tidak ditemukan");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username && data[i][1] === password) {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Login berhasil" })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Username atau password salah" })).setMimeType(ContentService.MimeType.JSON);
}

function handleCheckStatus(noPendaftaran) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error("Database belum siap");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const noRegIdx = headers.indexOf("No Pendaftaran");
  const namaIdx = headers.indexOf("Nama Lengkap");
  const statusIdx = headers.indexOf("Status");

  for (let i = 1; i < data.length; i++) {
    if (data[i][noRegIdx] === noPendaftaran) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        data: {
          noPendaftaran: data[i][noRegIdx],
          namaLengkap: namaIdx !== -1 ? data[i][namaIdx] : "Siswa",
          status: statusIdx !== -1 ? data[i][statusIdx] : "Proses"
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Nomor pendaftaran tidak ditemukan" })).setMimeType(ContentService.MimeType.JSON);
}

function updateStatus(noPendaftaran, newStatus) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const noRegIdx = headers.indexOf("No Pendaftaran");
  const statusIdx = headers.indexOf("Status");
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][noRegIdx] === noPendaftaran) {
      sheet.getRange(i + 1, statusIdx + 1).setValue(newStatus);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Status berhasil diupdate" })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Data tidak ditemukan" })).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
}

function uploadFile(base64Data, filename, folder) {
  if (!base64Data) return "";
  try {
    const splitBase = base64Data.split(',');
    const type = splitBase[0].split(';')[0].replace('data:', '');
    const byteCharacters = Utilities.base64Decode(splitBase[1]);
    const blob = Utilities.newBlob(byteCharacters, type, filename);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    return "Error uploading file";
  }
}

function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT).setHeaders({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  });
}
