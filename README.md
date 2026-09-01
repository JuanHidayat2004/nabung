# Website Tabungan Siswa SDN 5 JURIT BARU

Aplikasi manajemen tabungan siswa resmi untuk **SDN 5 JURIT BARU** yang mendukung pencatatan setor/tarik, integrasi Google Sheets, notifikasi WhatsApp otomatis ke wali murid, cetak struk/rekap PDF & Excel, serta portal cek saldo mandiri bagi wali murid.

---

## 🚀 Repositori GitHub
- **Pemilik**: `sujaihidayat14`
- **Nama Repositori**: `nabung`
- **URL Repositori**: [https://github.com/sujaihidayat14/nabung](https://github.com/sujaihidayat14/nabung)
- **URL Live Website (GitHub Pages)**: [https://sujaihidayat14.github.io/nabung/](https://sujaihidayat14.github.io/nabung/)

---

## 🌐 Cara Mengaktifkan GitHub Pages

1. Buka repositori Anda di browser: [https://github.com/sujaihidayat14/nabung](https://github.com/sujaihidayat14/nabung)
2. Klik tab **Settings** di bagian atas.
3. Di bilah samping kiri (sidebar), pilih **Pages** (di bawah bagian *Code and automation*).
4. Pada bagian **Build and deployment** > **Source**, ubah pilihan menjadi:
   - **GitHub Actions**
5. Selesai! Script otomatis di `.github/workflows/deploy.yml` akan langsung mem-build dan mempublikasikan website Anda ke alamat:
   👉 **https://sujaihidayat14.github.io/nabung/**

---

## ✨ Fitur Utama
- **Kas Tabungan & Mutasi**: Pencatatan setor dan tarik tunai dengan cetak struk resmi.
- **Portal Siswa & Wali Murid**: Pengecekan saldo mandiri menggunakan NISN atau NIS.
- **WhatsApp Notification**: Kirim bukti transaksi langsung ke nomor WhatsApp wali murid (via Webhook otomatis atau link WA Web).
- **Google Sheets Sync**: Sinkronisasi data mutasi kas & saldo siswa secara real-time / webhook Apps Script super cepat.
- **Laporan & Rekapitulasi**: Ekspor PDF rekap harian/bulanan, ekspor file Excel & CSV, serta backup/restore data JSON.
- **100% Responsif**: Tampilan optimal untuk smartphone, tablet, dan laptop/PC.

---

## 🛠️ Pengembangan Lokal

```bash
# Clone repository
git clone https://github.com/sujaihidayat14/nabung.git

# Masuk ke folder
cd nabung

# Install dependencies
npm install

# Jalankan server pengembangan
npm run dev

# Build untuk produksi
npm run build
```
