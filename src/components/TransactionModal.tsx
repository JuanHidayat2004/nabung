import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  MinusCircle,
  User,
  ArrowRight,
  Send,
  Printer,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student, Transaction, SchoolProfile, WhatsAppConfig, GoogleSheetsConfig } from '../types';
import { StorageService } from '../services/storage';
import {
  formatRupiah,
  generateTransactionWAMessage,
  openWhatsAppDirect,
  normalizePhoneNumber,
} from '../services/whatsapp';
import { ReportService } from '../services/reports';
import { GoogleSheetsService } from '../services/sheets';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudentId?: string;
  initialType?: 'deposit' | 'withdraw';
  onTransactionComplete: (tx: Transaction) => void;
  school: SchoolProfile;
}

const QUICK_AMOUNTS = [2000, 5000, 10000, 20000, 50000, 100000];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialStudentId,
  initialType = 'deposit',
  onTransactionComplete,
  school,
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [txType, setTxType] = useState<'deposit' | 'withdraw'>(initialType);
  const [amount, setAmount] = useState<number>(10000);
  const [note, setNote] = useState<string>('');
  const [officerName, setOfficerName] = useState<string>(school.treasurer);
  const [sendWA, setSendWA] = useState<boolean>(true);
  const [previewWA, setPreviewWA] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);
  const [completedStudent, setCompletedStudent] = useState<Student | null>(null);

  const waConfig = StorageService.getWAConfig();
  const sheetsConfig = StorageService.getSheetsConfig();

  useEffect(() => {
    if (isOpen) {
      const data = StorageService.getStudents();
      setStudents(data);
      if (initialStudentId) {
        setSelectedStudentId(initialStudentId);
      } else if (data.length > 0 && !selectedStudentId) {
        setSelectedStudentId(data[0].id);
      }
      setTxType(initialType);
      setCompletedTx(null);
      setCompletedStudent(null);
      setNote(initialType === 'deposit' ? 'Setoran tabungan harian' : 'Penarikan kebutuhan sekolah');
    }
  }, [isOpen, initialStudentId, initialType]);

  if (!isOpen) return null;

  const currentStudent = students.find((s) => s.id === selectedStudentId);
  const previousBalance = currentStudent ? currentStudent.balance : 0;
  const currentBalance =
    txType === 'deposit' ? previousBalance + (amount || 0) : previousBalance - (amount || 0);

  const isInvalidWithdraw = txType === 'withdraw' && amount > previousBalance;

  // Filter students for picker
  const filteredStudents = students.filter((s) => {
    const matchClass = selectedClass === 'all' || s.classId === selectedClass || s.className === selectedClass;
    const matchSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery) ||
      s.nis.includes(searchQuery);
    return matchClass && matchSearch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent || amount <= 0 || isInvalidWithdraw) return;

    // 1. Create Transaction in local DB
    const newTx = StorageService.addTransaction({
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      studentNisn: currentStudent.nisn,
      classId: currentStudent.classId,
      className: currentStudent.className,
      type: txType,
      amount: amount,
      previousBalance: previousBalance,
      currentBalance: currentBalance,
      date: new Date().toISOString(),
      note: note || (txType === 'deposit' ? 'Setoran Tabungan' : 'Penarikan Tabungan'),
      officerName: officerName || school.treasurer,
      waNotificationStatus: sendWA && currentStudent.parentPhone ? 'sent' : 'not_sent',
    });

    const updatedStudent = { ...currentStudent, balance: currentBalance };
    setCompletedTx(newTx);
    setCompletedStudent(updatedStudent);

    // 2. Trigger Confetti
    if (txType === 'deposit') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe fallback
      }
    }

    // 3. Auto send/open WhatsApp if enabled
    if (sendWA && currentStudent.parentPhone) {
      const waMsg = generateTransactionWAMessage(newTx, updatedStudent, waConfig, school);
      openWhatsAppDirect(currentStudent.parentPhone, waMsg);
    }

    // 4. Background sync to Google Sheets if connected
    if (sheetsConfig.connected && sheetsConfig.accessToken && sheetsConfig.spreadsheetId) {
      GoogleSheetsService.appendSingleTransaction(
        sheetsConfig.accessToken,
        sheetsConfig.spreadsheetId,
        newTx
      ).catch(() => {
        // Fail silently or handle in sync center
      });
    }

    onTransactionComplete(newTx);
  };

  const handleManualSendWA = () => {
    if (!completedTx || !completedStudent || !completedStudent.parentPhone) return;
    const msg = generateTransactionWAMessage(completedTx, completedStudent, waConfig, school);
    openWhatsAppDirect(completedStudent.parentPhone, msg);
  };

  const handlePrintReceipt = () => {
    if (!completedTx || !completedStudent) return;
    ReportService.generateReceiptPDF(completedTx, completedStudent, school);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-emerald-100">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                {completedTx ? 'Transaksi Berhasil Dicatat' : 'Input Transaksi Tabungan Siswa'}
              </h2>
              <p className="text-xs text-emerald-200">SDN 5 JURIT BARU • Kas Digital</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {completedTx && completedStudent ? (
            /* SUCCESS VIEW */
            <div className="text-center py-2 space-y-5 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {completedTx.type === 'deposit' ? 'Setoran Sukses!' : 'Penarikan Sukses!'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Nomor Bukti: <span className="font-mono font-semibold">{completedTx.id}</span>
                </p>
              </div>

              {/* Transaction Summary Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Nama Siswa:</span>
                  <span className="font-bold text-slate-900 text-sm">{completedStudent.name}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Kelas / NISN:</span>
                  <span className="font-medium text-slate-800">{completedStudent.className} • {completedStudent.nisn}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Nominal Transaksi:</span>
                  <span className={`font-extrabold text-sm ${completedTx.type === 'deposit' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {completedTx.type === 'deposit' ? '+' : '-'} {formatRupiah(completedTx.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Saldo Akhir Siswa:</span>
                  <span className="font-extrabold text-base text-emerald-800">{formatRupiah(completedTx.currentBalance)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">No. WA Wali:</span>
                  <span className="font-medium text-slate-800">{completedStudent.parentPhone || 'Belum diisi'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleManualSendWA}
                  disabled={!completedStudent.parentPhone}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Kirim Ulang WA Wali</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Kuitansi Struk</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCompletedTx(null);
                    setCompletedStudent(null);
                    setAmount(10000);
                  }}
                  className="text-xs text-emerald-800 font-bold hover:underline"
                >
                  + Input Transaksi Lainnya
                </button>
              </div>
            </div>
          ) : (
            /* FORM INPUT VIEW */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setTxType('deposit');
                    setNote('Setoran tabungan harian');
                  }}
                  className={`py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    txType === 'deposit'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white/60'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Setor Tabungan (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTxType('withdraw');
                    setNote('Penarikan kebutuhan sekolah');
                  }}
                  className={`py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    txType === 'withdraw'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white/60'
                  }`}
                >
                  <MinusCircle className="w-4 h-4" />
                  <span>Tarik Saldo (-)</span>
                </button>
              </div>

              {/* Student Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Siswa SDN 5 JURIT BARU:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="text-xs rounded-lg border border-slate-300 py-1.5 px-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  >
                    <option value="all">Semua Kelas (1-6)</option>
                    <option value="1">Kelas 1</option>
                    <option value="2">Kelas 2</option>
                    <option value="3">Kelas 3</option>
                    <option value="4">Kelas 4</option>
                    <option value="5">Kelas 5</option>
                    <option value="6">Kelas 6</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Cari nama siswa / NISN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="sm:col-span-2 text-xs rounded-lg border border-slate-300 py-1.5 px-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 py-2.5 px-3 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white"
                  required
                >
                  {filteredStudents.length === 0 ? (
                    <option value="" disabled>Tidak ada siswa yang cocok</option>
                  ) : (
                    filteredStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.className}) — Saldo: {formatRupiah(s.balance)} — Wali: {s.parentName}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Selected Student Balance Card */}
              {currentStudent && (
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-200/80 text-emerald-800 font-bold flex items-center justify-center text-xs">
                      {currentStudent.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{currentStudent.name}</div>
                      <div className="text-slate-500 text-[11px]">
                        No. WA Wali: <span className="font-medium text-slate-700">{currentStudent.parentPhone || '-'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">Saldo Saat Ini</div>
                    <div className="font-extrabold text-sm text-emerald-900">{formatRupiah(currentStudent.balance)}</div>
                  </div>
                </div>
              )}

              {/* Nominal Amount */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">Nominal Transaksi (Rp)</label>
                  <span className="text-[11px] text-slate-500 font-medium">{formatRupiah(amount || 0)}</span>
                </div>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Contoh: 10000"
                  required
                  className="w-full text-base font-bold py-2 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />

                {/* Quick Amount Chips */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-2">
                  {QUICK_AMOUNTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAmount(q)}
                      className={`py-1 px-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                        amount === q
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {formatRupiah(q)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Balance Calculation Preview */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs">
                <div className="flex justify-between items-center">
                  <div className="text-slate-600">
                    <span>Saldo Awal: </span>
                    <span className="font-semibold text-slate-800">{formatRupiah(previousBalance)}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <div className="text-right">
                    <span className="text-slate-600">Estimasi Saldo Baru: </span>
                    <span
                      className={`font-bold ${
                        isInvalidWithdraw ? 'text-rose-600' : 'text-emerald-700 font-extrabold text-sm'
                      }`}
                    >
                      {formatRupiah(currentBalance)}
                    </span>
                  </div>
                </div>

                {isInvalidWithdraw && (
                  <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Saldo tidak mencukupi untuk penarikan sebesar {formatRupiah(amount)}</span>
                  </div>
                )}
              </div>

              {/* Note / Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Catatan</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Contoh: Setoran tabungan harian, beli buku paket, dll."
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              {/* WhatsApp Notification Options */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendWA}
                      onChange={(e) => setSendWA(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Kirim Notifikasi WhatsApp Otomatis ke Orang Tua</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setPreviewWA(!previewWA)}
                    className="text-[11px] text-emerald-800 font-semibold underline hover:text-emerald-950"
                  >
                    {previewWA ? 'Tutup Pratinjau' : 'Lihat Format Pesan'}
                  </button>
                </div>

                {previewWA && currentStudent && (
                  <div className="p-2.5 bg-white border border-emerald-200 rounded-lg text-[11px] text-slate-700 font-mono whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                    {generateTransactionWAMessage(
                      {
                        id: 'TX-PREVIEW-001',
                        studentId: currentStudent.id,
                        studentName: currentStudent.name,
                        studentNisn: currentStudent.nisn,
                        classId: currentStudent.classId,
                        className: currentStudent.className,
                        type: txType,
                        amount: amount,
                        previousBalance: previousBalance,
                        currentBalance: currentBalance,
                        date: new Date().toISOString(),
                        note: note || 'Setoran Tabungan',
                        officerName: officerName || school.treasurer,
                        waNotificationStatus: 'pending',
                        syncedToSheets: false,
                      },
                      { ...currentStudent, balance: currentBalance },
                      waConfig,
                      school
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!currentStudent || amount <= 0 || isInvalidWithdraw}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Simpan Transaksi & Kirim Notif</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
