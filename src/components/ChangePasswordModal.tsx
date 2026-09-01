import React, { useState } from 'react';
import { KeyRound, X, CheckCircle2, AlertCircle, ShieldCheck, Lock } from 'lucide-react';
import { AuthState } from '../types';
import { StorageService } from '../services/storage';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  auth: AuthState;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  auth,
  onSuccess,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 4) {
      setErrorMsg('Password baru minimal 4 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password baru tidak cocok.');
      return;
    }

    if (auth.role === 'admin') {
      const currentSaved = StorageService.getAdminPassword();
      if (oldPassword !== currentSaved) {
        setErrorMsg('Password lama Admin salah.');
        return;
      }
      StorageService.setAdminPassword(newPassword);
      setSuccessMsg('Password Admin berhasil diubah!');
    } else if (auth.role === 'parent' && auth.student) {
      const student = StorageService.getStudentById(auth.student.id);
      if (!student) {
        setErrorMsg('Data siswa tidak ditemukan.');
        return;
      }
      const currentSaved = student.password || '123456';
      if (oldPassword !== currentSaved) {
        setErrorMsg('Password lama salah. Silakan periksa kembali.');
        return;
      }
      student.password = newPassword;
      StorageService.updateStudent(student);
      setSuccessMsg('Password akun wali murid berhasil diubah!');
    }

    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base">
              Ganti Password {auth.role === 'admin' ? 'Admin Bendahara' : 'Wali Murid'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {auth.role === 'parent' && auth.student && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
              Akun Siswa: <strong>{auth.student.name}</strong> ({auth.student.className})
              <br />
              <span className="text-[11px] text-emerald-700">NISN: {auth.student.nisn}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password Saat Ini</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              placeholder="Masukkan password saat ini"
              className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password Baru</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Masukkan password baru"
              className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Konfirmasi Password Baru</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Ulangi password baru"
              className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
            >
              Simpan Password Baru
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
