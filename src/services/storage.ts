import { Student, Transaction, SchoolProfile, GoogleSheetsConfig, WhatsAppConfig } from '../types';
import { FirestoreService } from './firebase';

const STORAGE_KEYS = {
  STUDENTS: 'sdn5_students_v1',
  TRANSACTIONS: 'sdn5_transactions_v1',
  SCHOOL_PROFILE: 'sdn5_school_profile_v1',
  SHEETS_CONFIG: 'sdn5_sheets_config_v1',
  WA_CONFIG: 'sdn5_wa_config_v1',
  ADMIN_USERNAME: 'sdn5_admin_username_v1',
  ADMIN_PASSWORD: 'sdn5_admin_password_v1',
  OFFLINE_QUEUE: 'sdn5_offline_queue_v1',
  CLOUD_INITIALIZED: 'sdn5_cloud_initialized_v1',
  FRESH_PURGE_APPLIED: 'sdn5_fresh_purge_v2',
};

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  name: 'SD NEGERI 5 JURIT BARU',
  subTitle: 'PEMERINTAH KABUPATEN LOMBOK TIMUR - DINAS PENDIDIKAN DAN KEBUDAYAAN',
  npsn: '50205842',
  address: 'Jl. Rinjani Selak Aik Desa Jurit Baru',
  district: 'Kecamatan Pringgasela',
  regency: 'Kabupaten Lombok Timur',
  province: 'Nusa Tenggara Barat (NTB)',
  headmaster: 'ABD. RAHMAN, S.Pd',
  headmasterNip: '196612311988031295',
  treasurer: 'H. SUJAI, S.Pd',
  treasurerNip: '196812311994031082',
  phone: '0819-3678-9012',
  email: 'sdn5juritbaru@gmail.com',
};

export const DEFAULT_WA_CONFIG: WhatsAppConfig = {
  autoOpenOnTransaction: true,
  customTemplate: `*NOTIFIKASI TABUNGAN SISWA*
🏫 *SDN 5 JURIT BARU*
━━━━━━━━━━━━━━━━━━━━
Yth. Bapak/Ibu Wali Murid dari:
👤 *Nama Siswa*: {NAMA_SISWA}
🆔 *NISN / No. Induk*: {NISN}
🏫 *Kelas*: {KELAS}

Telah dilakukan transaksi tabungan dengan rincian sbb:
📌 *Jenis Transaksi*: {JENIS_TRANSAKSI}
💰 *Nominal*: *{NOMINAL}*
📅 *Tanggal & Jam*: {TANGGAL}
📝 *Keterangan*: {CATATAN}
━━━━━━━━━━━━━━━━━━━━
💵 *Saldo Sebelumnya*: {SALDO_LAMA}
💎 *SALDO AKHIR*: *{SALDO_BARU}*
━━━━━━━━━━━━━━━━━━━━
_Catatan: Transaksi ini tercatat resmi di Buku Kas Tabungan Digital SDN 5 JURIT BARU._
Petugas Bendahara: {PETUGAS}

Terima kasih atas kepercayaannya menabung demi masa depan pendidikan ananda! 🙏✨`,
  senderSignature: 'Bendahara Tabungan SDN 5 JURIT BARU',
  includeSchoolContact: true,
  defaultCountryCode: '62',
};

export const DEFAULT_SHEETS_CONFIG: GoogleSheetsConfig = {
  connected: false,
  spreadsheetId: '',
  spreadsheetUrl: '',
  sheetNameTransactions: 'Mutasi_Transaksi',
  sheetNameStudents: 'Data_Siswa_Saldo',
  lastSyncedAt: null,
  autoSync: true,
  accessToken: null,
};

// Fresh initial dataset without sample dummy students
export const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

let isSyncInitialized = false;

// Helper Storage API with Cloud Firestore Real-time synchronization
export const StorageService = {
  // Clear any leftover dummy test students or transactions from previous testing
  cleanOldDummyDataIfPresent() {
    try {
      const isPurged = localStorage.getItem(STORAGE_KEYS.FRESH_PURGE_APPLIED);
      if (!isPurged) {
        const rawStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
        if (rawStudents) {
          try {
            const parsed = JSON.parse(rawStudents);
            if (Array.isArray(parsed) && parsed.some((s: Student) => s.id && (s.id.startsWith('std-10') || s.id.startsWith('std-20') || s.id.startsWith('std-30') || s.id.startsWith('std-40') || s.id.startsWith('std-50') || s.id.startsWith('std-60')))) {
              localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
              localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
              FirestoreService.clearAllData().catch((err) => console.warn('Clear old dummy data error:', err));
            }
          } catch {
            localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
          }
        }
        localStorage.setItem(STORAGE_KEYS.FRESH_PURGE_APPLIED, 'true');
      }
    } catch {
      // ignore
    }
  },

  // Initialize Real-time synchronization with Firestore
  initRealtimeSync(onSyncStatusChange?: (status: { isConnected: boolean; lastSync: Date }) => void) {
    this.cleanOldDummyDataIfPresent();

    if (isSyncInitialized) return () => {};
    isSyncInitialized = true;

    // 1. Subscribe to real-time student updates across all devices
    const unsubStudents = FirestoreService.subscribeStudents((cloudStudents) => {
      // Detect if cloud still has old sample test data
      const hasDummyCloud = cloudStudents.some(
        (s) => s.id && (s.id === 'std-101' || s.id === 'std-102' || s.id === 'std-201')
      );
      if (hasDummyCloud) {
        FirestoreService.clearAllData().catch((err) => console.warn('[Firestore] Error clearing dummy:', err));
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
        window.dispatchEvent(new CustomEvent('sdn5_students_updated', { detail: [] }));
        window.dispatchEvent(new CustomEvent('sdn5_transactions_updated', { detail: [] }));
        return;
      }

      if (cloudStudents) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(cloudStudents));
        window.dispatchEvent(new CustomEvent('sdn5_students_updated', { detail: cloudStudents }));
        if (onSyncStatusChange) {
          onSyncStatusChange({ isConnected: true, lastSync: new Date() });
        }
      }
    });

    // 2. Subscribe to real-time transactions across all devices
    const unsubTxs = FirestoreService.subscribeTransactions((cloudTxs) => {
      const hasDummyTxs = cloudTxs.some(
        (t) => t.id && (t.id.startsWith('tx-20260831') || t.id.startsWith('tx-20260830'))
      );
      if (hasDummyTxs) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
        window.dispatchEvent(new CustomEvent('sdn5_transactions_updated', { detail: [] }));
        return;
      }

      if (cloudTxs) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(cloudTxs));
        window.dispatchEvent(new CustomEvent('sdn5_transactions_updated', { detail: cloudTxs }));
        if (onSyncStatusChange) {
          onSyncStatusChange({ isConnected: true, lastSync: new Date() });
        }
      }
    });

    // 3. Subscribe to real-time settings across all devices
    const unsubSettings = FirestoreService.subscribeSettings((settings) => {
      if (settings.school) {
        localStorage.setItem(STORAGE_KEYS.SCHOOL_PROFILE, JSON.stringify(settings.school));
        window.dispatchEvent(new CustomEvent('sdn5_school_updated', { detail: settings.school }));
      }
      if (settings.wa) {
        localStorage.setItem(STORAGE_KEYS.WA_CONFIG, JSON.stringify(settings.wa));
        window.dispatchEvent(new CustomEvent('sdn5_wa_updated', { detail: settings.wa }));
      }
      if (settings.sheets) {
        localStorage.setItem(STORAGE_KEYS.SHEETS_CONFIG, JSON.stringify(settings.sheets));
        window.dispatchEvent(new CustomEvent('sdn5_sheets_updated', { detail: settings.sheets }));
      }
      if (settings.adminPassword) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, settings.adminPassword);
      }
      if (settings.adminUsername) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_USERNAME, settings.adminUsername);
      }
      if (onSyncStatusChange) {
        onSyncStatusChange({ isConnected: true, lastSync: new Date() });
      }
    });

    return () => {
      unsubStudents();
      unsubTxs();
      unsubSettings();
      isSyncInitialized = false;
    };
  },

  getStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (!data) {
        this.saveStudents(INITIAL_STUDENTS);
        return INITIAL_STUDENTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_STUDENTS;
    }
  },

  saveStudents(students: Student[], syncCloud = true) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    window.dispatchEvent(new CustomEvent('sdn5_students_updated', { detail: students }));

    // Sync to Cloud Firestore in background
    if (syncCloud) {
      if (students.length === 0) {
        FirestoreService.clearAllData().catch((err) =>
          console.warn('[Firestore] Error clearing cloud data:', err)
        );
      } else {
        FirestoreService.syncLocalToCloud(
          students,
          this.getTransactions(),
          this.getSchoolProfile(),
          this.getWAConfig(),
          this.getSheetsConfig()
        ).catch((err) => console.warn('[Firestore] Error syncing students to cloud:', err));
      }
    }
  },

  getStudentById(id: string): Student | undefined {
    const students = this.getStudents();
    return students.find((s) => s.id === id);
  },

  findStudentByLogin(identifier: string): Student | undefined {
    const students = this.getStudents();
    const cleanId = identifier.trim().toLowerCase();
    return students.find(
      (s) =>
        s.nisn.toLowerCase() === cleanId ||
        s.nis.toLowerCase() === cleanId ||
        s.name.toLowerCase() === cleanId ||
        s.parentPhone.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, '')
    );
  },

  updateStudent(student: Student) {
    const students = this.getStudents();
    const index = students.findIndex((s) => s.id === student.id);
    if (index >= 0) {
      students[index] = student;
    } else {
      students.push(student);
    }
    this.saveStudents(students, false);

    // Save directly to Firestore doc
    FirestoreService.saveStudent(student).catch((err) => {
      console.warn('[Firestore] Fallback to batch sync on save student error:', err);
      this.saveStudents(students, true);
    });
  },

  deleteStudent(id: string) {
    const students = this.getStudents().filter((s) => s.id !== id);
    this.saveStudents(students, false);

    // Delete directly from Firestore doc
    FirestoreService.deleteStudent(id).catch((err) => {
      console.warn('[Firestore] Fallback to batch sync on delete student error:', err);
      this.saveStudents(students, true);
    });
  },

  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) {
        this.saveTransactions(INITIAL_TRANSACTIONS);
        return INITIAL_TRANSACTIONS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  },

  saveTransactions(transactions: Transaction[], syncCloud = true) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    window.dispatchEvent(new CustomEvent('sdn5_transactions_updated', { detail: transactions }));

    if (syncCloud) {
      FirestoreService.syncLocalToCloud(
        this.getStudents(),
        transactions,
        this.getSchoolProfile(),
        this.getWAConfig(),
        this.getSheetsConfig()
      ).catch((err) => console.warn('[Firestore] Error syncing tx to cloud:', err));
    }
  },

  addTransaction(tx: Omit<Transaction, 'id' | 'syncedToSheets'>): Transaction {
    const transactions = this.getTransactions();
    const students = this.getStudents();
    const student = students.find((s) => s.id === tx.studentId);

    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      syncedToSheets: false,
    };

    // Update student balance
    if (student) {
      student.balance = newTx.currentBalance;
      this.updateStudent(student);
    }

    transactions.unshift(newTx);
    this.saveTransactions(transactions, false);

    // Save transaction directly to Firestore
    FirestoreService.saveTransaction(newTx).catch((err) => {
      console.warn('[Firestore] Error saving tx to cloud:', err);
    });

    return newTx;
  },

  updateTransactionStatus(id: string, waStatus: 'sent' | 'pending' | 'not_sent', syncedToSheets?: boolean) {
    const transactions = this.getTransactions();
    const target = transactions.find((t) => t.id === id);
    if (target) {
      target.waNotificationStatus = waStatus;
      if (waStatus === 'sent') {
        target.waSentAt = new Date().toISOString();
      }
      if (typeof syncedToSheets === 'boolean') {
        target.syncedToSheets = syncedToSheets;
      }
      this.saveTransactions(transactions, false);

      FirestoreService.saveTransaction(target).catch((err) => {
        console.warn('[Firestore] Error updating tx in cloud:', err);
      });
    }
  },

  getTransactionsByStudent(studentId: string): Transaction[] {
    return this.getTransactions().filter((t) => t.studentId === studentId);
  },

  getSchoolProfile(): SchoolProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCHOOL_PROFILE);
      if (!data) {
        this.saveSchoolProfile(DEFAULT_SCHOOL_PROFILE);
        return DEFAULT_SCHOOL_PROFILE;
      }
      const parsed: SchoolProfile = JSON.parse(data);
      if (!parsed.headmaster || parsed.headmaster.includes('Sudirman') || parsed.treasurer.includes('Baiq Nurul')) {
        const updated: SchoolProfile = {
          ...parsed,
          name: 'SD NEGERI 5 JURIT BARU',
          subTitle: 'PEMERINTAH KABUPATEN LOMBOK TIMUR - DINAS PENDIDIKAN DAN KEBUDAYAAN',
          address: 'Jl. Rinjani Selak Aik Desa Jurit Baru',
          district: 'Kecamatan Pringgasela',
          regency: 'Kabupaten Lombok Timur',
          headmaster: 'ABD. RAHMAN, S.Pd',
          headmasterNip: '196612311988031295',
          treasurer: 'H. SUJAI, S.Pd',
          treasurerNip: '196812311994031082',
        };
        this.saveSchoolProfile(updated);
        return updated;
      }
      return parsed;
    } catch {
      return DEFAULT_SCHOOL_PROFILE;
    }
  },

  saveSchoolProfile(profile: SchoolProfile) {
    localStorage.setItem(STORAGE_KEYS.SCHOOL_PROFILE, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent('sdn5_school_updated', { detail: profile }));
    FirestoreService.saveSchoolProfile(profile).catch((err) => {
      console.warn('[Firestore] Error saving school profile:', err);
    });
  },

  getSheetsConfig(): GoogleSheetsConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHEETS_CONFIG);
      if (!data) {
        this.saveSheetsConfig(DEFAULT_SHEETS_CONFIG);
        return DEFAULT_SHEETS_CONFIG;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_SHEETS_CONFIG;
    }
  },

  saveSheetsConfig(config: GoogleSheetsConfig) {
    localStorage.setItem(STORAGE_KEYS.SHEETS_CONFIG, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('sdn5_sheets_updated', { detail: config }));
    FirestoreService.saveSheetsConfig(config).catch((err) => {
      console.warn('[Firestore] Error saving sheets config:', err);
    });
  },

  getWAConfig(): WhatsAppConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WA_CONFIG);
      if (!data) {
        this.saveWAConfig(DEFAULT_WA_CONFIG);
        return DEFAULT_WA_CONFIG;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_WA_CONFIG;
    }
  },

  saveWAConfig(config: WhatsAppConfig) {
    localStorage.setItem(STORAGE_KEYS.WA_CONFIG, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('sdn5_wa_updated', { detail: config }));
    FirestoreService.saveWAConfig(config).catch((err) => {
      console.warn('[Firestore] Error saving WA config:', err);
    });
  },

  getAdminUsername(): string {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_USERNAME) || 'admin';
  },

  setAdminUsername(username: string) {
    const cleanUser = username.trim();
    localStorage.setItem(STORAGE_KEYS.ADMIN_USERNAME, cleanUser);
    FirestoreService.saveAdminConfig(cleanUser, this.getAdminPassword()).catch((err) => {
      console.warn('[Firestore] Error saving admin username:', err);
    });
  },

  getAdminPassword(): string {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD) || 'admin123';
  },

  setAdminPassword(password: string) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, password);
    FirestoreService.saveAdminConfig(this.getAdminUsername(), password).catch((err) => {
      console.warn('[Firestore] Error saving admin password:', err);
    });
  },

  resetToDefault() {
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.SCHOOL_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.SHEETS_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.WA_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_USERNAME);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_PASSWORD);
    FirestoreService.clearAllData().catch((err) => console.warn(err));
    window.location.reload();
  },

  exportBackupJson(): string {
    const backup = {
      schoolProfile: this.getSchoolProfile(),
      students: this.getStudents(),
      transactions: this.getTransactions(),
      sheetsConfig: this.getSheetsConfig(),
      waConfig: this.getWAConfig(),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackupJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.students)) {
        this.saveStudents(parsed.students);
      }
      if (Array.isArray(parsed.transactions)) {
        this.saveTransactions(parsed.transactions);
      }
      if (parsed.schoolProfile) {
        this.saveSchoolProfile(parsed.schoolProfile);
      }
      if (parsed.waConfig) {
        this.saveWAConfig(parsed.waConfig);
      }
      return true;
    } catch {
      return false;
    }
  },
};
