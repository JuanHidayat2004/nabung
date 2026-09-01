import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Database,
  Cloud,
  X,
  Copy,
  Check,
  Zap,
  Download,
  Upload,
  Info,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { GoogleSheetsConfig, Student, Transaction } from '../types';
import { StorageService } from '../services/storage';
import { GoogleSheetsService } from '../services/sheets';
import { formatIndonesianDate } from '../services/whatsapp';

interface GoogleSheetsSyncProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  transactions: Transaction[];
  onRefresh: () => void;
}

export const GoogleSheetsSync: React.FC<GoogleSheetsSyncProps> = ({
  isOpen,
  onClose,
  students,
  transactions,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'webhook' | 'export'>('webhook');
  const [config, setConfig] = useState<GoogleSheetsConfig>(StorageService.getSheetsConfig());
  const [webhookInput, setWebhookInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [syncElapsedMs, setSyncElapsedMs] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = StorageService.getSheetsConfig();
      setConfig(current);
      setWebhookInput(current.webhookUrl || '');
      setStatusMessage(null);
      setSyncElapsedMs(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Copy Apps Script Code
  const handleCopyCode = () => {
    const code = GoogleSheetsService.getAppsScriptTemplate();
    navigator.clipboard.writeText(code);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  // 1. Save Webhook & Sync Immediately
  const handleSaveAndSyncWebhook = async () => {
    if (!webhookInput.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Masukkan URL Webhook Google Apps Script terlebih dahulu.',
      });
      return;
    }

    const cleanUrl = webhookInput.trim();
    setIsSyncing(true);
    setStatusMessage({
      type: 'info',
      text: 'Mengirim data ke Google Sheets melalui Webhook...',
    });

    const startTime = performance.now();
    try {
      const result = await GoogleSheetsService.syncViaWebhook(cleanUrl, students, transactions);
      const elapsed = Math.round(performance.now() - startTime);
      setSyncElapsedMs(elapsed);

      const updated: GoogleSheetsConfig = {
        ...config,
        connected: true,
        webhookUrl: cleanUrl,
        lastSyncedAt: result.timestamp,
        syncMode: 'webhook',
      };
      StorageService.saveSheetsConfig(updated);
      setConfig(updated);

      setStatusMessage({
        type: 'success',
        text: `⚡ Sinkronisasi super cepat berhasil dalam ${elapsed} ms! Data SDN 5 JURIT BARU telah terupdate di Google Sheets.`,
      });
      onRefresh();
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal menyambung ke Webhook Google Sheets. Periksa URL Anda.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. Manual Export to CSV / Sheets
  const handleExportCsvStudents = () => {
    const headers = ['ID Siswa', 'NISN', 'NIS', 'Nama Siswa', 'L/P', 'Kelas', 'Nama Wali', 'No WA', 'Saldo', 'Status'];
    const rows = students.map((s) => [
      s.id,
      `'${s.nisn}`,
      `'${s.nis}`,
      `"${s.name}"`,
      s.gender,
      `"${s.className}"`,
      `"${s.parentName}"`,
      `'${s.parentPhone}`,
      s.balance,
      s.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SDN5JuritBaru_Data_Siswa_Saldo_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCsvTransactions = () => {
    const headers = ['ID Transaksi', 'Tanggal', 'NISN', 'Nama Siswa', 'Kelas', 'Jenis', 'Nominal', 'Saldo Sebelum', 'Saldo Akhir', 'Keterangan', 'Petugas'];
    const rows = transactions.map((t) => [
      t.id,
      `"${t.date}"`,
      `'${t.studentNisn}`,
      `"${t.studentName}"`,
      `"${t.className}"`,
      t.type === 'deposit' ? 'SETOR' : 'TARIK',
      t.amount,
      t.previousBalance,
      t.currentBalance,
      `"${t.note || ''}"`,
      `"${t.officerName || 'Bendahara'}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SDN5JuritBaru_Mutasi_Transaksi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportBackup = () => {
    const jsonStr = StorageService.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Kas_Tabungan_SDN5JuritBaru_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const success = StorageService.importBackupJson(content);
      if (success) {
        setStatusMessage({ type: 'success', text: 'Backup berhasil dipulihkan!' });
        onRefresh();
      } else {
        setStatusMessage({ type: 'error', text: 'Gagal memulihkan backup. Format JSON tidak valid.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col text-xs">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-emerald-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Sinkronisasi Google Sheets</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-semibold border border-emerald-400/30">
                  SDN 5 JURIT BARU
                </span>
              </h2>
              <p className="text-xs text-emerald-200">Koneksi data real-time, backup instan, dan bebas lemot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('webhook')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'webhook'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>⚡ Sinkron Otomatis (Google Sheets Webhook)</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'export'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>📥 Unduh File Spreadsheet / CSV & Cadangan</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2 text-xs transition-all ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-spin" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: WEBHOOK (FASTEST & RECOMMENDED) */}
          {activeTab === 'webhook' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                      ⚡
                    </span>
                    <h3 className="font-bold text-emerald-950 text-sm">Metode Webhook Google Apps Script</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-800 font-bold text-[10px]">
                    100% Gratis & Stabil
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Metode ini langsung mengirim seluruh data siswa ({students.length} siswa) dan riwayat ({transactions.length}{' '}
                  transaksi) ke Google Sheets dalam <strong>&lt; 1 detik</strong> tanpa verifikasi Cloud yang rumit.
                </p>
              </div>

              {/* Steps */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Panduan Mudah Pasang Sekali Saja (2 Menit):</span>
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-600 leading-relaxed text-xs">
                  <li>
                    Buka Google Spreadsheet baru di{' '}
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 font-bold underline inline-flex items-center gap-0.5"
                    >
                      sheets.new <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    Di spreadsheet Anda, klik menu <strong>Ekstensi (Extensions)</strong> &gt;{' '}
                    <strong>Apps Script</strong>.
                  </li>
                  <li>
                    Hapus kode bawaan di sana, lalu klik tombol ini untuk salin kode otomatis:{' '}
                    <button
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-bold text-[11px] ml-1 cursor-pointer transition-colors"
                    >
                      {copiedScript ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedScript ? 'Kode Tersalin!' : 'Salin Kode Script'}</span>
                    </button>
                  </li>
                  <li>
                    Klik <strong>Deploy (Terapkan)</strong> di pojok kanan atas &gt; <strong>New Deployment (Penerapan Baru)</strong> &gt;
                    Pilih jenis <strong>Web App (Aplikasi Web)</strong>.
                    <div className="text-[11px] text-slate-500 ml-4 mt-0.5">
                      • Who has access (Siapa yang memiliki akses): <strong>Anyone (Siapa saja)</strong>
                    </div>
                  </li>
                  <li>Klik Deploy, lalu tempelkan URL Web App yang muncul (berakhiran <code>/exec</code>) ke kolom berikut:</li>
                </ol>
              </div>

              {/* Webhook Input Field */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 text-xs block">
                  Tempel URL Web App Google Apps Script Anda:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={webhookInput}
                    onChange={(e) => setWebhookInput(e.target.value)}
                    className="flex-1 py-2.5 px-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-mono text-xs"
                  />
                  <button
                    onClick={handleSaveAndSyncWebhook}
                    disabled={isSyncing}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Menyinkronkan...' : '⚡ Sinkronkan Sekarang'}</span>
                  </button>
                </div>
              </div>

              {config.lastSyncedAt && (
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between text-slate-600 text-[11px]">
                  <span>Status: <strong className="text-emerald-700">Terhubung</strong></span>
                  <span>Terakhir Sinkron: <strong>{formatIndonesianDate(config.lastSyncedAt, true)}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INSTANT EXPORT TO CSV / EXCEL */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                <h3 className="font-bold text-blue-950 text-sm mb-1 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Ekspor Langsung Format Spreadsheet (100% Offline)</span>
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Anda dapat langsung mengunduh file spreadsheet siap pakai untuk langsung dibuka di Google Sheets, Microsoft
                  Excel, atau diimpor kapan saja.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">Data Siswa & Saldo Terkini</div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Berisi {students.length} siswa lengkap dengan NISN, kelas, nomor WA wali, dan saldo terkini.
                    </p>
                  </div>
                  <button
                    onClick={handleExportCsvStudents}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh CSV Data Siswa</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">Buku Mutasi Transaksi</div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Berisi {transactions.length} baris riwayat setor/tarik lengkap dengan tanggal, nominal, dan petugas.
                    </p>
                  </div>
                  <button
                    onClick={handleExportCsvTransactions}
                    className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh CSV Mutasi Kas</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-slate-100 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="text-slate-600">
                  Ingin membuka Google Sheets langsung di tab baru?
                </div>
                <a
                  href="https://sheets.new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg flex items-center gap-1 shrink-0"
                >
                  <span>Buka sheets.new</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Offline Backup & Restore Section */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-700" />
              <span>Cadangan Offline Lengkap (File Backup JSON)</span>
            </h4>
            <p className="text-slate-500 mb-3 text-xs leading-relaxed">
              Meskipun offline atau tanpa jaringan, data tabungan SDN 5 JURIT BARU selalu tersimpan utuh di browser lokal
              Anda. Anda dapat mengekspor atau memulihkan seluruh data kapan saja.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportBackup}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Unduh File Cadangan JSON</span>
              </button>

              <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer text-xs">
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>Pulihkan dari File JSON</span>
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
