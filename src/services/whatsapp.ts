import { Student, Transaction, WhatsAppConfig, SchoolProfile } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatIndonesianDate(isoOrDateString: string, includeTime = true): string {
  try {
    const d = new Date(isoOrDateString);
    if (isNaN(d.getTime())) return isoOrDateString;
    const dateStr = d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (!includeTime) return dateStr;
    const timeStr = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr}, pukul ${timeStr} WITA`;
  } catch {
    return isoOrDateString;
  }
}

export function normalizePhoneNumber(phone: string, defaultCountryCode = '62'): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.startsWith('0')) {
    cleaned = defaultCountryCode + cleaned.substring(1);
  } else if (!cleaned.startsWith(defaultCountryCode)) {
    cleaned = defaultCountryCode + cleaned;
  }
  return cleaned;
}

export function generateTransactionWAMessage(
  tx: Transaction,
  student: Student,
  waConfig: WhatsAppConfig,
  schoolProfile: SchoolProfile
): string {
  const jenisText = tx.type === 'deposit' ? '🟢 SETORAN TABUNGAN' : '🔴 PENARIKAN TABUNGAN';
  const nominalText = (tx.type === 'deposit' ? '+ ' : '- ') + formatRupiah(tx.amount);
  const tanggalText = formatIndonesianDate(tx.date, true);
  const saldoLamaText = formatRupiah(tx.previousBalance);
  const saldoBaruText = formatRupiah(tx.currentBalance);

  let msg = waConfig.customTemplate || '';

  msg = msg.replace(/\{NAMA_SISWA\}/g, student.name);
  msg = msg.replace(/\{NISN\}/g, student.nisn || student.nis || '-');
  msg = msg.replace(/\{KELAS\}/g, student.className || `Kelas ${student.classId}`);
  msg = msg.replace(/\{JENIS_TRANSAKSI\}/g, jenisText);
  msg = msg.replace(/\{NOMINAL\}/g, nominalText);
  msg = msg.replace(/\{TANGGAL\}/g, tanggalText);
  msg = msg.replace(/\{CATATAN\}/g, tx.note || 'Transaksi Kas Tabungan Siswa');
  msg = msg.replace(/\{SALDO_LAMA\}/g, saldoLamaText);
  msg = msg.replace(/\{SALDO_BARU\}/g, saldoBaruText);
  msg = msg.replace(/\{PETUGAS\}/g, tx.officerName || schoolProfile.treasurer);

  if (student.savingGoal?.active && student.savingGoal.target > 0) {
    const pct = Math.min(100, Math.round((student.balance / student.savingGoal.target) * 100));
    msg += `\n🎯 *Target Tabungan*: ${student.savingGoal.label} (${pct}% tercapai dari ${formatRupiah(student.savingGoal.target)})`;
  }

  if (waConfig.includeSchoolContact && schoolProfile.phone) {
    msg += `\n📞 *Kontak Sekolah*: ${schoolProfile.phone}`;
  }

  return msg;
}

export function generateMonthlySummaryWAMessage(
  student: Student,
  monthName: string,
  year: number,
  depositTotal: number,
  withdrawTotal: number,
  schoolProfile: SchoolProfile
): string {
  const saldoText = formatRupiah(student.balance);
  const setoranText = formatRupiah(depositTotal);
  const penarikanText = formatRupiah(withdrawTotal);

  return `*REKAP BULANAN TABUNGAN SISWA*
🏫 *${schoolProfile.name}*
━━━━━━━━━━━━━━━━━━━━
Yth. Orang Tua / Wali Murid:
👤 *Nama Siswa*: ${student.name}
🆔 *NISN*: ${student.nisn}
🏫 *Kelas*: ${student.className}
📅 *Periode*: ${monthName} ${year}
━━━━━━━━━━━━━━━━━━━━
📊 *Rincian Mutasi Bulan Ini*:
➕ Total Setoran: *${setoranText}*
➖ Total Penarikan: *${penarikanText}*
💎 *SALDO AKHIR*: *${saldoText}*
━━━━━━━━━━━━━━━━━━━━
${student.savingGoal?.active ? `🎯 Target (${student.savingGoal.label}): ${Math.min(100, Math.round((student.balance / student.savingGoal.target) * 100))}% tercapai\n━━━━━━━━━━━━━━━━━━━━\n` : ''}Mari terus dukung putra-putri kita membiasakan gemar menabung sejak dini.

Salam hormat,
*${schoolProfile.treasurer}*
Bendahara ${schoolProfile.name}`;
}

export function getWhatsAppWebUrl(phone: string, message: string): string {
  const cleanPhone = normalizePhoneNumber(phone);
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}

export function openWhatsAppDirect(phone: string, message: string): boolean {
  if (!phone) return false;
  const url = getWhatsAppWebUrl(phone, message);
  window.open(url, '_blank');
  return true;
}
