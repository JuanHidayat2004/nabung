import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Student, Transaction, SchoolProfile } from '../types';
import { formatRupiah, formatIndonesianDate } from './whatsapp';

// Helper for school header on PDF
function addSchoolHeaderPDF(doc: jsPDF, school: SchoolProfile, title: string, subTitle = '') {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Box / Styling
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(50, 60, 70);
  doc.text(school.subTitle.toUpperCase(), pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(15);
  doc.setTextColor(15, 80, 50); // Emerald green dark
  doc.text(school.name, pageWidth / 2, 21, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 90, 100);
  doc.text(
    `${school.address}, ${school.district}, ${school.regency} | NPSN: ${school.npsn}`,
    pageWidth / 2,
    27,
    { align: 'center' }
  );
  doc.text(`Telp/WA: ${school.phone} | Email: ${school.email}`, pageWidth / 2, 31, {
    align: 'center',
  });

  // Double Divider line
  doc.setDrawColor(20, 90, 50);
  doc.setLineWidth(0.8);
  doc.line(14, 34, pageWidth - 14, 34);
  doc.setLineWidth(0.2);
  doc.line(14, 35.2, pageWidth - 14, 35.2);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 30, 40);
  doc.text(title.toUpperCase(), pageWidth / 2, 42, { align: 'center' });

  if (subTitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(90, 100, 110);
    doc.text(subTitle, pageWidth / 2, 47, { align: 'center' });
  }
}

// Helper for official signatures at bottom of PDF
function addSignaturePDF(doc: jsPDF, school: SchoolProfile, startY: number, dateStr?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const today = dateStr || formatIndonesianDate(new Date().toISOString(), false);
  const locationDate = `Pringgasela, ${today}`;

  const currentY = Math.min(startY + 8, doc.internal.pageSize.getHeight() - 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 50, 60);

  // Left: Kepala Sekolah
  doc.text('Mengetahui,', 25, currentY);
  doc.text('Kepala Sekolah SDN 5 Jurit Baru', 25, currentY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.text(school.headmaster, 25, currentY + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${school.headmasterNip}`, 25, currentY + 28.5);

  // Right: Bendahara
  doc.text(locationDate, pageWidth - 80, currentY);
  doc.text('Bendahara Tabungan Sekolah,', pageWidth - 80, currentY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.text(school.treasurer, pageWidth - 80, currentY + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${school.treasurerNip}`, pageWidth - 80, currentY + 28.5);
}

export const ReportService = {
  // 1. Cetak Laporan Saldo Harian (PDF)
  generateDailyReportPDF(
    date: string,
    transactions: Transaction[],
    school: SchoolProfile,
    classFilter = 'Semua Kelas'
  ) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const formattedDate = formatIndonesianDate(date, false);

    addSchoolHeaderPDF(
      doc,
      school,
      'REKAPITULASI KAS TABUNGAN SISWA HARIAN',
      `Tanggal: ${formattedDate} | Filter: ${classFilter}`
    );

    let totalSetor = 0;
    let totalTarik = 0;

    const tableRows = transactions.map((t, idx) => {
      if (t.type === 'deposit') totalSetor += t.amount;
      if (t.type === 'withdraw') totalTarik += t.amount;

      const timeStr = new Date(t.date).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });

      return [
        (idx + 1).toString(),
        timeStr,
        t.studentNisn,
        t.studentName,
        t.className,
        t.type === 'deposit' ? 'SETOR' : 'TARIK',
        formatRupiah(t.amount),
        formatRupiah(t.currentBalance),
        t.note || '-',
      ];
    });

    const netChange = totalSetor - totalTarik;

    autoTable(doc, {
      startY: 52,
      head: [
        [
          'No',
          'Jam',
          'NISN',
          'Nama Siswa',
          'Kelas',
          'Jenis',
          'Nominal',
          'Saldo Akhir',
          'Keterangan',
        ],
      ],
      body: tableRows.length > 0 ? tableRows : [['-', '-', '-', 'Tidak ada transaksi pada tanggal ini', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [20, 83, 45], // Emerald dark
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      footStyles: {
        fillColor: [240, 248, 242],
        textColor: [20, 60, 35],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 14 },
        2: { halign: 'center', cellWidth: 20 },
        3: { cellWidth: 38 },
        4: { halign: 'center', cellWidth: 16 },
        5: { halign: 'center', cellWidth: 16 },
        6: { halign: 'right', cellWidth: 24 },
        7: { halign: 'right', cellWidth: 24 },
        8: { cellWidth: 'auto' },
      },
      foot: [
        [
          {
            content: 'TOTAL KAS HARIAN',
            colSpan: 6,
            styles: { halign: 'right', fontStyle: 'bold', fillColor: [20, 83, 45], textColor: [255, 255, 255] },
          },
          {
            content: `+ ${formatRupiah(totalSetor)}\n- ${formatRupiah(totalTarik)}\nNet: ${formatRupiah(netChange)}`,
            colSpan: 3,
            styles: { halign: 'left', fontStyle: 'bold', fillColor: [240, 248, 242], textColor: [15, 60, 35] },
          },
        ],
      ],
    });

    // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
    const finalY = doc.lastAutoTable?.finalY || 160;
    addSignaturePDF(doc, school, finalY, formattedDate);

    doc.save(`Laporan_Harian_Tabungan_SDN5JuritBaru_${date}.pdf`);
  },

  // 2. Cetak Laporan Saldo Harian (Excel)
  generateDailyReportExcel(date: string, transactions: Transaction[], school: SchoolProfile) {
    const formattedDate = formatIndonesianDate(date, false);

    const rows = transactions.map((t, idx) => ({
      No: idx + 1,
      'Waktu (WITA)': new Date(t.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      NISN: t.studentNisn,
      'Nama Siswa': t.studentName,
      Kelas: t.className,
      'Jenis Transaksi': t.type === 'deposit' ? 'SETOR' : 'TARIK',
      'Nominal (Rp)': t.amount,
      'Saldo Sebelumnya (Rp)': t.previousBalance,
      'Saldo Akhir (Rp)': t.currentBalance,
      Keterangan: t.note || '',
      'Petugas Bendahara': t.officerName,
      'Status WA': t.waNotificationStatus,
    }));

    const totalSetor = transactions.filter((t) => t.type === 'deposit').reduce((acc, c) => acc + c.amount, 0);
    const totalTarik = transactions.filter((t) => t.type === 'withdraw').reduce((acc, c) => acc + c.amount, 0);

    const wb = XLSX.utils.book_new();

    // Header info
    const summaryData = [
      ['REKAPITULASI KAS TABUNGAN SISWA HARIAN'],
      [school.name],
      [`Tanggal: ${formattedDate}`],
      [],
      ['Total Setoran Hari Ini', totalSetor],
      ['Total Penarikan Hari Ini', totalTarik],
      ['Arus Kas Bersih (Net)', totalSetor - totalTarik],
      ['Total Transaksi', transactions.length],
      [],
    ];

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.sheet_add_json(ws, rows, { origin: 'A10' });

    XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Harian');
    XLSX.writeFile(wb, `Laporan_Harian_Tabungan_SDN5JuritBaru_${date}.xlsx`);
  },

  // 3. Rekap Bulanan Otomatis (PDF)
  generateMonthlyReportPDF(
    monthName: string,
    monthNumber: number,
    year: number,
    students: Student[],
    transactions: Transaction[],
    school: SchoolProfile,
    classFilter = 'Semua Kelas'
  ) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    addSchoolHeaderPDF(
      doc,
      school,
      `LAPORAN REKAPITULASI BULANAN TABUNGAN SISWA`,
      `Periode: ${monthName} ${year} | Filter Kelas: ${classFilter}`
    );

    // Calculate monthly breakdown per student
    const filteredStudents =
      classFilter === 'Semua Kelas' ? students : students.filter((s) => s.className === classFilter || s.classId === classFilter);

    let grandDeposit = 0;
    let grandWithdraw = 0;
    let grandBalance = 0;

    const rows = filteredStudents.map((s, idx) => {
      // Find transactions in this month & year
      const txList = transactions.filter((t) => {
        if (t.studentId !== s.id) return false;
        const d = new Date(t.date);
        return d.getMonth() + 1 === monthNumber && d.getFullYear() === year;
      });

      const depositMonth = txList.filter((t) => t.type === 'deposit').reduce((acc, c) => acc + c.amount, 0);
      const withdrawMonth = txList.filter((t) => t.type === 'withdraw').reduce((acc, c) => acc + c.amount, 0);

      grandDeposit += depositMonth;
      grandWithdraw += withdrawMonth;
      grandBalance += s.balance;

      return [
        (idx + 1).toString(),
        s.nisn,
        s.name,
        s.gender,
        s.className,
        s.parentName,
        s.parentPhone,
        formatRupiah(depositMonth),
        formatRupiah(withdrawMonth),
        formatRupiah(s.balance),
        s.status === 'active' ? 'Aktif' : 'Non-Aktif',
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [
        [
          'No',
          'NISN',
          'Nama Siswa',
          'L/P',
          'Kelas',
          'Nama Orang Tua / Wali',
          'No. WA Wali',
          `Setor (${monthName})`,
          `Tarik (${monthName})`,
          'Saldo Akhir',
          'Status',
        ],
      ],
      body: rows.length > 0 ? rows : [['-', '-', 'Tidak ada data siswa', '-', '-', '-', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [15, 83, 50],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      footStyles: {
        fillColor: [20, 83, 45],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 9 },
        1: { halign: 'center', cellWidth: 22 },
        2: { cellWidth: 42 },
        3: { halign: 'center', cellWidth: 10 },
        4: { halign: 'center', cellWidth: 18 },
        5: { cellWidth: 38 },
        6: { cellWidth: 26 },
        7: { halign: 'right', cellWidth: 28 },
        8: { halign: 'right', cellWidth: 28 },
        9: { halign: 'right', cellWidth: 32 },
        10: { halign: 'center', cellWidth: 16 },
      },
      foot: [
        [
          {
            content: 'TOTAL KESELURUHAN',
            colSpan: 7,
            styles: { halign: 'right', fontStyle: 'bold', fillColor: [20, 83, 45], textColor: [255, 255, 255] },
          },
          {
            content: `+ ${formatRupiah(grandDeposit)}`,
            styles: { halign: 'right', fontStyle: 'bold', fillColor: [230, 248, 235], textColor: [15, 83, 50] },
          },
          {
            content: `- ${formatRupiah(grandWithdraw)}`,
            styles: { halign: 'right', fontStyle: 'bold', fillColor: [254, 226, 226], textColor: [185, 28, 28] },
          },
          {
            content: formatRupiah(grandBalance),
            styles: { halign: 'right', fontStyle: 'bold', fillColor: [209, 250, 229], textColor: [6, 78, 59] },
          },
          {
            content: `${filteredStudents.length} Siswa`,
            styles: { halign: 'center', fontStyle: 'bold', fillColor: [20, 83, 45], textColor: [255, 255, 255] },
          },
        ],
      ],
    });

    // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
    const finalY = doc.lastAutoTable?.finalY || 150;
    addSignaturePDF(doc, school, finalY);

    doc.save(`Rekap_Bulanan_Tabungan_SDN5JuritBaru_${monthName}_${year}.pdf`);
  },

  // 4. Rekap Bulanan Otomatis (Excel)
  generateMonthlyReportExcel(
    monthName: string,
    monthNumber: number,
    year: number,
    students: Student[],
    transactions: Transaction[],
    school: SchoolProfile,
    classFilter = 'Semua Kelas'
  ) {
    const filteredStudents =
      classFilter === 'Semua Kelas' ? students : students.filter((s) => s.className === classFilter || s.classId === classFilter);

    const rows = filteredStudents.map((s, idx) => {
      const txList = transactions.filter((t) => {
        if (t.studentId !== s.id) return false;
        const d = new Date(t.date);
        return d.getMonth() + 1 === monthNumber && d.getFullYear() === year;
      });

      const depositMonth = txList.filter((t) => t.type === 'deposit').reduce((acc, c) => acc + c.amount, 0);
      const withdrawMonth = txList.filter((t) => t.type === 'withdraw').reduce((acc, c) => acc + c.amount, 0);

      return {
        No: idx + 1,
        NISN: s.nisn,
        NIS: s.nis,
        'Nama Siswa': s.name,
        'Jenis Kelamin': s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        Kelas: s.className,
        'Nama Orang Tua / Wali': s.parentName,
        'No WhatsApp Wali': s.parentPhone,
        [`Total Setoran (${monthName} ${year})`]: depositMonth,
        [`Total Penarikan (${monthName} ${year})`]: withdrawMonth,
        'Saldo Akhir Saat Ini (Rp)': s.balance,
        'Target Tabungan': s.savingGoal?.target ? `${s.savingGoal.label} (${s.savingGoal.target})` : '-',
        Status: s.status,
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    XLSX.utils.book_append_sheet(wb, ws, `Rekap_${monthName}_${year}`);
    XLSX.writeFile(wb, `Rekap_Bulanan_Tabungan_SDN5JuritBaru_${monthName}_${year}.xlsx`);
  },

  // 5. Cetak Buku Tabungan / Mutasi Lengkap Per Siswa (PDF)
  generateStudentPassbookPDF(student: Student, transactions: Transaction[], school: SchoolProfile) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    addSchoolHeaderPDF(
      doc,
      school,
      'BUKU MUTASI TABUNGAN SISWA',
      `Nomor Rekening Kas: REK-SDN5-${student.nis}`
    );

    // Student Info Card Box in PDF
    doc.setFillColor(245, 248, 245);
    doc.roundedRect(14, 48, doc.internal.pageSize.getWidth() - 28, 26, 2, 2, 'F');
    doc.setDrawColor(200, 220, 200);
    doc.roundedRect(14, 48, doc.internal.pageSize.getWidth() - 28, 26, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 40, 50);

    doc.text('Nama Siswa', 18, 54);
    doc.text(':', 48, 54);
    doc.setFont('helvetica', 'normal');
    doc.text(student.name, 51, 54);

    doc.setFont('helvetica', 'bold');
    doc.text('NISN / NIS', 18, 60);
    doc.text(':', 48, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`${student.nisn} / ${student.nis}`, 51, 60);

    doc.setFont('helvetica', 'bold');
    doc.text('Kelas', 18, 66);
    doc.text(':', 48, 66);
    doc.setFont('helvetica', 'normal');
    doc.text(student.className, 51, 66);

    // Right column of Info Box
    const col2X = doc.internal.pageSize.getWidth() / 2 + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Nama Orang Tua', col2X, 54);
    doc.text(':', col2X + 30, 54);
    doc.setFont('helvetica', 'normal');
    doc.text(student.parentName, col2X + 33, 54);

    doc.setFont('helvetica', 'bold');
    doc.text('No. WhatsApp', col2X, 60);
    doc.text(':', col2X + 30, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(student.parentPhone, col2X + 33, 60);

    doc.setFont('helvetica', 'bold');
    doc.text('SALDO TERKINI', col2X, 66);
    doc.text(':', col2X + 30, 66);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 110, 60);
    doc.text(formatRupiah(student.balance), col2X + 33, 66);

    // Transaction Table
    const studentTx = transactions.filter((t) => t.studentId === student.id);
    const sortedTx = [...studentTx].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const tableRows = sortedTx.map((t, idx) => {
      const d = new Date(t.date);
      const dateOnly = d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return [
        (idx + 1).toString(),
        dateOnly,
        t.note || (t.type === 'deposit' ? 'Setoran Tabungan' : 'Penarikan Tabungan'),
        t.type === 'deposit' ? formatRupiah(t.amount) : '-',
        t.type === 'withdraw' ? formatRupiah(t.amount) : '-',
        formatRupiah(t.currentBalance),
        t.officerName.split(',')[0] || 'Bendahara',
      ];
    });

    autoTable(doc, {
      startY: 78,
      head: [['No', 'Tanggal', 'Keterangan Transaksi', 'Setor (Rp)', 'Tarik (Rp)', 'Saldo (Rp)', 'Paraf']],
      body: tableRows.length > 0 ? tableRows : [['-', '-', 'Belum ada catatan mutasi tabungan', '-', '-', formatRupiah(student.balance), '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [20, 83, 45],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.2,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 9 },
        1: { halign: 'center', cellWidth: 22 },
        2: { cellWidth: 'auto' },
        3: { halign: 'right', cellWidth: 26 },
        4: { halign: 'right', cellWidth: 26 },
        5: { halign: 'right', cellWidth: 28 },
        6: { halign: 'center', cellWidth: 24 },
      },
    });

    // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
    const finalY = doc.lastAutoTable?.finalY || 160;
    addSignaturePDF(doc, school, finalY);

    doc.save(`Buku_Tabungan_SDN5_${student.name.replace(/\s+/g, '_')}_${student.nisn}.pdf`);
  },

  // 6. Cetak Kuitansi / Bukti Transaksi Struk (PDF)
  generateReceiptPDF(tx: Transaction, student: Student, school: SchoolProfile) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [100, 140] }); // Struk size

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(20, 80, 50);
    doc.text(school.name, 50, 10, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(90, 100, 110);
    doc.text('BUKTI TRANSAKSI TABUNGAN SISWA', 50, 14, { align: 'center' });
    doc.text(formatIndonesianDate(tx.date, true), 50, 17.5, { align: 'center' });

    doc.setDrawColor(180, 200, 180);
    doc.setLineWidth(0.3);
    doc.line(8, 20, 92, 20);

    // Body
    doc.setFontSize(7.5);
    doc.setTextColor(40, 50, 60);

    let y = 26;
    const addRow = (label: string, value: string, isBold = false) => {
      doc.setFont('helvetica', 'normal');
      doc.text(label, 10, y);
      doc.text(':', 40, y);
      if (isBold) doc.setFont('helvetica', 'bold');
      doc.text(value, 43, y);
      y += 5.5;
    };

    addRow('No. Bukti', tx.id);
    addRow('NISN / NIS', `${student.nisn} / ${student.nis}`);
    addRow('Nama Siswa', student.name);
    addRow('Kelas', student.className);
    addRow('Jenis Transaksi', tx.type === 'deposit' ? 'SETOR TABUNGAN' : 'PENARIKAN TABUNGAN', true);
    addRow('Nominal', formatRupiah(tx.amount), true);
    addRow('Keterangan', tx.note || '-');

    doc.setDrawColor(220, 220, 220);
    doc.line(10, y + 1, 90, y + 1);
    y += 6;

    addRow('Saldo Awal', formatRupiah(tx.previousBalance));
    addRow('SALDO AKHIR', formatRupiah(tx.currentBalance), true);

    y += 4;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 110, 120);
    doc.text('Simpan bukti ini sebagai tanda terima sah.', 50, y, { align: 'center' });
    doc.text('Notifikasi WA otomatis dikirim ke Wali Murid.', 50, y + 3.5, { align: 'center' });

    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Petugas Bendahara,', 50, y, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(tx.officerName || school.treasurer, 50, y + 12, { align: 'center' });

    doc.save(`Kuitansi_${tx.type}_${student.nisn}_${tx.id}.pdf`);
  },
};
