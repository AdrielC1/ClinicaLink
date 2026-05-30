"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, Download, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";

// --- Helper untuk mengubah objek Date menjadi string teks murni YYYY-MM-DD ---
const toDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// --- Utility untuk membuat rentang tanggal ---
const generateMonthRanges = (monthsCount = 6) => {
  const ranges = [];
  const now = new Date();
  for (let i = 0; i < monthsCount; i++) {
    // Kita tetapkan tanggal 1 dan tanggal terakhir di bulan tersebut
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const formatOptions = { day: "2-digit", month: "long", year: "numeric" };
    const startStr = start.toLocaleDateString("id-ID", formatOptions);
    const endStr = end.toLocaleDateString("id-ID", formatOptions);

    ranges.push({
      label: `${startStr} - ${endStr}`,
      // PERBAIKAN: Kita simpan versi string absolut (contoh: "2026-05-01")
      startStrAbsolute: toDateString(start),
      endStrAbsolute: toDateString(end),
    });
  }
  return ranges;
};

// --- Komponen Pagination Dinamis ---
const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2 mt-4 pb-4">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-1 text-gray-500 hover:text-[#5E81CC] disabled:text-gray-300 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors ${
            currentPage === page
              ? "bg-[#5E81CC] text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="p-1 text-gray-500 hover:text-[#5E81CC] disabled:text-gray-300 transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default function AdminReportsPage() {
  const [appointments, setAppointments] = useState([]);
  const [patient, setPatient] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State Tanggal
  const dateRanges = useMemo(() => generateMonthRanges(), []);
  const [selectedRange, setSelectedRange] = useState(dateRanges[0]);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  // State Laporan & Modal
  const [selectedReport, setSelectedReport] = useState(null);

  // State Pagination Tabel Utama
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 1. Fetch Data dari API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [resAppointments, resPatients] = await Promise.all([
          fetch("/api/appointments", { cache: "no-store" }),
          fetch("/api/patient", { cache: "no-store" }), 
        ]);

        const appointmentJson = resAppointments.ok ? await resAppointments.json() : {};
        const patientJson = resPatients.ok ? await resPatients.json() : {};

        const arrAppointments = Array.isArray(appointmentJson.data) ? appointmentJson.data : [];
        const arrPatient = Array.isArray(patientJson.data) ? patientJson.data : [];

        setAppointments(arrAppointments);
        setPatient(arrPatient);
      } catch (error) {
        console.error("Error fetching data:", error);
        setAppointments([]);
        setPatient([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. Filter Data berdasarkan Periode Tanggal yang Dipilih
  const filteredData = useMemo(() => {
    // PERBAIKAN: Fungsi filter anti-timezone bug
    const isWithinRange = (rawDateString) => {
      if (!rawDateString) return false;
      
      // Mengambil hanya teks "YYYY-MM-DD" dari data Supabase (menghiraukan T00:00:00)
      const targetDateStr = rawDateString.includes("T") 
        ? rawDateString.split("T")[0] 
        : rawDateString.substring(0, 10);
      
      // Membandingkan teks secara langsung (contoh: "2026-05-15" >= "2026-05-01")
      return targetDateStr >= selectedRange.startStrAbsolute && targetDateStr <= selectedRange.endStrAbsolute;
    };

    const periodAppointments = appointments.filter((app) => isWithinRange(app.appointment_date));
    const periodPatient = patient.filter((pt) => isWithinRange(pt.created_at));

    const completed = periodAppointments.filter((app) => app.status === "Selesai");
    const cancelled = periodAppointments.filter(
      (app) => app.status === "Dibatalkan" || app.status === "Berhalangan hadir"
    );

    return {
      totalAppointments: periodAppointments,
      completedAppointments: completed,
      cancelledAppointments: cancelled,
      newPatient: periodPatient,
    };
  }, [appointments, patient, selectedRange]);

  // 3. Menyiapkan Data Card & Baris Tabel
  const reportSummary = [
    { key: "total", title: "Total Appointment", value: filteredData.totalAppointments.length, desc: "Appointment bulan ini" },
    { key: "completed", title: "Konsultasi Selesai", value: filteredData.completedAppointments.length, desc: "Konsultasi berhasil" },
    { key: "cancelled", title: "Appointment Dibatalkan", value: filteredData.cancelledAppointments.length, desc: "Dibatalkan pasien/sistem" },
    { key: "newPatient", title: "Pendaftaran Pasien Baru", value: filteredData.newPatient.length, desc: "Pasien terdaftar" },
  ];

  const reportCards = [
    reportSummary[0], // Total Appointment
    reportSummary[1], // Konsultasi Selesai
    reportSummary[2], // Dibatalkan
    reportSummary[3], // Pasien Baru
  ];

  const paginatedReports = reportSummary.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 4. Konfigurasi Modal Detail
  const modalConfig = {
    total: {
      title: "Detail Total Appointment",
      type: "appointment",
      rows: filteredData.totalAppointments,
    },
    cancelled: {
      title: "Detail Appointment Dibatalkan",
      type: "appointment",
      rows: filteredData.cancelledAppointments,
    },
    completed: {
      title: "Detail Konsultasi Selesai",
      type: "appointment",
      rows: filteredData.completedAppointments,
    },
    newPatient: {
      title: "Detail Pendaftaran Pasien Baru",
      type: "patient",
      rows: filteredData.newPatient,
    },
  };

  // 5. Fungsi Export CSV
  const downloadReportCSV = () => {
    const headers = ["Jenis Laporan", "Nama Pasien", "Dokter", "Tanggal", "Waktu", "Status", "No Telepon"];
    const rows = [headers];

    const pushToCSV = (type, dataList) => {
      dataList.forEach((item) => {
        const patientName = item.patient_name || item.full_name || "-";
        const doctorName = item.doctor_name || "-";
        const aptTime = item.start_time ? item.start_time.substring(0, 5) : "-";
        const dateStr = item.appointment_date || (item.created_at ? item.created_at.split('T')[0] : "-");

        rows.push([
          type,
          patientName,
          doctorName,
          dateStr,
          aptTime,
          item.status || "Aktif",
          item.phone_number || "-",
        ]);
      });
    };

    pushToCSV("Total Appointment", filteredData.totalAppointments);
    pushToCSV("Konsultasi Selesai", filteredData.completedAppointments);
    pushToCSV("Appointment Dibatalkan", filteredData.cancelledAppointments);
    pushToCSV("Pendaftaran Pasien Baru", filteredData.newPatient);

    const csvContent = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    const safeDateName = selectedRange.label.toLowerCase().replace(/ /g, "-");
    link.download = `laporan-clinicalink-${safeDateName}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="font-sans text-slate-800 pb-6 min-h-screen bg-[#F8FAFC]">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Laporan</h1>
          <p className="text-gray-500 text-sm">Ringkasan laporan aktivitas Clinicalink</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto relative">
          {/* Date Range Dropdown */}
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setDateDropdownOpen((open) => !open)}
              className="flex items-center justify-between w-full sm:w-64 gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg text-sm shadow-sm hover:bg-gray-50 transition-colors"
            >
              <span className="truncate">{selectedRange.label}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
            </button>

            {dateDropdownOpen && (
              <div className="absolute right-0 top-12 z-20 w-full sm:w-64 bg-white border border-gray-100 rounded-xl shadow-lg p-1">
                {dateRanges.map((range, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedRange(range);
                      setDateDropdownOpen(false);
                      setCurrentPage(1); 
                    }}
                    className={`block w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors rounded-lg ${
                      selectedRange.label === range.label
                        ? "bg-[#E6EDFF] text-[#5E81CC]"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={downloadReportCSV}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#5E81CC] text-white font-semibold rounded-lg text-sm shadow-md hover:bg-[#4A6BB0] transition-colors w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500 font-medium">Memuat data laporan...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="flex gap-4 mb-6 flex-wrap">
            {reportCards.map((card) => (
              <button
                key={card.key}
                onClick={() => setSelectedReport(card.key)}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex-grow sm:flex-grow flex flex-col items-center justify-center min-w-[200px]"
              >
                <span className="text-sm font-bold text-gray-600 mb-3 text-center">{card.title}</span>
                <span className="text-4xl font-bold text-gray-900">{card.value}</span>
              </button>
            ))}
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="p-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Laporan Detail</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#F3F6FB] text-gray-700 font-semibold text-xs border-y border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Laporan</th>
                    <th className="px-6 py-4 text-center">Jumlah</th>
                    <th className="px-6 py-4 text-center">Keterangan</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedReports.map((row) => (
                    <tr key={row.key} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{row.title}</td>
                      <td className="px-6 py-4 text-center font-semibold text-gray-700">{row.value}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{row.desc}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => setSelectedReport(row.key)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 shadow-sm"
                            title={`Lihat ${row.title}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedReports.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-6 text-gray-500">Tidak ada data untuk periode ini.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <Pagination 
              totalItems={reportSummary.length} 
              itemsPerPage={itemsPerPage} 
              currentPage={currentPage} 
              onPageChange={setCurrentPage} 
            />
          </div>
        </>
      )}

      {selectedReport && (
        <ReportDetailModal
          config={modalConfig[selectedReport]}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}

// --- Komponen Modal ---
function ReportDetailModal({ config, onClose }) {
  const [modalPage, setModalPage] = useState(1);
  const itemsPerPage = 5;

  const paginatedRows = config.rows.slice(
    (modalPage - 1) * itemsPerPage,
    modalPage * itemsPerPage
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-gray-900">{config.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-auto p-6 bg-slate-50 flex-1">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {config.type === "patient" ? (
              <PatientDetailTable rows={paginatedRows} pageOffset={(modalPage - 1) * itemsPerPage} />
            ) : (
              <AppointmentDetailTable rows={paginatedRows} pageOffset={(modalPage - 1) * itemsPerPage} />
            )}
            
            {config.rows.length === 0 && (
               <div className="text-center py-8 text-gray-500">Data tidak ditemukan.</div>
            )}
          </div>
          
          <div className="mt-4 bg-transparent">
            <Pagination 
              totalItems={config.rows.length} 
              itemsPerPage={itemsPerPage} 
              currentPage={modalPage} 
              onPageChange={setModalPage} 
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-gray-200 text-[#5E81CC] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Komponen Tabel Detail Appointment ---
function AppointmentDetailTable({ rows, pageOffset }) {
  const getStatusClass = (status) => {
    switch(status) {
      case "Selesai": return "bg-green-100 text-green-600 border-green-200";
      case "Berlangsung": return "bg-blue-100 text-blue-600 border-blue-200";
      case "Menunggu": return "bg-yellow-100 text-yellow-600 border-yellow-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  return (
    <table className="w-full text-sm text-left">
      <thead className="bg-[#F3F6FB] text-gray-700 font-semibold text-xs border-b border-gray-100">
        <tr>
          <th className="px-6 py-4 text-center w-12">No</th>
          <th className="px-6 py-4">Pasien</th>
          <th className="px-6 py-4">Dokter</th>
          <th className="px-6 py-4 text-center">Tanggal</th>
          <th className="px-6 py-4 text-center">Waktu</th>
          <th className="px-6 py-4 text-center">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row, index) => {
          const patientName = row.patient_name || "-";
          const doctorName = row.doctor_name || "-";
          const aptTime = row.start_time ? row.start_time.substring(0, 5).replace(":", ".") : "-";

          return (
            <tr key={row.id || index} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-center font-medium text-gray-500">{pageOffset + index + 1}</td>
              <td className="px-6 py-4 font-bold text-gray-900">{patientName}</td>
              <td className="px-6 py-4 font-semibold text-gray-700">{doctorName}</td>
              <td className="px-6 py-4 text-center text-gray-600">
                {row.appointment_date ? new Date(row.appointment_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
              </td>
              <td className="px-6 py-4 text-center text-gray-900 font-semibold">{aptTime} WIB</td>
              <td className="px-6 py-4 text-center">
                <span className={`inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-bold border ${getStatusClass(row.status)}`}>
                  {row.status}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// --- Komponen Tabel Detail Pasien ---
function PatientDetailTable({ rows, pageOffset }) {
  return (
    <table className="w-full text-sm text-left">
      <thead className="bg-[#F3F6FB] text-gray-700 font-semibold text-xs border-b border-gray-100">
        <tr>
          <th className="px-6 py-4 text-center w-12">No</th>
          <th className="px-6 py-4">Nama Pasien</th>
          <th className="px-6 py-4 text-center">Tanggal Daftar</th>
          <th className="px-6 py-4 text-center">No Telepon</th>
          <th className="px-6 py-4 text-center">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row, index) => {
          const patientName = row.full_name || "-";
          const regDate = row.created_at;

          return (
            <tr key={row.id || index} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-center font-medium text-gray-500">{pageOffset + index + 1}</td>
              <td className="px-6 py-4 font-bold text-gray-900">{patientName}</td>
              <td className="px-6 py-4 text-center text-gray-600">
                {regDate ? new Date(regDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
              </td>
              <td className="px-6 py-4 text-center text-gray-600">{row.phone_number || "-"}</td>
              <td className="px-6 py-4 text-center">
                <span className="inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-bold border bg-green-100 text-green-600 border-green-200">
                  Aktif
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}