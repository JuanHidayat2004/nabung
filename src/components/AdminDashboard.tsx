import React from 'react';
import {
  Wallet,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  FileSpreadsheet,
  Printer,
  Calendar,
  Smartphone,
  ShieldCheck,
  CalendarCheck,
  CalendarRange,
} from 'lucide-react';
import { Student, Transaction, SchoolProfile } from '../types';
import { formatRupiah, formatIndonesianDate, openWhatsAppDirect, generateTransactionWAMessage } from '../services/whatsapp';
import { StorageService } from '../services/storage';

interface AdminDashboardProps {
  students: Student[];
  transactions: Transaction[];
  school: SchoolProfile;
  onOpenNewTransaction: (studentId?: string, type?: 'deposit' | 'withdraw') => void;
  onOpenAddStudent: () => void;
  onOpenDailyReport: () => void;
  onOpenMonthlyReport: () => void;
  onOpenSheetsSync: () => void;
  onViewStudentManager: () => void;
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  students,
  transactions,
  school,
  onOpenNewTransaction,
  onOpenDailyReport,
  onOpenMonthlyReport,
  onOpenSheetsSync,
  onViewStudentManager,
  onRefresh,
}) => {
  const totalBalance = students.reduce((acc, s) => acc + s.balance, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter((t) => t.date.startsWith(todayStr));

  const todayDeposit = todayTransactions
    .filter((t) => t.type === 'deposit')
    .reduce((acc, c) => acc + c.amount, 0);

  const todayWithdraw = todayTransactions
    .filter((t) => t.type === 'withdraw')
    .reduce((acc, c) => acc + c.amount, 0);

  const recentTransactions = transactions.slice(0, 8);

  // Group balances by class
  const classBalances = [1, 2, 3, 4, 5, 6].map((clsNum) => {
    const clsId = String(clsNum);
    const clsStudents = students.filter((s) => s.classId === clsId);
    const sum = clsStudents.reduce((acc, c) => acc + c.balance, 0);
    return {
      classNum: clsNum,
      className: `Kelas ${clsNum}`,
      count: clsStudents.length,
      balance: sum,
    };
  });

  const waConfig = StorageService.getWAConfig();

  const handleResendWA = (tx: Transaction) => {
    const student = students.find((s) => s.id === tx.studentId);
    if (!student || !student.parentPhone) {
      alert('Nomor WhatsApp orang tua belum terdaftar.');
      return;
    }
    const msg = generateTransactionWAMessage(tx, student, waConfig, school);
    openWhatsAppDirect(student.parentPhone, msg);
    StorageService.updateTransactionStatus(tx.id, 'sent');
    onRefresh();
  };

  return (
    <div className="space-y-5">
      {/* Formal Header Banner */}
      <div className="bg-emerald-900 rounded-2xl p-4 sm:p-6 text-white shadow-xs border border-emerald-950/40 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-800 text-emerald-200 text-[11px] font-bold border border-emerald-700">
              Bendahara Sekolah
            </span>
            <span className="text-[11px] text-emerald-200 font-medium">{school.name} • TP 2026/2027</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-white mt-1.5 tracking-tight">
            Ringkasan Keuangan Tabungan Siswa
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl">
            Pencatatan kas tabungan resmi sekolah dengan notifikasi instan WhatsApp ke wali murid dan laporan PDF/Excel.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onOpenNewTransaction()}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <PlusCircle className="w-4 h-4 text-emerald-950" />
            <span>+ Transaksi Baru</span>
          </button>

          <button
            onClick={onOpenDailyReport}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-emerald-800/80 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-emerald-700 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-200" />
            <span>Laporan Harian</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Saldo Keseluruhan */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Kas Tabungan Siswa</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
              {formatRupiah(totalBalance)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Total dana seluruh kelas 1–6</span>
            </div>
          </div>
        </div>

        {/* Total Siswa */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Siswa Penabung</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center border border-blue-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
              {students.length} Siswa
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Terdaftar di kelas 1 sampai kelas 6
            </div>
          </div>
        </div>

        {/* Setoran Hari Ini */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Setoran Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold text-emerald-800 tracking-tight tabular-nums">
              + {formatRupiah(todayDeposit)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {todayTransactions.filter((t) => t.type === 'deposit').length} transaksi masuk
            </div>
          </div>
        </div>

        {/* Penarikan Hari Ini */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Penarikan Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-800 flex items-center justify-center border border-rose-100">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold text-rose-800 tracking-tight tabular-nums">
              - {formatRupiah(todayWithdraw)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {todayTransactions.filter((t) => t.type === 'withdraw').length} transaksi keluar
            </div>
          </div>
        </div>
      </div>

      {/* Class Balance Distribution & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Mutasi Transaksi Terkini</h3>
              <p className="text-xs text-slate-500">Aktivitas penyetoran dan penarikan kas tabungan</p>
            </div>
            <button
              onClick={onOpenDailyReport}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer"
            >
              Laporan Lengkap →
            </button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Waktu</th>
                  <th className="py-2.5 px-4">Nama Siswa</th>
                  <th className="py-2.5 px-4">Kelas</th>
                  <th className="py-2.5 px-4">Jenis</th>
                  <th className="py-2.5 px-4 text-right">Nominal</th>
                  <th className="py-2.5 px-4 text-right">Saldo Akhir</th>
                  <th className="py-2.5 px-4 text-center">WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Belum ada transaksi tabungan yang tercatat.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-slate-500 text-[11px] whitespace-nowrap">
                        {formatIndonesianDate(tx.date, false)}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{tx.studentName}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-700">{tx.className}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.type === 'deposit'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {tx.type === 'deposit' ? 'SETOR' : 'TARIK'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold tabular-nums">
                        <span className={tx.type === 'deposit' ? 'text-emerald-800' : 'text-rose-800'}>
                          {tx.type === 'deposit' ? '+' : '-'} {formatRupiah(tx.amount)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                        {formatRupiah(tx.currentBalance)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => handleResendWA(tx)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                            tx.waNotificationStatus === 'sent'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                          title="Klik untuk kirim notifikasi WhatsApp"
                        >
                          <Smartphone className="w-3 h-3 text-emerald-700" />
                          <span>{tx.waNotificationStatus === 'sent' ? 'Terkirim' : 'Kirim WA'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="sm:hidden divide-y divide-slate-100">
            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada transaksi tabungan yang tercatat.
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="p-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900 text-xs">
                      {tx.studentName}
                      <span className="ml-1.5 font-normal text-slate-500 text-[11px]">({tx.className})</span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        tx.type === 'deposit'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {tx.type === 'deposit' ? 'SETOR' : 'TARIK'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">{formatIndonesianDate(tx.date, false)}</span>
                    <span className={`font-bold tabular-nums ${tx.type === 'deposit' ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {tx.type === 'deposit' ? '+' : '-'} {formatRupiah(tx.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-500">Saldo: <strong className="text-slate-900 font-bold tabular-nums">{formatRupiah(tx.currentBalance)}</strong></span>
                    <button
                      onClick={() => handleResendWA(tx)}
                      className="flex items-center gap-1 text-emerald-800 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                    >
                      <Smartphone className="w-3 h-3 text-emerald-700" />
                      <span>{tx.waNotificationStatus === 'sent' ? 'WA Terkirim' : 'Kirim WA'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Class Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Saldo Kas Per Kelas</h3>
              <button
                onClick={onViewStudentManager}
                className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
              >
                Kelola Siswa →
              </button>
            </div>

            <div className="space-y-3">
              {classBalances.map((cls) => {
                const pct = totalBalance > 0 ? Math.round((cls.balance / totalBalance) * 100) : 0;
                return (
                  <div key={cls.classNum} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700">{cls.className} ({cls.count} siswa)</span>
                      <span className="font-bold text-slate-900 tabular-nums">{formatRupiah(cls.balance)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-800 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={onOpenMonthlyReport}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-emerald-200"
            >
              <CalendarRange className="w-3.5 h-3.5 text-emerald-800" />
              <span>Buka Rekapitulasi Bulanan Siswa</span>
            </button>
            <button
              onClick={onOpenSheetsSync}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-800" />
              <span>Status Sinkron Google Sheets</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
