import React, { useState } from 'react';
import {
  Calendar,
  Printer,
  Download,
  Filter,
  FileSpreadsheet,
  FileText,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { Transaction, Student, SchoolProfile } from '../types';
import { StorageService } from '../services/storage';
import {
  formatRupiah,
  formatIndonesianDate,
  openWhatsAppDirect,
  generateTransactionWAMessage,
} from '../services/whatsapp';
import { ReportService } from '../services/reports';

interface DailyReportProps {
  transactions: Transaction[];
  students: Student[];
  school: SchoolProfile;
  onRefresh: () => void;
}

export const DailyReport: React.FC<DailyReportProps> = ({
  transactions,
  students,
  school,
  onRefresh,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const waConfig = StorageService.getWAConfig();

  // Filter transactions
  const dailyTransactions = transactions.filter((t) => {
    const txDate = t.date.split('T')[0];
    const matchDate = txDate === selectedDate;
    const matchClass = selectedClass === 'all' || t.classId === selectedClass || t.className === selectedClass;
    return matchDate && matchClass;
  });

  const totalDeposit = dailyTransactions
    .filter((t) => t.type === 'deposit')
    .reduce((acc, c) => acc + c.amount, 0);

  const totalWithdraw = dailyTransactions
    .filter((t) => t.type === 'withdraw')
    .reduce((acc, c) => acc + c.amount, 0);

  const netCashflow = totalDeposit - totalWithdraw;

  const handlePrintDailyPDF = () => {
    const classFilterLabel = selectedClass === 'all' ? 'Semua Kelas' : `Kelas ${selectedClass}`;
    ReportService.generateDailyReportPDF(selectedDate, dailyTransactions, school, classFilterLabel);
  };

  const handleExportDailyExcel = () => {
    ReportService.generateDailyReportExcel(selectedDate, dailyTransactions, school);
  };

  const handleResendWA = (tx: Transaction) => {
    const student = students.find((s) => s.id === tx.studentId);
    if (!student || !student.parentPhone) {
      alert('Nomor WhatsApp orang tua tidak ditemukan.');
      return;
    }
    const msg = generateTransactionWAMessage(tx, student, waConfig, school);
    openWhatsAppDirect(student.parentPhone, msg);
    StorageService.updateTransactionStatus(tx.id, 'sent');
    onRefresh();
  };

  const handlePrintReceipt = (tx: Transaction) => {
    const student = students.find((s) => s.id === tx.studentId);
    if (student) {
      ReportService.generateReceiptPDF(tx, student, school);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner & Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">
              Laporan Rekapitulasi Kas Saldo Harian
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dicetak resmi untuk keperluan rekapitulasi data kas sekolah SDN 5 JURIT BARU
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Print PDF Button */}
          <button
            onClick={handlePrintDailyPDF}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF Resmi Kop Surat</span>
          </button>

          {/* Export Excel Button */}
          <button
            onClick={handleExportDailyExcel}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Unduh Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Date & Filter Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700">Pilih Tanggal:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700">Filter Kelas:</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            >
              <option value="all">Semua Kelas</option>
              <option value="1">Kelas 1</option>
              <option value="2">Kelas 2</option>
              <option value="3">Kelas 3</option>
              <option value="4">Kelas 4</option>
              <option value="5">Kelas 5</option>
              <option value="6">Kelas 6</option>
            </select>
          </div>
        </div>

        <div className="text-slate-500 font-medium">
          Periode: <strong className="text-slate-900">{formatIndonesianDate(selectedDate, false)}</strong>
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Setoran */}
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
            <span>Total Setoran Masuk</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-200/60 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-emerald-950 mt-1">
            + {formatRupiah(totalDeposit)}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">
            {dailyTransactions.filter((t) => t.type === 'deposit').length} transaksi setoran
          </div>
        </div>

        {/* Total Penarikan */}
        <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between text-rose-800 text-xs font-semibold">
            <span>Total Penarikan Saldo</span>
            <div className="w-7 h-7 rounded-lg bg-rose-200/60 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-rose-700" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-rose-950 mt-1">
            - {formatRupiah(totalWithdraw)}
          </div>
          <div className="text-[11px] text-rose-700 mt-1">
            {dailyTransactions.filter((t) => t.type === 'withdraw').length} transaksi penarikan
          </div>
        </div>

        {/* Net Arus Kas Harian */}
        <div className="bg-slate-900 text-white rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
            <span>Arus Kas Bersih (Net)</span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-mono">
              HARIAN
            </span>
          </div>
          <div className={`text-xl font-extrabold mt-1 ${netCashflow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netCashflow >= 0 ? '+' : ''} {formatRupiah(netCashflow)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total {dailyTransactions.length} transaksi pada {formatIndonesianDate(selectedDate, false)}
          </div>
        </div>
      </div>

      {/* Transactions Table for the Day & Mobile Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
            Rincian Mutasi Kas Harian ({formatIndonesianDate(selectedDate, false)})
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            {dailyTransactions.length} Catatan Transaksi
          </span>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 w-12 text-center">No</th>
                <th className="py-2.5 px-4">Jam</th>
                <th className="py-2.5 px-4">Nama Siswa / NISN</th>
                <th className="py-2.5 px-4">Kelas</th>
                <th className="py-2.5 px-4">Jenis</th>
                <th className="py-2.5 px-4 text-right">Nominal</th>
                <th className="py-2.5 px-4 text-right">Saldo Akhir</th>
                <th className="py-2.5 px-4">Keterangan</th>
                <th className="py-2.5 px-4 text-center">Status WA</th>
                <th className="py-2.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    Tidak ada transaksi tabungan pada tanggal {formatIndonesianDate(selectedDate, false)}.
                  </td>
                </tr>
              ) : (
                dailyTransactions.map((tx, idx) => {
                  const timeStr = new Date(tx.date).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-700">{timeStr} WITA</td>
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-slate-900">{tx.studentName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">NISN: {tx.studentNisn}</div>
                      </td>
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
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                        <span className={tx.type === 'deposit' ? 'text-emerald-800' : 'text-rose-800'}>
                          {tx.type === 'deposit' ? '+' : '-'} {formatRupiah(tx.amount)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                        {formatRupiah(tx.currentBalance)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 max-w-[150px] truncate" title={tx.note}>
                        {tx.note || '-'}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            tx.waNotificationStatus === 'sent'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {tx.waNotificationStatus === 'sent' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>Terkirim</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 text-amber-700" />
                              <span>Pending</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleResendWA(tx)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                            title="Kirim Ulang Notifikasi WhatsApp"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePrintReceipt(tx)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title="Cetak Kuitansi Struk"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {dailyTransactions.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              Tidak ada transaksi tabungan pada tanggal {formatIndonesianDate(selectedDate, false)}.
            </div>
          ) : (
            dailyTransactions.map((tx, idx) => {
              const timeStr = new Date(tx.date).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={tx.id} className="p-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900 text-xs">
                      {idx + 1}. {tx.studentName}
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
                    <span className="text-slate-500 font-mono text-[11px]">{timeStr} WITA</span>
                    <span className={`font-bold tabular-nums ${tx.type === 'deposit' ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {tx.type === 'deposit' ? '+' : '-'} {formatRupiah(tx.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-500">Saldo: <strong className="text-slate-900 font-bold tabular-nums">{formatRupiah(tx.currentBalance)}</strong></span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleResendWA(tx)}
                        className="px-2 py-1 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 flex items-center gap-1 font-semibold text-[10px]"
                      >
                        <Smartphone className="w-3 h-3 text-emerald-700" />
                        <span>{tx.waNotificationStatus === 'sent' ? 'WA' : 'Kirim WA'}</span>
                      </button>
                      <button
                        onClick={() => handlePrintReceipt(tx)}
                        className="p-1 bg-slate-100 text-slate-700 rounded border border-slate-200"
                        title="Struk"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
