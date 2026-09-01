import React, { useState } from 'react';
import { Smartphone, X, CheckCircle2, RotateCcw, Send, MessageSquareText, ShieldAlert } from 'lucide-react';
import { WhatsAppConfig, SchoolProfile } from '../types';
import { StorageService, DEFAULT_WA_CONFIG } from '../services/storage';
import { openWhatsAppDirect } from '../services/whatsapp';

interface WhatsAppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: SchoolProfile;
}

export const WhatsAppSettingsModal: React.FC<WhatsAppSettingsModalProps> = ({
  isOpen,
  onClose,
  school,
}) => {
  const [config, setConfig] = useState<WhatsAppConfig>(StorageService.getWAConfig());
  const [testPhone, setTestPhone] = useState('081234567890');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveWAConfig(config);
    setSuccessMsg('Format template notifikasi WhatsApp berhasil disimpan!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleResetDefault = () => {
    setConfig(DEFAULT_WA_CONFIG);
    StorageService.saveWAConfig(DEFAULT_WA_CONFIG);
    setSuccessMsg('Template dikembalikan ke format bawaan SDN 5 JURIT BARU.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleTestSend = () => {
    if (!testPhone) return;
    const testMsg = `*TES NOTIFIKASI WHATSAPP TABUNGAN SISWA*
🏫 *${school.name}*
━━━━━━━━━━━━━━━━━━━━
Ini adalah pesan uji coba sistem notifikasi kas tabungan digital SDN 5 JURIT BARU. Sistem terhubung dan siap beroperasi dengan lancar!`;
    openWhatsAppDirect(testPhone, testMsg);
  };

  const tags = [
    '{NAMA_SISWA}',
    '{NISN}',
    '{KELAS}',
    '{JENIS_TRANSAKSI}',
    '{NOMINAL}',
    '{TANGGAL}',
    '{SALDO_LAMA}',
    '{SALDO_BARU}',
    '{CATATAN}',
    '{PETUGAS}',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col text-xs">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-emerald-100">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Pengaturan Format Pesan WhatsApp</h2>
              <p className="text-xs text-emerald-200">Kustomisasi template notifikasi otomatis ke wali murid</p>
            </div>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700">Template Pesan WhatsApp:</label>
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-[11px] text-emerald-700 font-semibold hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset ke Default</span>
              </button>
            </div>
            <textarea
              rows={9}
              value={config.customTemplate}
              onChange={(e) => setConfig({ ...config, customTemplate: e.target.value })}
              className="w-full font-mono text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden leading-relaxed"
            />
          </div>

          {/* Dynamic Tags Helper */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="font-bold text-slate-800">Tag Otomatis yang Tersedia:</div>
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setConfig({ ...config, customTemplate: config.customTemplate + ' ' + t })}
                  className="px-2 py-0.5 bg-white border border-slate-200 text-emerald-800 font-mono text-[10px] rounded hover:bg-emerald-50"
                  title="Klik untuk menyisipkan ke template"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-medium">
              <input
                type="checkbox"
                checked={config.includeSchoolContact}
                onChange={(e) => setConfig({ ...config, includeSchoolContact: e.target.checked })}
                className="rounded text-emerald-600"
              />
              <span>Sertakan Kontak Telepon Sekolah di Akhir Pesan</span>
            </label>
          </div>

          {/* Test Send Section */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <MessageSquareText className="w-4 h-4 text-emerald-700" />
              <span>Tes Pengiriman WhatsApp:</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nomor HP/WA (cth: 081234567890)"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="flex-1 py-1.5 px-3 rounded-lg border border-slate-300 bg-white"
              />
              <button
                type="button"
                onClick={handleTestSend}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Kirim Tes</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Simpan Pengaturan Template WA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
