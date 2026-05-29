"use client";

import { useState } from "react";
import {
  ChevronDown,
  Download,
  Eye,
  X,
} from "lucide-react";

const reportCards = [
  {
    key: "total",
    title: "Total Janji Temu",
    value: "4",
  },
  {
    key: "cancelled",
    title: "Janji Temu Dibatalkan",
    value: "1",
  },
  {
    key: "completed",
    title: "Konsultasi Selesai",
    value: "1",
  },
  {
    key: "newPatients",
    title: "Pendaftaran Pasien Baru",
    value: "1",
  },
];

const totalAppointments = [
  { no: 1, patient: "Mila", doctor: "Dr. Emily", date: "12 Mei 2030", time: "09.00 - 09.30 WIB", status: "Selesai" },
  { no: 2, patient: "Kimmy", doctor: "Dr. Emily", date: "12 Mei 2030", time: "10.00 - 10.30 WIB", status: "Berlangsung" },
  { no: 3, patient: "Sila", doctor: "Dr. Emily", date: "12 Mei 2030", time: "12.00 - 12.30 WIB", status: "Menunggu" },
  { no: 4, patient: "Nina", doctor: "Dr. Jatmiko", date: "14 Mei 2030", time: "10.00 - 10.30 WIB", status: "Menunggu" },
];

const completedAppointments = [
  { no: 1, patient: "Mila", doctor: "Dr. Emily", date: "12 Mei 2030", time: "09.00 - 09.30 WIB", status: "Selesai" },
];

const cancelledAppointments = [
  { no: 1, patient: "Sila", doctor: "Dr. Emily", date: "12 Mei 2030", time: "09.00 - 09.30 WIB", status: "Berhalangan hadir" },
];

const newPatients = [
  { no: 1, patient: "Nina", date: "14 Mei 2030", phone: "08xxxxxxxxxx", status: "Aktif" },
];

const reportRows = [
  { key: "total", title: "Total janji temu", value: "4" },
  { key: "cancelled", title: "Janji temu dibatalkan", value: "1" },
  { key: "completed", title: "Konsultasi selesai", value: "1" },
  { key: "newPatients", title: "Pendaftaran pasien baru", value: "1" },
  { key: "completed", title: "Konsultasi selesai minggu ini", value: "1" },
  { key: "total", title: "Janji temu aktif", value: "3" },
  { key: "total", title: "Janji temu minggu ini", value: "4" },
  { key: "cancelled", title: "Pembatalan pasien", value: "1" },
  { key: "completed", title: "Konsultasi dokter Emily", value: "1" },
  { key: "newPatients", title: "Pasien baru bulan ini", value: "1" },
  { key: "total", title: "Janji temu Dr. Jatmiko", value: "1" },
  { key: "completed", title: "Konsultasi selesai bulan ini", value: "1" },
  { key: "cancelled", title: "Janji temu gagal hadir", value: "1" },
  { key: "newPatients", title: "Pendaftaran aktif", value: "1" },
  { key: "total", title: "Total jadwal terisi", value: "4" },
];

const modalConfig = {
  total: {
    title: "Detail Total Janji Temu",
    type: "appointment",
    rows: totalAppointments,
  },
  cancelled: {
    title: "Janji Temu Dibatalkan",
    type: "appointment",
    rows: cancelledAppointments,
  },
  completed: {
    title: "Detail Konsultasi Selesai",
    type: "appointment",
    rows: completedAppointments,
  },
  newPatients: {
    title: "Detail Pendaftaran Pasien Baru",
    type: "patient",
    rows: newPatients,
  },
};

const appointmentStatusClass = {
  Selesai: "bg-green-100 text-green-600 border-green-200",
  Berlangsung: "bg-blue-100 text-blue-600 border-blue-200",
  Menunggu: "bg-yellow-100 text-yellow-600 border-yellow-200",
};

const dateRanges = [
  "01 Mei 2030 - 31 Mei 2030",
  "01 April 2030 - 30 April 2030",
  "01 Maret 2030 - 31 Maret 2030",
];

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState(dateRanges[0]);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const downloadReport = () => {
    const rows = [
      ["Jenis", "Pasien", "Dokter", "Tanggal", "Waktu", "Status", "No Telepon"],
      ...totalAppointments.map((item) => [
        "Total Janji Temu",
        item.patient,
        item.doctor,
        item.date,
        item.time,
        item.status,
        "",
      ]),
      ...cancelledAppointments.map((item) => [
        "Janji Temu Dibatalkan",
        item.patient,
        item.doctor,
        item.date,
        item.time,
        item.status,
        "",
      ]),
      ...completedAppointments.map((item) => [
        "Konsultasi Selesai",
        item.patient,
        item.doctor,
        item.date,
        item.time,
        item.status,
        "",
      ]),
      ...newPatients.map((item) => [
        "Pendaftaran Pasien Baru",
        item.patient,
        "",
        item.date,
        "",
        item.status,
        item.phone,
      ]),
    ];

    const escapeHtml = (value) =>
      String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    const tableRows = rows
      .map((row, rowIndex) => {
        const tag = rowIndex === 0 ? "th" : "td";
        return `<tr>${row.map((cell) => `<${tag}>${escapeHtml(cell)}</${tag}>`).join("")}</tr>`;
      })
      .join("");
    const worksheet = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; font-family: 'Nunito', sans-serif; font-size: 12px; }
            th { background: #eef3fb; font-weight: bold; text-align: left; }
            th, td { border: 1px solid #d9e2f1; padding: 8px 12px; white-space: nowrap; }
            td:nth-child(6) { font-weight: bold; }
          </style>
        </head>
        <body>
          <table>${tableRows}</table>
        </body>
      </html>`;
    const blob = new Blob([worksheet], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `laporan-clinicalink-${selectedDateRange.toLowerCase().replaceAll(" ", "-")}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="font-sans text-slate-800 pb-6">
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
              className="flex items-center justify-between w-full sm:w-56 gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg text-sm shadow-sm hover:bg-gray-50 transition-colors"
            >
              <span className="truncate">{selectedDateRange}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
            </button>

            {dateDropdownOpen && (
              <div className="absolute right-0 top-12 z-20 w-full sm:w-56 bg-white border border-gray-100 rounded-xl shadow-lg p-1">
                {dateRanges.map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setSelectedDateRange(range);
                      setDateDropdownOpen(false);
                    }}
                    className={`block w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors rounded-lg ${
                      selectedDateRange === range ? "bg-[#E6EDFF] text-[#5E81CC]" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={downloadReport}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#5E81CC] text-white font-semibold rounded-lg text-sm shadow-md hover:bg-[#4A6BB0] transition-colors w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {reportCards.map((card) => (
          <button
            key={card.key}
            onClick={() => setSelectedReport(card.key)}
            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex-grow sm:flex-grow-0 flex flex-col items-center justify-center min-w-[180px]"
          >
            <span className="text-sm font-bold text-gray-600 mb-2 text-center">{card.title}</span>
            <span className="text-2xl font-bold text-gray-900">{card.value}</span>
          </button>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden pb-4 mb-6">
        <div className="p-6 pb-4">
          <h2 className="text-lg font-bold text-gray-900">Rincian Laporan</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F3F6FB] text-gray-700 font-semibold text-xs border-y border-gray-100">
              <tr>
                <th className="px-6 py-4 text-center w-12">No</th>
                <th className="px-6 py-4">Jenis Laporan</th>
                <th className="px-6 py-4 text-center">Jumlah</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportRows.map((row, index) => (
                <tr key={`${row.key}-${row.title}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-center font-medium text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{row.title}</td>
                  <td className="px-6 py-4 text-center text-gray-700">{row.value}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => setSelectedReport(row.key)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title={`Lihat ${row.title}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReport && (
        <ReportDetailModal
          config={modalConfig[selectedReport]}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}

function ReportDetailModal({ config, onClose }) {
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
              <PatientDetailTable rows={config.rows} />
            ) : (
              <AppointmentDetailTable rows={config.rows} />
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function AppointmentDetailTable({ rows }) {
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
        {rows.map((row, index) => (
          <tr key={`${row.patient}-${row.time}-${index}`} className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center font-medium text-gray-500">{row.no}</td>
            <td className="px-6 py-4 font-bold text-gray-900">{row.patient}</td>
            <td className="px-6 py-4 font-semibold text-gray-700">{row.doctor}</td>
            <td className="px-6 py-4 text-center text-gray-600">{row.date}</td>
            <td className="px-6 py-4 text-center text-[#5E81CC] font-bold">{row.time}</td>
            <td className="px-6 py-4 text-center">
              {appointmentStatusClass[row.status] ? (
                <span className={`inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-bold border ${appointmentStatusClass[row.status]}`}>
                  {row.status}
                </span>
              ) : (
                <span className="inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-bold border bg-gray-100 text-gray-600 border-gray-200">
                  {row.status}
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PatientDetailTable({ rows }) {
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
        {rows.map((row, index) => (
          <tr key={`${row.patient}-${index}`} className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 text-center font-medium text-gray-500">{row.no}</td>
            <td className="px-6 py-4 font-bold text-gray-900">{row.patient}</td>
            <td className="px-6 py-4 text-center text-gray-600">{row.date}</td>
            <td className="px-6 py-4 text-center text-gray-600">{row.phone}</td>
            <td className="px-6 py-4 text-center">
              <span className="inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-bold border bg-green-100 text-green-600 border-green-200">
                {row.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
