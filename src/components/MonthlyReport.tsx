import React, { useState } from 'react';
import {
  CalendarRange,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Smartphone,
  Share2,
  Users,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Send,
} from 'lucide-react';
import { Student, Transaction, SchoolProfile } from '../types';
import { StorageService } from '../services/storage';
import {
  formatRupiah,
  generateMonthlySummaryWAMessage,
  openWhatsAppDirect,
} from '../services/whatsapp';
import { ReportService } from '../services/reports';

interface MonthlyReportProps {
  students: Student[];
  transactions: Transaction[];
  school: SchoolProfile;
}

const MONTHS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

export const MonthlyReport: React.FC<MonthlyReportProps> = ({
  students,
  transactions,
  school,
}) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const monthObj = MONTHS.find((m) => m.value === selectedMonth) || MONTHS[0];

  // Filter students based on class
  const filteredStudents =
    selectedClass === 'all'
      ? students
      : students.filter((s) => s.classId === selectedClass || s.className === selectedClass);

  // Calculate stats for each student in the selected month & year
  let grandDepositMonth = 0;
  let grandWithdrawMonth = 0;
  let grandTotalBalance = 0;

  const studentMonthlySummaries = filteredStudents.map((s) => {
    const txList = transactions.filter((t) => {
      if (t.studentId !== s.id) return false;
      const d = new Date(t.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });

    const depositMonth = txList.filter((t) => t.type === 'deposit').reduce((acc, c) => acc + c.amount, 0);
    const withdrawMonth = txList.filter((t) => t.type === 'withdraw').reduce((acc, c) => acc + c.amount, 0);

    grandDepositMonth += depositMonth;
    grandWithdrawMonth += withdrawMonth;
    grandTotalBalance += s.balance;

    return {
      student: s,
      depositMonth,
      withdrawMonth,
      netChange: depositMonth - withdrawMonth,
      txCount: txList.length,
    };
  });

  const handleDownloadPDF = () => {
    const classFilterLabel = selectedClass === 'all' ? 'Semua Kelas' : `Kelas ${selectedClass}`;
    ReportService.generateMonthlyReportPDF(
      monthObj.label,
      selectedMonth,
      selectedYear,
      students,
      transactions,
      school,
      classFilterLabel
    );
  };

  const handleDownloadExcel = () => {
    const classFilterLabel = selectedClass === 'all' ? 'Semua Kelas' : `Kelas ${selectedClass}`;
    ReportService.generateMonthlyReportExcel(
      monthObj.label,
      selectedMonth,
      selectedYear,
      students,
      transactions,
      school,
      classFilterLabel
    );
  };

  const handleSendSingleMonthlyWA = (summary: (typeof studentMonthlySummaries)[0]) => {
    const { student, depositMonth, withdrawMonth } = summary;
    if (!student.parentPhone) {
      alert('Nomor WhatsApp orang tua tidak ditemukan.');
      return;
    }

    const msg = generateMonthlySummaryWAMessage(
      student,
      monthObj.label,
      selectedYear,
      depositMonth,
      withdrawMonth,
      school
    );
    openWhatsAppDirect(student.parentPhone, msg);
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">
              Rekapitulasi Bulanan Otomatis Tabungan Siswa
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Unduh laporan format resmi PDF & Excel serta broadcast rekap saldo ke WhatsApp wali murid
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download PDF */}
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Unduh Rekap PDF</span>
          </button>

          {/* Download Excel */}
          <button
            onClick={handleDownloadExcel}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Unduh Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700">Pilih Bulan:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="py-1.5 px-3 rounded-lg border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700">Tahun:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="py-1.5 px-3 rounded-lg border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700">Kelas:</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white"
            >
              <option value="all">Semua Kelas (1 - 6)</option>
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
          Periode Rekap: <strong className="text-emerald-900 font-bold">{monthObj.label} {selectedYear}</strong>
        </div>
      </div>

      {/* Monthly Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Setoran Bulan Ini */}
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
            <span>Setoran ({monthObj.label})</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-200/60 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-emerald-950 mt-1">
            + {formatRupiah(grandDepositMonth)}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">Total uang masuk bulan ini</div>
        </div>

        {/* Total Penarikan Bulan Ini */}
        <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between text-rose-800 text-xs font-semibold">
            <span>Penarikan ({monthObj.label})</span>
            <div className="w-7 h-7 rounded-lg bg-rose-200/60 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-rose-700" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-rose-950 mt-1">
            - {formatRupiah(grandWithdrawMonth)}
          </div>
          <div className="text-[11px] text-rose-700 mt-1">Total penarikan bulan ini</div>
        </div>

        {/* Total Saldo Keseluruhan */}
        <div className="bg-teal-50/80 border border-teal-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between text-teal-800 text-xs font-semibold">
            <span>Total Saldo Mengendap</span>
            <div className="w-7 h-7 rounded-lg bg-teal-200/60 flex items-center justify-center">
              <Users className="w-4 h-4 text-teal-700" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-teal-950 mt-1">
            {formatRupiah(grandTotalBalance)}
          </div>
          <div className="text-[11px] text-teal-700 mt-1">
            Saldo akumulasi {filteredStudents.length} siswa
          </div>
        </div>

        {/* Arus Kas Bersih Bulan Ini */}
        <div className="bg-slate-900 text-white rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
            <span>Net Growth Tabungan</span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-mono">
              BULANAN
            </span>
          </div>
          <div className="text-xl font-extrabold text-emerald-400 mt-1">
            {grandDepositMonth - grandWithdrawMonth >= 0 ? '+' : ''}{' '}
            {formatRupiah(grandDepositMonth - grandWithdrawMonth)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Pertumbuhan dana siswa</div>
        </div>
      </div>

      {/* Students Monthly Table & Mobile Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
            Daftar Tabungan Siswa — Periode {monthObj.label} {selectedYear}
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {filteredStudents.length} Siswa Terpilih
          </span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 w-12 text-center">No</th>
                <th className="py-2.5 px-4">Nama Siswa / NISN</th>
                <th className="py-2.5 px-4">Kelas</th>
                <th className="py-2.5 px-4">Wali Murid / WA</th>
                <th className="py-2.5 px-4 text-right">Setor ({monthObj.label})</th>
                <th className="py-2.5 px-4 text-right">Tarik ({monthObj.label})</th>
                <th className="py-2.5 px-4 text-right">Saldo Akhir Terkini</th>
                <th className="py-2.5 px-4 text-center">Broadcast WA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentMonthlySummaries.map((item, idx) => {
                const { student, depositMonth, withdrawMonth, txCount } = item;
                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-slate-900">{student.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        NISN: {student.nisn} • {txCount} mutasi
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
                        {student.className}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-800">{student.parentName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {student.parentPhone || 'Belum ada WA'}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-800 tabular-nums">
                      {depositMonth > 0 ? `+ ${formatRupiah(depositMonth)}` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-rose-800 tabular-nums">
                      {withdrawMonth > 0 ? `- ${formatRupiah(withdrawMonth)}` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900 text-emerald-900 tabular-nums">
                      {formatRupiah(student.balance)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => handleSendSingleMonthlyWA(item)}
                        disabled={!student.parentPhone}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                        title="Kirim Pesan Rekap Bulanan ke WhatsApp Orang Tua"
                      >
                        <Smartphone className="w-3 h-3" />
                        <span>Kirim WA</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
              <tr>
                <td colSpan={4} className="py-3 px-4 text-right">
                  TOTAL KESELURUHAN:
                </td>
                <td className="py-3 px-4 text-right text-emerald-800 tabular-nums">
                  + {formatRupiah(grandDepositMonth)}
                </td>
                <td className="py-3 px-4 text-right text-rose-800 tabular-nums">
                  - {formatRupiah(grandWithdrawMonth)}
                </td>
                <td className="py-3 px-4 text-right text-base text-emerald-950 font-extrabold tabular-nums">
                  {formatRupiah(grandTotalBalance)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {studentMonthlySummaries.map((item, idx) => {
            const { student, depositMonth, withdrawMonth, txCount } = item;
            return (
              <div key={student.id} className="p-3.5 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      {idx + 1}. {student.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {student.className} • {txCount} mutasi
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-emerald-900 text-xs tabular-nums">
                      {formatRupiah(student.balance)}
                    </div>
                    <div className="text-[10px] text-slate-400">Saldo Terkini</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-500 block">Setoran:</span>
                    <span className="font-bold text-emerald-800 tabular-nums">
                      {depositMonth > 0 ? `+ ${formatRupiah(depositMonth)}` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Penarikan:</span>
                    <span className="font-bold text-rose-800 tabular-nums">
                      {withdrawMonth > 0 ? `- ${formatRupiah(withdrawMonth)}` : '-'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="text-[11px] text-slate-600 font-mono truncate max-w-[180px]">
                    WA: {student.parentPhone || 'Belum diisi'}
                  </div>
                  <button
                    onClick={() => handleSendSingleMonthlyWA(item)}
                    disabled={!student.parentPhone}
                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>Broadcast WA</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
