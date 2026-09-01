export type TransactionType = 'deposit' | 'withdraw';

export interface SavingGoal {
  target: number;
  label: string;
  active: boolean;
}

export interface Student {
  id: string;
  nisn: string;
  nis: string;
  name: string;
  gender: 'L' | 'P';
  classId: string;
  className: string;
  parentName: string;
  parentPhone: string;
  password: string;
  balance: number;
  savingGoal?: SavingGoal;
  address?: string;
  joinedDate: string;
  status: 'active' | 'graduated' | 'inactive';
}

export interface Transaction {
  id: string;
  studentId: string;
  studentName: string;
  studentNisn: string;
  classId: string;
  className: string;
  type: TransactionType;
  amount: number;
  previousBalance: number;
  currentBalance: number;
  date: string; // ISO String
  note: string;
  officerName: string;
  waNotificationStatus: 'sent' | 'pending' | 'not_sent';
  waSentAt?: string;
  syncedToSheets: boolean;
}

export interface SchoolProfile {
  name: string;
  subTitle: string;
  npsn: string;
  address: string;
  district: string; // Kecamatan
  regency: string; // Kabupaten Lombok Timur
  province: string; // NTB
  headmaster: string;
  headmasterNip: string;
  treasurer: string;
  treasurerNip: string;
  phone: string;
  email: string;
}

export type UserRole = 'admin' | 'parent';

export interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  adminUsername?: string;
  studentId?: string;
  student?: Student;
}

export interface GoogleSheetsConfig {
  connected: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetNameTransactions: string;
  sheetNameStudents: string;
  lastSyncedAt: string | null;
  autoSync: boolean;
  accessToken: string | null;
  tokenExpiresAt?: number;
  webhookUrl?: string;
  syncMode?: 'oauth' | 'webhook' | 'manual';
}

export interface WhatsAppConfig {
  autoOpenOnTransaction: boolean;
  customTemplate: string;
  senderSignature: string;
  includeSchoolContact: boolean;
  defaultCountryCode: string;
}

export interface DailySummary {
  date: string;
  totalDeposit: number;
  totalWithdraw: number;
  netChange: number;
  transactionCount: number;
  transactions: Transaction[];
}

export interface MonthlyClassSummary {
  classId: string;
  className: string;
  studentCount: number;
  totalDeposit: number;
  totalWithdraw: number;
  totalEndingBalance: number;
  students: {
    student: Student;
    depositMonth: number;
    withdrawMonth: number;
    endingBalance: number;
    transactionCount: number;
  }[];
}
