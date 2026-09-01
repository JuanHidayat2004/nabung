import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  Download,
  KeyRound,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
  Receipt,
  User,
  GraduationCap,
  Lock,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { Student, Transaction, SchoolProfile } from '../types';
import { StorageService } from '../services/storage';
import { formatRupiah, formatIndonesianDate, openWhatsAppDirect } from '../services/whatsapp';
import { ReportService } from '../services/reports';

interface ParentPortalProps {
  student: Student;
  transactions: Transaction[];
  school: SchoolProfile;
  onOpenChangePassword: () => void;
  onRefresh: () => void;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({
  student,
  transactions,
  school,
  onOpenChangePassword,
  onRefresh,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdraw'>('all');

  const studentTx = transactions
    .filter((t) => t.studentId === student.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTx = studentTx.filter((t) => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  const totalDeposit = studentTx
    .filter((t) => t.type === 'deposit')
    .reduce((acc, c) => acc + c.amount, 0);

  const totalWithdraw = studentTx
    .filter((t) => t.type === 'withdraw')
    .reduce((acc, c) => acc + c.amount, 0);

  const targetPct =
    student.savingGoal?.active && student.savingGoal.target > 0
      ? Math.min(100, Math.round((student.balance / student.savingGoal.target) * 100))
      : 0;

  const handlePrintPassbook = () => {
    ReportService.generateStudentPassbookPDF(student, transactions, school);
  };

  const handlePrintReceipt = (tx: Transaction) => {
    ReportService.generateReceiptPDF(tx, student, school);
  };

  const handleContactTreasurer = () => {
    const msg = `Halo Bapak/Ibu ${school.treasurer} (Bendahara ${school.name}), saya orang tua/wali dari ananda *${student.name}* (Kelas ${student.className}, NISN: ${student.nisn}). Saya ingin menanyakan informasi perihal tabungan sekolah ananda. Terima kasih.`;
    openWhatsAppDirect(school.phone, msg);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Welcome Banner Card */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle Decorative Background circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-400/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-white shadow-inner">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                  {student.className}
                </span>
                <span className="text-xs text-emerald-200 font-mono">NISN: {student.nisn}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
                {student.name}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
                Wali Murid: <span className="font-semibold text-white">{student.parentName}</span>
                {student.parentPhone && ` • WA: ${student.parentPhone}`}
              </p>
            </div>
          </div>

          {/* Quick Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePrintPassbook}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-bold rounded-xl text-xs flex items-center gap-2 border border-white/20 transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-emerald-300" />
              <span>Cetak Buku Tabungan (PDF)</span>
            </button>

            <button
              onClick={onOpenChangePassword}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-amber-300" />
              <span>Ganti Password</span>
            </button>
          </div>
        </div>

        {/* Balance Showcase */}
        <div className="mt-8 pt-6 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-emerald-200/90 font-medium">SALDO TABUNGAN SAAT INI</div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-0.5 tracking-tight text-emerald-300">
              {formatRupiah(student.balance)}
            </div>
            <div className="text-[11px] text-emerald-200 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tercatat Resmi di Kas {school.name}</span>
            </div>
          </div>

          <div className="sm:border-l sm:border-white/15 sm:pl-4">
            <div className="text-xs text-emerald-200/90 font-medium">TOTAL AKUMULASI SETORAN</div>
            <div className="text-lg sm:text-xl font-bold text-white mt-1">
              + {formatRupiah(totalDeposit)}
            </div>
            <div className="text-[11px] text-emerald-200 mt-1">
              {studentTx.filter((t) => t.type === 'deposit').length} kali menabung
            </div>
          </div>

          <div className="sm:border-l sm:border-white/15 sm:pl-4">
            <div className="text-xs text-emerald-200/90 font-medium">TOTAL PENARIKAN</div>
            <div className="text-lg sm:text-xl font-bold text-white mt-1">
              - {formatRupiah(totalWithdraw)}
            </div>
            <div className="text-[11px] text-emerald-200 mt-1">
              {studentTx.filter((t) => t.type === 'withdraw').length} kali penarikan keperluan
            </div>
          </div>
        </div>
      </div>

      {/* Target Tabungan Card (If configured) */}
      {student.savingGoal?.active && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Target Impian: {student.savingGoal.label}
                </h3>
                <p className="text-xs text-slate-500">
                  Target Nominal: <strong className="text-slate-800">{formatRupiah(student.savingGoal.target)}</strong>
                </p>
              </div>
            </div>
            <span className="text-base font-extrabold text-emerald-700">{targetPct}% Tercapai</span>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-700 shadow-xs"
                style={{ width: `${targetPct}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
              <span>Tersimpan: {formatRupiah(student.balance)}</span>
              <span>
                {student.balance >= student.savingGoal.target
                  ? '🎉 Target telah tercapai!'
                  : `Kurang ${formatRupiah(Math.max(0, student.savingGoal.target - student.balance))} lagi`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>Riwayat Lengkap Mutasi Tabungan Siswa</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparansi setiap transaksi setoran dan penarikan kas ananda
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === 'all' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({studentTx.length})
            </button>
            <button
              onClick={() => setFilterType('deposit')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === 'deposit' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Setor
            </button>
            <button
              onClick={() => setFilterType('withdraw')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === 'withdraw' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tarik
            </button>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tanggal & Jam</th>
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-right">Saldo Sesudahnya</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4">Petugas</th>
                <th className="py-3 px-4 text-center">Bukti Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Belum ada riwayat transaksi tabungan untuk kategori ini.
                  </td>
                </tr>
              ) : (
                filteredTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {formatIndonesianDate(tx.date, false)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Pukul {new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          tx.type === 'deposit'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {tx.type === 'deposit' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        <span>{tx.type === 'deposit' ? 'SETOR' : 'TARIK'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-sm">
                      <span className={tx.type === 'deposit' ? 'text-emerald-700' : 'text-rose-700'}>
                        {tx.type === 'deposit' ? '+' : '-'} {formatRupiah(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 text-emerald-950">
                      {formatRupiah(tx.currentBalance)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{tx.note || '-'}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{tx.officerName.split(',')[0]}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handlePrintReceipt(tx)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="Unduh Bukti Kuitansi Struk"
                      >
                        <Receipt className="w-3 h-3 text-emerald-700" />
                        <span>Struk</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Support & Contact Footer Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Ada Pertanyaan Mengenai Saldo Tabungan?</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Hubungi Bendahara Kas Tabungan {school.name} ({school.treasurer})
          </p>
        </div>
        <button
          onClick={handleContactTreasurer}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors shrink-0 shadow-xs cursor-pointer"
        >
          <Smartphone className="w-4 h-4" />
          <span>Hubungi Bendahara via WhatsApp</span>
        </button>
      </div>
    </div>
  );
};
