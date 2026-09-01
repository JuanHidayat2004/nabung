import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Minus,
  FileText,
  Smartphone,
  KeyRound,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  Printer,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, SchoolProfile, WhatsAppConfig } from '../types';
import { StorageService } from '../services/storage';
import { formatRupiah, openWhatsAppDirect, generateMonthlySummaryWAMessage } from '../services/whatsapp';
import { ReportService } from '../services/reports';

interface StudentManagerProps {
  students: Student[];
  onRefresh: () => void;
  onQuickTransaction: (studentId: string, type: 'deposit' | 'withdraw') => void;
  school: SchoolProfile;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  onRefresh,
  onQuickTransaction,
  school,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal Form States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [passwordResetStudent, setPasswordResetStudent] = useState<Student | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // New / Edit Student Form
  const [formNisn, setFormNisn] = useState('');
  const [formNis, setFormNis] = useState('');
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<'L' | 'P'>('L');
  const [formClassId, setFormClassId] = useState('1');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formInitialBalance, setFormInitialBalance] = useState(0);
  const [formTargetAmount, setFormTargetAmount] = useState(500000);
  const [formTargetLabel, setFormTargetLabel] = useState('Perlengkapan Sekolah');
  const [formAddress, setFormAddress] = useState('Jurit Baru');

  const waConfig = StorageService.getWAConfig();

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchClass = selectedClass === 'all' || s.classId === selectedClass || s.className === selectedClass;
    const matchSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery) ||
      s.nis.includes(searchQuery) ||
      s.parentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSearch;
  });

  const totalFilteredBalance = filteredStudents.reduce((acc, c) => acc + c.balance, 0);

  const handleOpenAddModal = () => {
    setFormNisn(`013${Math.floor(1000000 + Math.random() * 9000000)}`);
    setFormNis(`${Math.floor(1000 + Math.random() * 9000)}`);
    setFormName('');
    setFormGender('L');
    setFormClassId('1');
    setFormParentName('');
    setFormParentPhone('');
    setFormInitialBalance(10000);
    setFormTargetAmount(500000);
    setFormTargetLabel('Kebutuhan Sekolah');
    setFormAddress('Desa Jurit Baru');
    setEditingStudent(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormNisn(student.nisn);
    setFormNis(student.nis);
    setFormName(student.name);
    setFormGender(student.gender);
    setFormClassId(student.classId);
    setFormParentName(student.parentName);
    setFormParentPhone(student.parentPhone);
    setFormInitialBalance(student.balance);
    setFormTargetAmount(student.savingGoal?.target || 500000);
    setFormTargetLabel(student.savingGoal?.label || 'Perlengkapan Sekolah');
    setFormAddress(student.address || 'Desa Jurit Baru');
    setIsAddModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formNisn.trim()) return;

    if (editingStudent) {
      const updated: Student = {
        ...editingStudent,
        nisn: formNisn,
        nis: formNis,
        name: formName,
        gender: formGender,
        classId: formClassId,
        className: `Kelas ${formClassId}`,
        parentName: formParentName,
        parentPhone: formParentPhone,
        balance: formInitialBalance,
        savingGoal: {
          target: formTargetAmount,
          label: formTargetLabel,
          active: formTargetAmount > 0,
        },
        address: formAddress,
      };
      StorageService.updateStudent(updated);
    } else {
      const newStudent: Student = {
        id: `std-${Date.now()}`,
        nisn: formNisn,
        nis: formNis,
        name: formName,
        gender: formGender,
        classId: formClassId,
        className: `Kelas ${formClassId}`,
        parentName: formParentName,
        parentPhone: formParentPhone,
        password: '123456', // default password
        balance: formInitialBalance,
        savingGoal: {
          target: formTargetAmount,
          label: formTargetLabel,
          active: formTargetAmount > 0,
        },
        address: formAddress,
        joinedDate: new Date().toISOString().split('T')[0],
        status: 'active',
      };
      StorageService.updateStudent(newStudent);
    }

    setIsAddModalOpen(false);
    onRefresh();
  };

  const handleDeleteStudent = (student: Student) => {
    if (confirm(`Yakin ingin menghapus data siswa: ${student.name} (${student.className})?`)) {
      StorageService.deleteStudent(student.id);
      onRefresh();
    }
  };

  const handleSendWAInfo = (student: Student) => {
    if (!student.parentPhone) {
      alert('Nomor WhatsApp orang tua belum diisi untuk siswa ini.');
      return;
    }

    const today = new Date();
    const monthName = today.toLocaleDateString('id-ID', { month: 'long' });
    const msg = `*INFORMASI TABUNGAN SISWA*
🏫 *${school.name}*
━━━━━━━━━━━━━━━━━━━━
Yth. Bapak/Ibu ${student.parentName}
Wali dari ananda:
👤 *Nama Siswa*: ${student.name}
🆔 *NISN / No. Induk*: ${student.nisn} / ${student.nis}
🏫 *Kelas*: ${student.className}
━━━━━━━━━━━━━━━━━━━━
💎 *SALDO TABUNGAN SAAT INI*:
👉 *${formatRupiah(student.balance)}*
━━━━━━━━━━━━━━━━━━━━
${student.savingGoal?.active ? `🎯 *Target Tabungan*: ${student.savingGoal.label} (${Math.min(100, Math.round((student.balance / student.savingGoal.target) * 100))}% dari ${formatRupiah(student.savingGoal.target)})\n━━━━━━━━━━━━━━━━━━━━\n` : ''}Untuk memantau buku mutasi lengkap, Bapak/Ibu dapat masuk ke Portal Tabungan Wali Murid dengan:
• *Nama / NISN*: ${student.nisn}
• *Password Awal*: ${student.password || '123456'}

Salam Hormat,
*${school.treasurer}*
Bendahara Kas Tabungan ${school.name}`;

    openWhatsAppDirect(student.parentPhone, msg);
  };

  const handlePrintPassbook = (student: Student) => {
    const transactions = StorageService.getTransactions();
    ReportService.generateStudentPassbookPDF(student, transactions, school);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetStudent || !newPasswordValue.trim()) {
      alert('Silakan masukkan password baru.');
      return;
    }

    const updated = { ...passwordResetStudent, password: newPasswordValue.trim() };
    StorageService.updateStudent(updated);
    setPasswordResetStudent(null);
    setNewPasswordValue('');
    onRefresh();
    alert(`Password akun wali/siswa ananda ${updated.name} berhasil diperbarui.`);
  };

  const handleClearDemoData = () => {
    const isConfirmed = window.confirm(
      'Apakah Anda ingin mengosongkan seluruh data contoh (siswa & mutasi transaksi) agar buku kas tabungan bersih dan siap diisi data siswa riil SDN 5 JURIT BARU?'
    );
    if (isConfirmed) {
      StorageService.saveStudents([]);
      StorageService.saveTransactions([]);
      onRefresh();
      alert('Data contoh berhasil dikosongkan. Sekarang Anda dapat menambah siswa riil atau mengimpor file Excel!');
    }
  };

  const handleExportStudentsExcel = () => {
    const rows = filteredStudents.map((s, idx) => ({
      No: idx + 1,
      NISN: s.nisn,
      NIS: s.nis,
      'Nama Siswa': s.name,
      'Jenis Kelamin': s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      Kelas: s.className,
      'Nama Orang Tua / Wali': s.parentName,
      'No WhatsApp Wali': s.parentPhone,
      'Saldo Saat Ini (Rp)': s.balance,
      'Target Tabungan': s.savingGoal?.target ? `${s.savingGoal.label} (${s.savingGoal.target})` : '-',
      Alamat: s.address || 'Jurit Baru',
      'Password Akun': s.password || '123456',
      Status: s.status,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Siswa');
    XLSX.writeFile(wb, `Data_Siswa_Tabungan_SDN5JuritBaru_${selectedClass}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];

        if (rawData.length > 0) {
          const currentStudents = StorageService.getStudents();
          let addedCount = 0;

          rawData.forEach((row, index) => {
            const nisn = String(row['NISN'] || row['nisn'] || `013${Date.now() + index}`);
            const name = String(row['Nama Siswa'] || row['nama'] || row['Name'] || '');
            if (name) {
              const existingIdx = currentStudents.findIndex((s) => s.nisn === nisn || s.name === name);
              const studentObj: Student = {
                id: existingIdx >= 0 ? currentStudents[existingIdx].id : `std-${Date.now()}-${index}`,
                nisn: nisn,
                nis: String(row['NIS'] || row['nis'] || `${1000 + index}`),
                name: name,
                gender: String(row['Jenis Kelamin'] || row['L/P'] || 'L').toUpperCase().startsWith('P') ? 'P' : 'L',
                classId: String(row['Kelas'] || '1').replace(/[^0-9]/g, '') || '1',
                className: `Kelas ${String(row['Kelas'] || '1').replace(/[^0-9]/g, '') || '1'}`,
                parentName: String(row['Nama Orang Tua / Wali'] || row['Wali'] || 'Orang Tua Siswa'),
                parentPhone: String(row['No WhatsApp Wali'] || row['WA'] || ''),
                password: String(row['Password Akun'] || '123456'),
                balance: Number(row['Saldo Saat Ini (Rp)'] || row['Saldo'] || 0),
                address: String(row['Alamat'] || 'Desa Jurit Baru'),
                joinedDate: new Date().toISOString().split('T')[0],
                status: 'active',
              };

              if (existingIdx >= 0) {
                currentStudents[existingIdx] = studentObj;
              } else {
                currentStudents.push(studentObj);
                addedCount++;
              }
            }
          });

          StorageService.saveStudents(currentStudents);
          onRefresh();
          alert(`Berhasil mengimpor data! ${addedCount} siswa baru ditambahkan.`);
        }
      } catch (err) {
        alert('Gagal membaca file Excel. Pastikan format file .xlsx / .csv sesuai.');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-5">
      {/* Header Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-700" />
            <span>Manajemen Data Siswa Penabung (Kelas 1 - 6)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {students.length} siswa terdaftar • Total Saldo Keseluruhan: <span className="font-bold text-emerald-800">{formatRupiah(totalFilteredBalance)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Siswa Baru</span>
          </button>

          <button
            onClick={handleExportStudentsExcel}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Unduh Data Siswa ke Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Import Excel</span>
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportExcel} className="hidden" />
          </label>

          {students.length > 0 && (
            <button
              onClick={handleClearDemoData}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Kosongkan Data Contoh untuk Memulai Pencatatan Kas Riil"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Data Contoh</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs by Class */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {['all', '1', '2', '3', '4', '5', '6'].map((cls) => {
          const count = cls === 'all' ? students.length : students.filter((s) => s.classId === cls).length;
          return (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedClass === cls
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cls === 'all' ? 'Semua Kelas' : `Kelas ${cls}`} ({count})
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari berdasarkan nama siswa, NISN, NIS, atau nama orang tua..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      {/* Students Table for Desktop & Card View for Mobile */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Siswa & Identitas</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Orang Tua / No. WA</th>
                <th className="py-3 px-4 text-right">Saldo Tabungan</th>
                <th className="py-3 px-4">Target Tabungan</th>
                <th className="py-3 px-4 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada data siswa yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const targetPct =
                    student.savingGoal?.active && student.savingGoal.target > 0
                      ? Math.min(100, Math.round((student.balance / student.savingGoal.target) * 100))
                      : 0;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{student.name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                              student.gender === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                            }`}
                          >
                            {student.gender}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          NISN: {student.nisn} • NIS: {student.nis}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
                          {student.className}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{student.parentName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{student.parentPhone || 'Belum diatur'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-slate-900 text-sm text-emerald-900 tabular-nums">
                          {formatRupiah(student.balance)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Pass: <code className="bg-slate-100 px-1 rounded font-mono">{student.password || '123456'}</code>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {student.savingGoal?.active ? (
                          <div>
                            <div className="flex justify-between text-[11px] font-medium text-slate-700 mb-0.5">
                              <span className="truncate max-w-[120px]">{student.savingGoal.label}</span>
                              <span className="font-bold text-emerald-800 tabular-nums">{targetPct}%</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-800 h-full rounded-full transition-all"
                                style={{ width: `${targetPct}%` }}
                              ></div>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                              Target: {formatRupiah(student.savingGoal.target)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Setor Cepat */}
                          <button
                            onClick={() => onQuickTransaction(student.id, 'deposit')}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                            title="Setor Tabungan"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Tarik Cepat */}
                          <button
                            onClick={() => onQuickTransaction(student.id, 'withdraw')}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                            title="Tarik Tabungan"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          {/* Kirim Info WA */}
                          <button
                            onClick={() => handleSendWAInfo(student)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                            title="Kirim Info Saldo ke WhatsApp Wali"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                          </button>

                          {/* Cetak Buku Tabungan PDF */}
                          <button
                            onClick={() => handlePrintPassbook(student)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title="Cetak Buku Mutasi Tabungan (PDF)"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setPasswordResetStudent(student);
                              setNewPasswordValue('');
                            }}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                            title="Ubah Password Akun Siswa/Wali"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Siswa */}
                          <button
                            onClick={() => handleOpenEditModal(student)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                            title="Edit Data Siswa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Siswa */}
                          <button
                            onClick={() => handleDeleteStudent(student)}
                            className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Mobile Responsive Cards View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredStudents.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Tidak ada data siswa yang ditemukan.
            </div>
          ) : (
            filteredStudents.map((student, idx) => (
              <div key={student.id} className="p-3.5 flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>{idx + 1}. {student.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          student.gender === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                        }`}
                      >
                        {student.gender}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      NISN: {student.nisn} • {student.className}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-emerald-800 text-sm tabular-nums">
                      {formatRupiah(student.balance)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Pass: <code className="bg-slate-100 px-1 rounded font-mono">{student.password || '123456'}</code>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="truncate">
                    <span className="text-slate-500 text-[11px]">Wali: </span>
                    <strong className="text-slate-800 font-semibold">{student.parentName || '-'}</strong>
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center gap-1 shrink-0 font-mono">
                    <Smartphone className="w-3 h-3 text-emerald-700" />
                    <span>{student.parentPhone || '-'}</span>
                  </div>
                </div>

                {/* Mobile Action Buttons Bar */}
                <div className="flex items-center justify-between gap-1 pt-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onQuickTransaction(student.id, 'deposit')}
                      className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-200 text-xs flex items-center gap-1 active:bg-emerald-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Setor</span>
                    </button>
                    <button
                      onClick={() => onQuickTransaction(student.id, 'withdraw')}
                      className="px-2.5 py-1.5 bg-rose-50 text-rose-800 font-bold rounded-lg border border-rose-200 text-xs flex items-center gap-1 active:bg-rose-100"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>Tarik</span>
                    </button>
                    <button
                      onClick={() => handleSendWAInfo(student)}
                      className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200"
                      title="Kirim WA"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-700" />
                    </button>
                    <button
                      onClick={() => handlePrintPassbook(student)}
                      className="p-1.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200"
                      title="Cetak PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setPasswordResetStudent(student);
                        setNewPasswordValue('');
                      }}
                      className="p-1.5 bg-amber-50 text-amber-800 rounded-lg border border-amber-200"
                      title="Reset Password"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(student)}
                      className="p-1.5 bg-blue-50 text-blue-800 rounded-lg border border-blue-200"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStudent(student)}
                      className="p-1.5 bg-slate-100 text-rose-600 rounded-lg"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Add / Edit Student */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
              <h3 className="text-base font-bold">
                {editingStudent ? 'Edit Data Siswa Penabung' : 'Tambah Siswa Penabung Baru'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-5 sm:p-6 overflow-y-auto space-y-3.5 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NISN (Nomor Induk Siswa Nasional)</label>
                  <input
                    type="text"
                    value={formNisn}
                    onChange={(e) => setFormNisn(e.target.value)}
                    required
                    placeholder="0123456789"
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIS Sekolah</label>
                  <input
                    type="text"
                    value={formNis}
                    onChange={(e) => setFormNis(e.target.value)}
                    placeholder="1021"
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="Contoh: Muhammad Faiz Al-Ghifari"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as 'L' | 'P')}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white"
                  >
                    <option value="1">Kelas 1</option>
                    <option value="2">Kelas 2</option>
                    <option value="3">Kelas 3</option>
                    <option value="4">Kelas 4</option>
                    <option value="5">Kelas 5</option>
                    <option value="6">Kelas 6</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Orang Tua / Wali</label>
                  <input
                    type="text"
                    value={formParentName}
                    onChange={(e) => setFormParentName(e.target.value)}
                    placeholder="Contoh: Ahmad Zulkifli (Ayah)"
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp Orang Tua</label>
                  <input
                    type="text"
                    value={formParentPhone}
                    onChange={(e) => setFormParentPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {editingStudent ? 'Saldo Tabungan Saat Ini' : 'Saldo Awal Tabungan (Rp)'}
                  </label>
                  <input
                    type="number"
                    value={formInitialBalance}
                    onChange={(e) => setFormInitialBalance(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dusun / Alamat</label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Dusun Joben, Jurit Baru"
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Target Tabungan Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Target Impian Tabungan (Opsional)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nama Target (cth: Sepatu Baru)"
                    value={formTargetLabel}
                    onChange={(e) => setFormTargetLabel(e.target.value)}
                    className="py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white"
                  />
                  <input
                    type="number"
                    placeholder="Nominal Target (Rp)"
                    value={formTargetAmount || ''}
                    onChange={(e) => setFormTargetAmount(Number(e.target.value))}
                    className="py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
                >
                  {editingStudent ? 'Simpan Perubahan Siswa' : 'Simpan Siswa Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {passwordResetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 px-5 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Ubah Password Akun Siswa</span>
              </h3>
              <button
                onClick={() => setPasswordResetStudent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-5 space-y-3 text-xs">
              <p className="text-slate-600">
                Ubah password login untuk akun siswa/wali dari ananda:
                <br />
                <strong className="text-slate-900 text-sm">{passwordResetStudent.name}</strong> ({passwordResetStudent.className})
              </p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password Baru</label>
                <input
                  type="text"
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  required
                  placeholder="Contoh: 123456 atau juritbaru"
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Simpan Password Baru
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
