import React, { useState } from 'react';
import {
  Lock,
  User,
  ShieldCheck,
  Users,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  School,
  Eye,
  EyeOff,
  Cloud,
  Smartphone,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';
import { AuthState, SchoolProfile } from '../types';
import { StorageService } from '../services/storage';

interface LoginScreenProps {
  school: SchoolProfile;
  onLoginSuccess: (auth: AuthState) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ school, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'parent'>('admin');

  // Admin form state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Parent form state
  const [parentIdentifier, setParentIdentifier] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [showParentPassword, setShowParentPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const savedPassword = StorageService.getAdminPassword();
    const savedUsername = StorageService.getAdminUsername();

    if (
      adminUsername.trim().toLowerCase() === savedUsername.toLowerCase() &&
      adminPassword === savedPassword
    ) {
      setSuccessMsg('Login Admin Berhasil! Mengalihkan ke dashboard kas...');
      setTimeout(() => {
        onLoginSuccess({
          isAuthenticated: true,
          role: 'admin',
          adminUsername: savedUsername,
          name: 'Bendahara Sekolah',
        });
      }, 350);
    } else {
      setErrorMsg('Username atau Password Admin salah. Silakan periksa kembali.');
    }
  };

  const handleParentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!parentIdentifier.trim()) {
      setErrorMsg('Silakan masukkan Nama Siswa atau NISN anak');
      return;
    }

    const student = StorageService.findStudentByLogin(parentIdentifier);
    if (!student) {
      setErrorMsg('Data siswa dengan nama/NISN tersebut tidak ditemukan. Periksa kembali ejaan atau nomor NISN.');
      return;
    }

    // Secure authentication: custom student password or student's NISN
    const expectedPassword = student.password || student.nisn;
    if (parentPassword !== expectedPassword) {
      setErrorMsg(`Password salah untuk akun ananda ${student.name}. Hubungi bendahara sekolah jika lupa password.`);
      return;
    }

    setSuccessMsg(`Login Berhasil! Membuka buku tabungan ananda ${student.name}...`);
    setTimeout(() => {
      onLoginSuccess({
        isAuthenticated: true,
        role: 'parent',
        studentId: student.id,
        student: student,
        name: student.parentName,
      });
    }, 350);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-8 flex flex-col items-center">
      {/* School Header Identity */}
      <div className="text-center mb-6 sm:mb-8 max-w-2xl px-4">
        {/* Logo and Tagline Row */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-800 text-white shadow-md border border-emerald-700 shrink-0">
            <School className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-100" />
          </div>

          <div className="inline-flex items-center px-3.5 py-1.5 bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold rounded-full border border-emerald-200 shadow-xs">
            Sistem Informasi Tabungan Siswa Digital
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {school.name}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          {school.address}, {school.district}, {school.regency}
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Card Header with Role Selector */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-5 text-white">
          <div className="flex items-center gap-2 mb-3 text-emerald-100">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-semibold tracking-wide uppercase">Masuk ke Sistem Tabungan</span>
          </div>

          <div className="grid grid-cols-2 bg-emerald-950/50 p-1 rounded-xl border border-emerald-700/50">
            <button
              type="button"
              id="tab-login-admin"
              onClick={() => {
                setActiveTab('admin');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-emerald-100 hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Admin / Guru</span>
            </button>

            <button
              type="button"
              id="tab-login-parent"
              onClick={() => {
                setActiveTab('parent');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'parent'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-emerald-100 hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-700" />
              <span>Wali Murid</span>
            </button>
          </div>
        </div>

        {/* Card Body / Forms */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'admin' ? (
            /* ADMIN LOGIN FORM */
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Username Admin / Bendahara
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="input-admin-username"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                    placeholder="Masukkan username admin"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Password Admin</label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    id="input-admin-password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    placeholder="Masukkan password admin"
                    className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Tampilkan / Sembunyikan Password"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  id="btn-submit-admin-login"
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Masuk Sebagai Admin</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>

              <div className="mt-2 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Akses aman khusus bendahara & pengelola kas sekolah</span>
              </div>
            </form>
          ) : (
            /* PARENT / WALI MURID LOGIN FORM */
            <form onSubmit={handleParentLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Lengkap Siswa atau NISN
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="input-parent-identifier"
                    value={parentIdentifier}
                    onChange={(e) => setParentIdentifier(e.target.value)}
                    required
                    placeholder="Masukkan nama lengkap siswa atau NISN"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password Akun Siswa
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showParentPassword ? 'text' : 'password'}
                    id="input-parent-password"
                    value={parentPassword}
                    onChange={(e) => setParentPassword(e.target.value)}
                    required
                    placeholder="Masukkan password akun siswa"
                    className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowParentPassword(!showParentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Tampilkan / Sembunyikan Password"
                  >
                    {showParentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  id="btn-submit-parent-login"
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Lihat Tabungan Siswa</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>

              <div className="mt-2 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Portal resmi buku tabungan digital SDN 5 Jurit Baru</span>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Feature Highlights beneath login */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mt-8 px-4 text-center">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col items-center">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1.5">
            <Cloud className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-800">Cloud Real-time</span>
          <span className="text-[11px] text-slate-500 mt-0.5">Sinkron otomatis antar perangkat HP & PC</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col items-center">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1.5">
            <Smartphone className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-800">Notifikasi WA</span>
          <span className="text-[11px] text-slate-500 mt-0.5">Kirim bukti setoran instan ke wali murid</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col items-center">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1.5">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-800">Rekap PDF & Excel</span>
          <span className="text-[11px] text-slate-500 mt-0.5">Laporan harian, bulanan, dan sync Sheets</span>
        </div>
      </div>
    </div>
  );
};
