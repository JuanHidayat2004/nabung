import React, { useEffect, useState } from 'react';
import {
  Landmark,
  Wifi,
  WifiOff,
  FileSpreadsheet,
  Lock,
  LogOut,
  User,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  KeyRound,
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarRange,
  Cloud,
} from 'lucide-react';
import { AuthState, GoogleSheetsConfig, SchoolProfile } from '../types';
import { StorageService } from '../services/storage';

interface NavbarProps {
  auth: AuthState;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenChangePassword: () => void;
  onOpenWASettings: () => void;
  onOpenSheetsSync: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  school: SchoolProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  auth,
  onLogout,
  onOpenAuth,
  onOpenChangePassword,
  onOpenWASettings,
  onOpenSheetsSync,
  activeTab,
  setActiveTab,
  school,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(StorageService.getSheetsConfig());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleSheetsUpdate = (e: CustomEvent<GoogleSheetsConfig>) => {
      setSheetsConfig(e.detail);
    };
    window.addEventListener('sdn5_sheets_updated' as unknown as keyof WindowEventMap, handleSheetsUpdate as EventListener);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sdn5_sheets_updated' as unknown as keyof WindowEventMap, handleSheetsUpdate as EventListener);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Formal Banner */}
      <div className="bg-emerald-900 text-emerald-100 px-3 sm:px-6 py-1 text-[11px] sm:text-xs flex justify-between items-center gap-2 border-b border-emerald-950/40">
        <div className="flex items-center gap-2 font-medium tracking-wide truncate">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
          <span className="truncate">Sistem Informasi Tabungan Siswa — {school.district}, {school.regency}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[10px] sm:text-[11px]">
          {/* Cloud Database Status */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium bg-emerald-800/90 text-emerald-100 border border-emerald-700/50"
            title="Database Cloud Firebase Aktif & Tersinkronisasi Otomatis Antar Semua Perangkat"
          >
            <Cloud className="w-3 h-3 text-emerald-300 animate-pulse" />
            <span className="hidden xs:inline sm:inline">Cloud Real-time</span>
          </div>

          {/* Offline / Online Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium ${
              isOnline ? 'bg-emerald-800 text-emerald-200' : 'bg-amber-600 text-amber-100'
            }`}
            title={isOnline ? 'Terhubung ke Jaringan Internet' : 'Mode Offline Aktif'}
          >
            {isOnline ? <Wifi className="w-3 h-3 text-emerald-300" /> : <WifiOff className="w-3 h-3 text-amber-200" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Sheets Status Indicator */}
          {sheetsConfig.spreadsheetUrl ? (
            <a
              href={sheetsConfig.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors bg-emerald-800/80 px-2 py-0.5 rounded"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-300" />
              <span className="hidden sm:inline">Sheets Terhubung</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-75" />
            </a>
          ) : (
            <button
              onClick={onOpenSheetsSync}
              className="flex items-center gap-1 text-emerald-200 hover:text-white transition-colors underline cursor-pointer"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>Google Sheets</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-16">
          {/* Logo & School Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-xs border border-emerald-700 shrink-0">
              <Landmark className="w-5 h-5 text-emerald-100" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 text-sm sm:text-base md:text-lg leading-tight tracking-tight truncate">
                  {school.name}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-md border border-amber-200">
                  BETA
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate hidden sm:block">
                Kecamatan Pringgasela • Kabupaten Lombok Timur
              </p>
            </div>
          </div>

          {/* Desktop Nav Tabs for Admin */}
          {auth.isAuthenticated && auth.role === 'admin' && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Ringkasan Kas</span>
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'students'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Data Siswa</span>
              </button>
              <button
                onClick={() => setActiveTab('daily-report')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'daily-report'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Laporan Harian</span>
              </button>
              <button
                onClick={() => setActiveTab('monthly-report')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'monthly-report'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Rekap Bulanan</span>
              </button>
            </nav>
          )}

          {/* Right Action Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {auth.isAuthenticated ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* WhatsApp Format Button */}
                {auth.role === 'admin' && (
                  <button
                    onClick={onOpenWASettings}
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                    title="Pengaturan Format Pesan WhatsApp"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Format WA</span>
                  </button>
                )}

                {/* Profile Badge */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="text-right hidden md:block">
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {auth.role === 'admin' ? 'H. SUJAI, S.Pd' : auth.student?.name || 'Wali Murid'}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1 font-medium">
                      {auth.role === 'admin' ? (
                        <>
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                          <span>Bendahara Sekolah</span>
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 text-emerald-700" />
                          <span>{auth.student?.className} • NISN: {auth.student?.nisn}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Change Password Button */}
                  <button
                    onClick={onOpenChangePassword}
                    className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                    title="Ganti Password Akun"
                    aria-label="Ganti Password"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Keluar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Masuk Akun</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Tab Navigation with responsive horizontal scroll & clear active indicators */}
        {auth.isAuthenticated && auth.role === 'admin' && (
          <div className="md:hidden flex items-center gap-1.5 py-2 border-t border-slate-100 overflow-x-auto no-scrollbar text-xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Ringkasan Kas</span>
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'students'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Data Siswa</span>
            </button>
            <button
              onClick={() => setActiveTab('daily-report')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'daily-report'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Laporan Harian</span>
            </button>
            <button
              onClick={() => setActiveTab('monthly-report')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'monthly-report'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Rekap Bulanan</span>
            </button>
            <button
              onClick={onOpenWASettings}
              className="px-3 py-1.5 rounded-lg font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
              <span>Format WA</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
