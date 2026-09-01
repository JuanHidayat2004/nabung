import { Student, Transaction, GoogleSheetsConfig } from '../types';
import { StorageService } from './storage';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: unknown }) => void;
            error_callback?: (error: unknown) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

// Helper fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Koneksi timeout (lebih dari 12 detik). Mohon periksa koneksi internet atau gunakan metode Webhook/Ekspor Langsung.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const GoogleSheetsService = {
  /**
   * Initializes Google OAuth with a strict safety timeout so it never hangs
   */
  async initGoogleAuth(clientId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        reject(new Error('Pustaka Google Identity Services belum selesai dimuat di browser. Periksa koneksi internet atau gunakan metode Webhook.'));
        return;
      }

      let isFinished = false;
      const timer = setTimeout(() => {
        if (!isFinished) {
          isFinished = true;
          reject(new Error('Waktu tunggu otorisasi habis (Pop-up mungkin diblokir browser atau jendela login ditutup). Silakan izinkan pop-up atau gunakan metode Webhook / ID Spreadsheet.'));
        }
      }, 25000);

      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
          callback: (response) => {
            if (isFinished) return;
            isFinished = true;
            clearTimeout(timer);

            if (response.access_token) {
              const currentConfig = StorageService.getSheetsConfig();
              const updated: GoogleSheetsConfig = {
                ...currentConfig,
                connected: true,
                syncMode: 'oauth',
                accessToken: response.access_token,
                tokenExpiresAt: Date.now() + 3500 * 1000,
              };
              StorageService.saveSheetsConfig(updated);
              resolve(response.access_token);
            } else {
              reject(new Error('Otorisasi Google Sheets dibatalkan atau tidak disetujui.'));
            }
          },
          error_callback: (err) => {
            if (isFinished) return;
            isFinished = true;
            clearTimeout(timer);
            reject(new Error(`Gagal otorisasi Google: ${JSON.stringify(err)}`));
          },
        });
        client.requestAccessToken();
      } catch (err) {
        if (isFinished) return;
        isFinished = true;
        clearTimeout(timer);
        reject(err);
      }
    });
  },

  /**
   * Fast sync via Google Apps Script Webhook (Ultra-fast, reliable, no OAuth expires)
   */
  async syncViaWebhook(
    webhookUrl: string,
    students: Student[],
    transactions: Transaction[]
  ): Promise<{ success: boolean; message: string; timestamp: string }> {
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      throw new Error('URL Webhook Google Apps Script tidak valid.');
    }

    const payload = {
      action: 'sync_all',
      school: 'SDN 5 JURIT BARU',
      timestamp: new Date().toISOString(),
      students: students.map((s) => ({
        id: s.id,
        nisn: s.nisn,
        nis: s.nis,
        name: s.name,
        gender: s.gender,
        className: s.className,
        parentName: s.parentName,
        parentPhone: s.parentPhone,
        balance: s.balance,
        savingGoal: s.savingGoal ? `${s.savingGoal.label} (${s.savingGoal.target})` : '-',
        status: s.status,
      })),
      transactions: transactions.map((t) => ({
        id: t.id,
        date: t.date,
        nisn: t.studentNisn,
        name: t.studentName,
        className: t.className,
        type: t.type === 'deposit' ? 'SETOR' : 'TARIK',
        amount: t.amount,
        previousBalance: t.previousBalance,
        currentBalance: t.currentBalance,
        note: t.note || '',
        officer: t.officerName || 'Bendahara',
        waStatus: t.waNotificationStatus === 'sent' ? 'Terkirim WA' : 'Belum Kirim',
      })),
    };

    const res = await fetchWithTimeout(webhookUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Apps Script accepts text/plain best for no CORS preflight blocks
      },
      body: JSON.stringify(payload),
    }, 15000);

    if (!res.ok) {
      throw new Error(`Server Webhook merespons status ${res.status}`);
    }

    const resData = await res.json().catch(() => ({ status: 'success' }));

    const config = StorageService.getSheetsConfig();
    config.lastSyncedAt = new Date().toISOString();
    config.connected = true;
    config.syncMode = 'webhook';
    StorageService.saveSheetsConfig(config);

    return {
      success: true,
      message: resData.message || `Berhasil sinkron cepat ke Google Sheets (${students.length} siswa, ${transactions.length} mutasi)!`,
      timestamp: config.lastSyncedAt,
    };
  },

  /**
   * Code generator for Google Apps Script
   */
  getAppsScriptTemplate(): string {
    return `/**
 * SCRIPT OTOMATIS SINKRONISASI TABUNGAN SDN 5 JURIT BARU
 * Petunjuk Pasang:
 * 1. Buka Google Spreadsheet baru di https://sheets.new
 * 2. Klik menu 'Ekstensi' (Extensions) -> 'Apps Script'
 * 3. Hapus kode bawaan, lalu Tempel (Paste) seluruh kode di bawah ini
 * 4. Klik 'Deploy' (Terapkan) -> 'New Deployment' (Penerapan Baru)
 * 5. Pilih tipe 'Web App' (Aplikasi Web)
 *    - Execute as: Me (Email Anda)
 *    - Who has access: Anyone (Siapa saja)
 * 6. Klik 'Deploy', izinkan akses (Authorize), lalu salin URL Web App yang didapat
 * 7. Tempelkan URL tersebut ke kolom Webhook di aplikasi Tabungan!
 */

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Sheet Data Siswa
    var studentSheet = ss.getSheetByName('Data_Siswa_Saldo');
    if (!studentSheet) {
      studentSheet = ss.insertSheet('Data_Siswa_Saldo');
    }
    studentSheet.clear();
    
    var studentHeaders = [
      'ID Siswa', 'NISN', 'NIS', 'Nama Siswa', 'L/P', 'Kelas',
      'Nama Orang Tua / Wali', 'No WhatsApp Wali', 'Saldo Terkini (Rp)', 'Target Tabungan', 'Status'
    ];
    var studentRows = [studentHeaders];
    if (contents.students && contents.students.length > 0) {
      contents.students.forEach(function(s) {
        studentRows.push([
          s.id, "'" + s.nisn, "'" + s.nis, s.name, s.gender, s.className,
          s.parentName, "'" + s.parentPhone, s.balance, s.savingGoal, s.status
        ]);
      });
    }
    studentSheet.getRange(1, 1, studentRows.length, studentHeaders.length).setValues(studentRows);
    studentSheet.getRange(1, 1, 1, studentHeaders.length).setBackground('#0284c7').setFontColor('#ffffff').setFontWeight('bold');
    
    // 2. Sheet Mutasi Transaksi
    var txSheet = ss.getSheetByName('Mutasi_Transaksi');
    if (!txSheet) {
      txSheet = ss.insertSheet('Mutasi_Transaksi');
    }
    txSheet.clear();
    
    var txHeaders = [
      'ID Transaksi', 'Tanggal & Waktu', 'NISN', 'Nama Siswa', 'Kelas',
      'Jenis Transaksi', 'Nominal (Rp)', 'Saldo Sebelum (Rp)', 'Saldo Akhir (Rp)',
      'Keterangan', 'Petugas Bendahara', 'Status Notif WA'
    ];
    var txRows = [txHeaders];
    if (contents.transactions && contents.transactions.length > 0) {
      contents.transactions.forEach(function(t) {
        txRows.push([
          t.id, t.date, "'" + t.nisn, t.name, t.className,
          t.type, t.amount, t.previousBalance, t.currentBalance,
          t.note, t.officer, t.waStatus
        ]);
      });
    }
    txSheet.getRange(1, 1, txRows.length, txHeaders.length).setValues(txRows);
    txSheet.getRange(1, 1, 1, txHeaders.length).setBackground('#10b981').setFontColor('#ffffff').setFontWeight('bold');
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Data berhasil disinkronkan ke Google Sheets SDN 5 JURIT BARU!',
      updatedAt: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    message: 'Webhook Tabungan SDN 5 JURIT BARU aktif & siap menerima data!'
  })).setMimeType(ContentService.MimeType.JSON);
}`;
  },

  async createNewSpreadsheet(accessToken: string, title = 'Tabungan Siswa SDN 5 JURIT BARU'): Promise<{ id: string; url: string }> {
    const res = await fetchWithTimeout('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: { title },
        sheets: [
          { properties: { title: 'Mutasi_Transaksi' } },
          { properties: { title: 'Data_Siswa_Saldo' } },
        ],
      }),
    }, 12000);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Gagal membuat Google Spreadsheet baru via Google API');
    }

    const data = await res.json();
    const id = data.spreadsheetId;
    const url = `https://docs.google.com/spreadsheets/d/${id}/edit`;

    // Initialize headers in parallel for speed
    await this.initSheetHeaders(accessToken, id);

    return { id, url };
  },

  async initSheetHeaders(accessToken: string, spreadsheetId: string) {
    const txHeaders = [
      [
        'ID Transaksi',
        'Tanggal & Waktu',
        'NISN',
        'Nama Siswa',
        'Kelas',
        'Jenis Transaksi',
        'Nominal (Rp)',
        'Saldo Sebelum (Rp)',
        'Saldo Akhir (Rp)',
        'Keterangan',
        'Petugas Bendahara',
        'Status Notif WA',
      ],
    ];

    const studentHeaders = [
      [
        'ID Siswa',
        'NISN',
        'NIS',
        'Nama Siswa',
        'L/P',
        'Kelas',
        'Nama Orang Tua / Wali',
        'No WhatsApp Wali',
        'Saldo Terkini (Rp)',
        'Target Tabungan',
        'Status',
      ],
    ];

    // Run parallel fetch for instant completion
    await Promise.all([
      fetchWithTimeout(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Mutasi_Transaksi!A1:L1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: txHeaders }),
        },
        8000
      ),
      fetchWithTimeout(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Data_Siswa_Saldo!A1:K1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: studentHeaders }),
        },
        8000
      ),
    ]);
  },

  async syncAllToGoogleSheets(
    accessToken: string,
    spreadsheetId: string,
    students: Student[],
    transactions: Transaction[]
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Prepare Students
      const studentRows = students.map((s) => [
        s.id,
        `'${s.nisn}`,
        `'${s.nis}`,
        s.name,
        s.gender,
        s.className,
        s.parentName,
        `'${s.parentPhone}`,
        s.balance,
        s.savingGoal?.target ? `${s.savingGoal.label} (${s.savingGoal.target})` : '-',
        s.status,
      ]);

      const studentData = [
        [
          'ID Siswa',
          'NISN',
          'NIS',
          'Nama Siswa',
          'L/P',
          'Kelas',
          'Nama Orang Tua / Wali',
          'No WhatsApp Wali',
          'Saldo Terkini (Rp)',
          'Target Tabungan',
          'Status',
        ],
        ...studentRows,
      ];

      // 2. Prepare Transactions
      const txRows = transactions.map((t) => [
        t.id,
        t.date,
        `'${t.studentNisn}`,
        t.studentName,
        t.className,
        t.type === 'deposit' ? 'SETOR' : 'TARIK',
        t.amount,
        t.previousBalance,
        t.currentBalance,
        t.note || '',
        t.officerName || 'Bendahara',
        t.waNotificationStatus === 'sent' ? 'Terkirim WA' : 'Belum Kirim',
      ]);

      const txData = [
        [
          'ID Transaksi',
          'Tanggal & Waktu',
          'NISN',
          'Nama Siswa',
          'Kelas',
          'Jenis Transaksi',
          'Nominal (Rp)',
          'Saldo Sebelum (Rp)',
          'Saldo Akhir (Rp)',
          'Keterangan',
          'Petugas Bendahara',
          'Status Notif WA',
        ],
        ...txRows,
      ];

      // Execute both sheet updates in parallel for high speed
      const [resStudents, resTx] = await Promise.all([
        fetchWithTimeout(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Data_Siswa_Saldo!A1:K${studentData.length}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: studentData }),
          },
          12000
        ),
        fetchWithTimeout(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Mutasi_Transaksi!A1:L${txData.length}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: txData }),
          },
          12000
        ),
      ]);

      if (!resStudents.ok || !resTx.ok) {
        throw new Error('Gagal memperbarui nilai ke Google Sheets. Token mungkin kedaluwarsa atau ID salah.');
      }

      const config = StorageService.getSheetsConfig();
      config.lastSyncedAt = new Date().toISOString();
      config.connected = true;
      config.syncMode = 'oauth';
      StorageService.saveSheetsConfig(config);

      return {
        success: true,
        message: `Berhasil sinkronisasi ${students.length} siswa & ${transactions.length} riwayat transaksi ke Google Sheets!`,
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Terjadi kesalahan sinkronisasi Google Sheets',
      };
    }
  },

  async appendSingleTransaction(
    accessToken: string,
    spreadsheetId: string,
    t: Transaction
  ): Promise<boolean> {
    try {
      const row = [
        t.id,
        t.date,
        `'${t.studentNisn}`,
        t.studentName,
        t.className,
        t.type === 'deposit' ? 'SETOR' : 'TARIK',
        t.amount,
        t.previousBalance,
        t.currentBalance,
        t.note || '',
        t.officerName || 'Bendahara',
        t.waNotificationStatus === 'sent' ? 'Terkirim WA' : 'Belum Kirim',
      ];

      const res = await fetchWithTimeout(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Mutasi_Transaksi!A:L:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [row] }),
        },
        5000
      );

      return res.ok;
    } catch {
      return false;
    }
  },
};
