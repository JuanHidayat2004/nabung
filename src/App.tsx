import React, { useState, useEffect } from 'react';
import {
  Landmark,
  ShieldCheck,
  Users,
  Wallet,
  Calendar,
  FileSpreadsheet,
  Printer,
  Smartphone,
  PlusCircle,
  Lock,
  Sparkles,
  School,
  ExternalLink,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  UserCheck,
} from 'lucide-react';
import { AuthState, Student, Transaction, SchoolProfile } from './types';
import { StorageService, DEFAULT_SCHOOL_PROFILE } from './services/storage';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentManager } from './components/StudentManager';
import { DailyReport } from './components/DailyReport';
import { MonthlyReport } from './components/MonthlyReport';
import { ParentPortal } from './components/ParentPortal';
import { TransactionModal } from './components/TransactionModal';
import { GoogleSheetsSync } from './components/GoogleSheetsSync';
import { WhatsAppSettingsModal } from './components/WhatsAppSettingsModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { formatRupiah } from './services/whatsapp';

export default function App() {
  // Authentication State
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: true,
    role: 'admin',
    adminUsername: 'Bendahara SDN 5 Jurit Baru',
    name: 'Bendahara Sekolah',
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Application Data
  const [students, setStudents] = useState<Student[]>(StorageService.getStudents());
  const [transactions, setTransactions] = useState<Transaction[]>(StorageService.getTransactions());
  const [school, setSchool] = useState<SchoolProfile>(StorageService.getSchoolProfile());

  // Modal States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txInitialStudentId, setTxInitialStudentId] = useState<string | undefined>(undefined);
  const [txInitialType, setTxInitialType] = useState<'deposit' | 'withdraw'>('deposit');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isWASettingsOpen, setIsWASettingsOpen] = useState(false);
  const [isSheetsSyncOpen, setIsSheetsSyncOpen] = useState(false);

  // Sync state listeners
  const refreshData = () => {
    setStudents(StorageService.getStudents());
    setTransactions(StorageService.getTransactions());
    setSchool(StorageService.getSchoolProfile());

    // If logged in as parent, refresh student object
    if (auth.role === 'parent' && auth.studentId) {
      const refreshedStudent = StorageService.getStudentById(auth.studentId);
      if (refreshedStudent) {
        setAuth((prev) => ({ ...prev, student: refreshedStudent }));
      }
    }
  };

  useEffect(() => {
    // 1. Initialize Real-Time Cloud Firestore Sync
    const cleanupSync = StorageService.initRealtimeSync();

    // 2. Listen to custom window events triggered by Firestore snapshots
    const handleStudentsUpdate = (e: CustomEvent<Student[]>) => {
      setStudents(e.detail);
      if (auth.role === 'parent' && auth.studentId) {
        const refreshed = e.detail.find((s) => s.id === auth.studentId);
        if (refreshed) {
          setAuth((prev) => ({ ...prev, student: refreshed }));
        }
      }
    };

    const handleTxUpdate = (e: CustomEvent<Transaction[]>) => {
      setTransactions(e.detail);
    };

    const handleSchoolUpdate = (e: CustomEvent<SchoolProfile>) => {
      setSchool(e.detail);
    };

    window.addEventListener('sdn5_students_updated' as unknown as keyof WindowEventMap, handleStudentsUpdate as EventListener);
    window.addEventListener('sdn5_transactions_updated' as unknown as keyof WindowEventMap, handleTxUpdate as EventListener);
    window.addEventListener('sdn5_school_updated' as unknown as keyof WindowEventMap, handleSchoolUpdate as EventListener);

    return () => {
      if (cleanupSync) cleanupSync();
      window.removeEventListener('sdn5_students_updated' as unknown as keyof WindowEventMap, handleStudentsUpdate as EventListener);
      window.removeEventListener('sdn5_transactions_updated' as unknown as keyof WindowEventMap, handleTxUpdate as EventListener);
      window.removeEventListener('sdn5_school_updated' as unknown as keyof WindowEventMap, handleSchoolUpdate as EventListener);
    };
  }, [auth.role, auth.studentId]);

  const handleLoginSuccess = (newAuth: AuthState) => {
    setAuth(newAuth);
    if (newAuth.role === 'parent') {
      setActiveTab('parent-portal');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setAuth({
      isAuthenticated: false,
      role: null,
    });
  };

  const handleOpenNewTransaction = (studentId?: string, type: 'deposit' | 'withdraw' = 'deposit') => {
    setTxInitialStudentId(studentId);
    setTxInitialType(type);
    setIsTxModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950">
      {/* Navbar Header */}
      <Navbar
        auth={auth}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenWASettings={() => setIsWASettingsOpen(true)}
        onOpenSheetsSync={() => setIsSheetsSyncOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        school={school}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!auth.isAuthenticated ? (
          /* GUEST / WELCOME SCREEN */
          <div className="max-w-3xl mx-auto py-8 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-800 rounded-3xl flex items-center justify-center mx-auto shadow-md">
              <School className="w-10 h-10" />
            </div>

            <div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                Sistem Informasi Kas Tabungan Digital
              </span>
              <h2 className="text-3xl font-black text-slate-900 mt-3 tracking-tight">
                {school.name}
              </h2>
              <p className="text-slate-600 text-sm max-w-lg mx-auto mt-2">
                Pencatatan tabungan transparan untuk wali murid, terintegrasi WhatsApp & Google Sheets otomatis.
              </p>
            </div>

            {/* Login Role Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left pt-2">
              <div
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-white p-6 rounded-2xl border-2 border-emerald-600 shadow-md hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Login Admin / Bendahara</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pencatatan setor/tarik cepat, manajemen siswa, cetak rekap harian & bulanan, dan sync Sheets.
                </p>
                <div className="mt-4 text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <span>Masuk Sebagai Admin</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Login Orang Tua / Wali</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Cek saldo tabungan ananda, mutasi setoran, target tabungan, dan unduh buku tabungan PDF.
                </p>
                <div className="mt-4 text-xs font-bold text-blue-700 flex items-center gap-1">
                  <span>Masuk Sebagai Wali Murid</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        ) : auth.role === 'parent' && auth.student ? (
          /* PARENT / WALI MURID PORTAL */
          <ParentPortal
            student={auth.student}
            transactions={transactions}
            school={school}
            onOpenChangePassword={() => setIsChangePasswordOpen(true)}
            onRefresh={refreshData}
          />
        ) : (
          /* ADMIN PORTAL */
          <>
            {activeTab === 'dashboard' && (
              <AdminDashboard
                students={students}
                transactions={transactions}
                school={school}
                onOpenNewTransaction={handleOpenNewTransaction}
                onOpenAddStudent={() => setActiveTab('students')}
                onOpenDailyReport={() => setActiveTab('daily-report')}
                onOpenMonthlyReport={() => setActiveTab('monthly-report')}
                onOpenSheetsSync={() => setIsSheetsSyncOpen(true)}
                onViewStudentManager={() => setActiveTab('students')}
                onRefresh={refreshData}
              />
            )}

            {activeTab === 'students' && (
              <StudentManager
                students={students}
                onRefresh={refreshData}
                onQuickTransaction={(studentId, type) => handleOpenNewTransaction(studentId, type)}
                school={school}
              />
            )}

            {activeTab === 'daily-report' && (
              <DailyReport
                transactions={transactions}
                students={students}
                school={school}
                onRefresh={refreshData}
              />
            )}

            {activeTab === 'monthly-report' && (
              <MonthlyReport
                students={students}
                transactions={transactions}
                school={school}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-800 text-white flex items-center justify-center font-bold text-[10px]">
              5
            </div>
            <span className="font-semibold text-slate-800">{school.name}</span>
            <span>• {school.address}, {school.district}, {school.regency}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Kepala Sekolah: <strong>{school.headmaster}</strong></span>
            <span>•</span>
            <span>Bendahara: <strong>{school.treasurer}</strong></span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        initialStudentId={txInitialStudentId}
        initialType={txInitialType}
        onTransactionComplete={() => refreshData()}
        school={school}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        auth={auth}
        onSuccess={() => refreshData()}
      />

      <WhatsAppSettingsModal
        isOpen={isWASettingsOpen}
        onClose={() => setIsWASettingsOpen(false)}
        school={school}
      />

      <GoogleSheetsSync
        isOpen={isSheetsSyncOpen}
        onClose={() => setIsSheetsSyncOpen(false)}
        students={students}
        transactions={transactions}
        onRefresh={refreshData}
      />
    </div>
  );
}
