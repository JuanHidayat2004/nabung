import { Student, Transaction, SchoolProfile, GoogleSheetsConfig, WhatsAppConfig } from '../types';
import { FirestoreService } from './firebase';

const STORAGE_KEYS = {
  STUDENTS: 'sdn5_students_v1',
  TRANSACTIONS: 'sdn5_transactions_v1',
  SCHOOL_PROFILE: 'sdn5_school_profile_v1',
  SHEETS_CONFIG: 'sdn5_sheets_config_v1',
  WA_CONFIG: 'sdn5_wa_config_v1',
  ADMIN_PASSWORD: 'sdn5_admin_password_v1',
  OFFLINE_QUEUE: 'sdn5_offline_queue_v1',
  CLOUD_INITIALIZED: 'sdn5_cloud_initialized_v1',
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

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-101',
    nisn: '0123456781',
    nis: '1021',
    name: 'Ahmad Faiz Al-Ghifari',
    gender: 'L',
    classId: '1',
    className: 'Kelas 1',
    parentName: 'Muhammad Zulkifli (Ayah)',
    parentPhone: '081234567890',
    password: '123456',
    balance: 145000,
    savingGoal: { target: 300000, label: 'Perlengkapan Sekolah & Sepatu Baru', active: true },
    address: 'Dusun Montong Gedeng, Jurit Baru',
    joinedDate: '2025-07-15',
    status: 'active',
  },
  {
    id: 'std-102',
    nisn: '0123456782',
    nis: '1022',
    name: 'Siti Nur Aisyah',
    gender: 'P',
    classId: '1',
    className: 'Kelas 1',
    parentName: 'Hj. Rohana (Ibu)',
    parentPhone: '081987654321',
    password: '123456',
    balance: 210000,
    savingGoal: { target: 500000, label: 'Tabungan Kenaikan Kelas', active: true },
    address: 'Dusun Jurit Lauk, Jurit Baru',
    joinedDate: '2025-07-15',
    status: 'active',
  },
  {
    id: 'std-201',
    nisn: '0112345683',
    nis: '0981',
    name: 'Muhammad Rizky Pratama',
    gender: 'L',
    classId: '2',
    className: 'Kelas 2',
    parentName: 'H. Sudarman (Ayah)',
    parentPhone: '087865432109',
    password: '123456',
    balance: 380000,
    savingGoal: { target: 600000, label: 'Sepeda Baru', active: true },
    address: 'Dusun Tibu Karang, Jurit Baru',
    joinedDate: '2024-07-15',
    status: 'active',
  },
  {
    id: 'std-202',
    nisn: '0112345684',
    nis: '0982',
    name: 'Baiq Zahra Maulida',
    gender: 'P',
    classId: '2',
    className: 'Kelas 2',
    parentName: 'Lalu Samsul Hadi (Ayah)',
    parentPhone: '085934567812',
    password: '123456',
    balance: 520000,
    savingGoal: { target: 1000000, label: 'Tabungan Masa Depan', active: true },
    address: 'Dusun Otak Kokok, Jurit Baru',
    joinedDate: '2024-07-15',
    status: 'active',
  },
  {
    id: 'std-301',
    nisn: '0102345685',
    nis: '0871',
    name: 'Dimas Ardiansyah',
    gender: 'L',
    classId: '3',
    className: 'Kelas 3',
    parentName: 'Suryadi (Ayah)',
    parentPhone: '081345678901',
    password: '123456',
    balance: 415000,
    savingGoal: { target: 750000, label: 'Study Tour & Tas', active: true },
    address: 'Dusun Dasan Gedang, Jurit Baru',
    joinedDate: '2023-07-15',
    status: 'active',
  },
  {
    id: 'std-302',
    nisn: '0102345686',
    nis: '0872',
    name: 'Nurul Hidayah',
    gender: 'P',
    classId: '3',
    className: 'Kelas 3',
    parentName: 'Khadijah (Ibu)',
    parentPhone: '082198765432',
    password: '123456',
    balance: 630000,
    savingGoal: { target: 1000000, label: 'Kebutuhan Sekolah', active: true },
    address: 'Dusun Joben, Jurit Baru',
    joinedDate: '2023-07-15',
    status: 'active',
  },
  {
    id: 'std-401',
    nisn: '0092345687',
    nis: '0761',
    name: 'Lalu Fathur Rahman',
    gender: 'L',
    classId: '4',
    className: 'Kelas 4',
    parentName: 'Lalu M. Taufik (Ayah)',
    parentPhone: '081912345678',
    password: '123456',
    balance: 750000,
    savingGoal: { target: 1200000, label: 'Laptop/Tablet Belajar', active: true },
    address: 'Dusun Montong Gedeng, Jurit Baru',
    joinedDate: '2022-07-15',
    status: 'active',
  },
  {
    id: 'std-402',
    nisn: '0092345688',
    nis: '0762',
    name: 'Nabila Putri Rahmawati',
    gender: 'P',
    classId: '4',
    className: 'Kelas 4',
    parentName: 'Wayan Hendra (Ayah)',
    parentPhone: '087765432190',
    password: '123456',
    balance: 890000,
    savingGoal: { target: 1500000, label: 'Tabungan SMP', active: true },
    address: 'Dusun Tibu Karang, Jurit Baru',
    joinedDate: '2022-07-15',
    status: 'active',
  },
  {
    id: 'std-501',
    nisn: '0082345689',
    nis: '0651',
    name: 'Fauzan Azima',
    gender: 'L',
    classId: '5',
    className: 'Kelas 5',
    parentName: 'H. Mukhlis (Ayah)',
    parentPhone: '081234567811',
    password: '123456',
    balance: 1120000,
    savingGoal: { target: 2000000, label: 'Daftar Masuk Pondok / SMP', active: true },
    address: 'Dusun Jurit Daye, Jurit Baru',
    joinedDate: '2021-07-15',
    status: 'active',
  },
  {
    id: 'std-502',
    nisn: '0082345690',
    nis: '0652',
    name: 'Salma Khairunnisa',
    gender: 'P',
    classId: '5',
    className: 'Kelas 5',
    parentName: 'Mariani (Ibu)',
    parentPhone: '085234567822',
    password: '123456',
    balance: 950000,
    savingGoal: { target: 1500000, label: 'Biaya Ujian & Bimbel', active: true },
    address: 'Dusun Otak Kokok, Jurit Baru',
    joinedDate: '2021-07-15',
    status: 'active',
  },
  {
    id: 'std-601',
    nisn: '0072345691',
    nis: '0541',
    name: 'Rian Syahputra',
    gender: 'L',
    classId: '6',
    className: 'Kelas 6',
    parentName: 'Amrullah (Ayah)',
    parentPhone: '081907654321',
    password: '123456',
    balance: 1450000,
    savingGoal: { target: 2500000, label: 'Biaya Masuk MTs/SMP Negeri', active: true },
    address: 'Dusun Dasan Jurit, Jurit Baru',
    joinedDate: '2020-07-15',
    status: 'active',
  },
  {
    id: 'std-602',
    nisn: '0072345692',
    nis: '0542',
    name: 'Qonita Nailah',
    gender: 'P',
    classId: '6',
    className: 'Kelas 6',
    parentName: 'Lalu M. Nasir (Ayah)',
    parentPhone: '087812345699',
    password: '123456',
    balance: 1820000,
    savingGoal: { target: 3000000, label: 'Seragam & Perlengkapan SMP', active: true },
    address: 'Dusun Joben Lauk, Jurit Baru',
    joinedDate: '2020-07-15',
    status: 'active',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-20260831-001',
    studentId: 'std-101',
    studentName: 'Ahmad Faiz Al-Ghifari',
    studentNisn: '0123456781',
    classId: '1',
    className: 'Kelas 1',
    type: 'deposit',
    amount: 25000,
    previousBalance: 120000,
    currentBalance: 145000,
    date: new Date(Date.now() - 3600000 * 4).toISOString(),
    note: 'Setoran tabungan harian senin',
    officerName: 'H. SUJAI, S.Pd',
    waNotificationStatus: 'sent',
    waSentAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    syncedToSheets: true,
  },
  {
    id: 'tx-20260831-002',
    studentId: 'std-102',
    studentName: 'Siti Nur Aisyah',
    studentNisn: '0123456782',
    classId: '1',
    className: 'Kelas 1',
    type: 'deposit',
    amount: 50000,
    previousBalance: 160000,
    currentBalance: 210000,
    date: new Date(Date.now() - 3600000 * 3).toISOString(),
    note: 'Setoran mingguan',
    officerName: 'H. SUJAI, S.Pd',
    waNotificationStatus: 'sent',
    waSentAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    syncedToSheets: true,
  },
  {
    id: 'tx-20260831-003',
    studentId: 'std-201',
    studentName: 'Muhammad Rizky Pratama',
    studentNisn: '0112345683',
    classId: '2',
    className: 'Kelas 2',
    type: 'deposit',
    amount: 30000,
    previousBalance: 350000,
    currentBalance: 380000,
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    note: 'Setoran hasil jualan karya seni',
    officerName: 'H. SUJAI, S.Pd',
    waNotificationStatus: 'sent',
    waSentAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    syncedToSheets: true,
  },
  {
    id: 'tx-20260831-004',
    studentId: 'std-301',
    studentName: 'Dimas Ardiansyah',
    studentNisn: '0102345685',
    classId: '3',
    className: 'Kelas 3',
    type: 'withdraw',
    amount: 35000,
    previousBalance: 450000,
    currentBalance: 415000,
    date: new Date(Date.now() - 3600000 * 1).toISOString(),
    note: 'Penarikan untuk beli buku gambar dan krayon',
    officerName: 'H. SUJAI, S.Pd',
    waNotificationStatus: 'sent',
    waSentAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    syncedToSheets: true,
  },
  {
    id: 'tx-20260830-005',
    studentId: 'std-601',
    studentName: 'Rian Syahputra',
    studentNisn: '0072345691',
    classId: '6',
    className: 'Kelas 6',
    type: 'deposit',
    amount: 100000,
    previousBalance: 1350000,
    currentBalance: 1450000,
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    note: 'Setoran saku bulanan',
    officerName: 'H. SUJAI, S.Pd',
    waNotificationStatus: 'sent',
    waSentAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    syncedToSheets: true,
  },
];

let isSyncInitialized = false;

// Helper Storage API with Cloud Firestore Real-time synchronization
export const StorageService = {
  // Initialize Real-time synchronization with Firestore
  initRealtimeSync(onSyncStatusChange?: (status: { isConnected: boolean; lastSync: Date }) => void) {
    if (isSyncInitialized) return () => {};
    isSyncInitialized = true;

    // 1. Subscribe to real-time student updates across all devices
    const unsubStudents = FirestoreService.subscribeStudents((cloudStudents) => {
      if (cloudStudents && cloudStudents.length > 0) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(cloudStudents));
        window.dispatchEvent(new CustomEvent('sdn5_students_updated', { detail: cloudStudents }));
        if (onSyncStatusChange) {
          onSyncStatusChange({ isConnected: true, lastSync: new Date() });
        }
      } else {
        // If cloud is empty and this is the very first setup, seed initial data to cloud
        const local = this.getStudents();
        if (local && local.length > 0) {
          FirestoreService.syncLocalToCloud(
            local,
            this.getTransactions(),
            this.getSchoolProfile(),
            this.getWAConfig(),
            this.getSheetsConfig()
          ).catch((e) => console.warn('[Firestore] Auto-seed error:', e));
        }
      }
    });

    // 2. Subscribe to real-time transactions across all devices
    const unsubTxs = FirestoreService.subscribeTransactions((cloudTxs) => {
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

  getAdminPassword(): string {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD) || 'admin123';
  },

  setAdminPassword(password: string) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, password);
    FirestoreService.saveAdminPassword(password).catch((err) => {
      console.warn('[Firestore] Error saving admin password:', err);
    });
  },

  resetToDefault() {
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.SCHOOL_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.SHEETS_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.WA_CONFIG);
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
