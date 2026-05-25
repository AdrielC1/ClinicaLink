"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
} from "lucide-react";

const reportCards = [
  {
    key: "total",
    title: "Total Appointment",
    value: "4",
  },
  {
    key: "cancelled",
    title: "Appointment Dibatalkan",
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
  { no: 1, patient: "Kimmy", doctor: "Dr. Emily", date: "12 Mei 2030", time: "10.00 - 10.30 WIB", status: "Berlangsung" },
  { no: 1, patient: "Sila", doctor: "Dr. Emily", date: "12 Mei 2030", time: "12.00 - 12.30 WIB", status: "Menunggu" },
  { no: 1, patient: "Nina", doctor: "Dr. Jatmiko", date: "14 Mei 2030", time: "10.00 - 10.30 WIB", status: "Menunggu" },
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
  { key: "total", title: "Total appointment", value: "4" },
  { key: "cancelled", title: "Appointment dibatalkan", value: "1" },
  { key: "completed", title: "Konsultasi selesai", value: "1" },
  { key: "newPatients", title: "Pendaftaran pasien baru", value: "1" },
  { key: "completed", title: "Konsultasi selesai minggu ini", value: "1" },
  { key: "total", title: "Appointment aktif", value: "3" },
  { key: "total", title: "Appointment minggu ini", value: "4" },
  { key: "cancelled", title: "Pembatalan pasien", value: "1" },
  { key: "completed", title: "Konsultasi dokter Emily", value: "1" },
  { key: "newPatients", title: "Pasien baru bulan ini", value: "1" },
  { key: "total", title: "Appointment Dr. Jatmiko", value: "1" },
  { key: "completed", title: "Konsultasi selesai bulan ini", value: "1" },
  { key: "cancelled", title: "Appointment gagal hadir", value: "1" },
  { key: "newPatients", title: "Pendaftaran aktif", value: "1" },
  { key: "total", title: "Total jadwal terisi", value: "4" },
];

const modalConfig = {
  total: {
    title: "Detail total Appointment",
    type: "appointment",
    rows: totalAppointments,
  },
  cancelled: {
    title: "Appointment Dibatalkan",
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
  Selesai: "bg-[#DDFBDA] text-[#05B705]",
  Berlangsung: "bg-[#DDE8FF] text-[#5E81CC]",
  Menunggu: "bg-[#FFF0CF] text-[#FFB83D]",
};

const dateRanges = [
  "01 Mei 2030 - 31 Mei 2030",
  "01 April 2030 - 30 April 2030",
  "01 Maret 2030 - 31 Maret 2030",
];

const itemsPerPage = 5;

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState(dateRanges[0]);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(reportRows.length / itemsPerPage);
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return reportRows.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage]);

  const downloadReport = () => {
    const rows = [
      ["Jenis", "Pasien", "Dokter", "Tanggal", "Waktu", "Status", "No Telepon"],
      ...totalAppointments.map((item) => [
        "Total Appointment",
        item.patient,
        item.doctor,
        item.date,
        item.time,
        item.status,
        "",
      ]),
      ...cancelledAppointments.map((item) => [
        "Appointment Dibatalkan",
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
            table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
            th { background: #eef3fb; font-weight: 700; text-align: left; }
            th, td { border: 1px solid #d9e2f1; padding: 8px 12px; white-space: nowrap; }
            td:nth-child(6) { font-weight: 700; }
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
    <section className="min-h-full border border-[#D8EDF4] bg-[#F0FBFF] px-4 py-6 sm:px-6 lg:px-10 xl:px-[48px]">
      <div className="mx-auto w-full max-w-[980px]">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <header>
            <h1 className="text-[24px] font-extrabold leading-tight text-black sm:text-[26px]">Laporan</h1>
            <p className="mt-4 text-[15px] font-bold leading-snug text-[#646464] sm:text-[16px]">
              Ringkasan laporan aktivitas Clinicalink
            </p>
          </header>

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <div className="relative">
              <button
                onClick={() => setDateDropdownOpen((open) => !open)}
                className="flex h-[34px] w-full items-center justify-center gap-2 rounded-[6px] border border-[#5E81CC] bg-white px-4 text-[14px] font-extrabold text-[#314F8A] shadow-[0_2px_5px_rgba(15,23,42,0.20)] sm:w-[226px]"
              >
                <span className="truncate">{selectedDateRange}</span>
                <ChevronDown className="h-4 w-4 shrink-0" />
              </button>

              {dateDropdownOpen && (
                <div className="absolute right-0 top-[38px] z-20 w-full overflow-hidden rounded-[6px] border border-[#D6D6D6] bg-white shadow-lg sm:w-[226px]">
                  {dateRanges.map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        setSelectedDateRange(range);
                        setDateDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`block w-full px-4 py-2.5 text-left text-[13px] font-extrabold hover:bg-[#F0FBFF] ${
                        selectedDateRange === range ? "text-[#5E81CC]" : "text-black"
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
              className="flex h-[34px] w-full items-center justify-center gap-8 rounded-[6px] bg-[#355693] px-7 text-[14px] font-extrabold text-white shadow-[0_2px_5px_rgba(15,23,42,0.22)] transition-colors hover:bg-[#2D4B84] sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {reportCards.map((card) => (
            <button
              key={card.key}
              onClick={() => setSelectedReport(card.key)}
              className="flex min-h-[128px] flex-col items-center justify-center rounded-[8px] bg-white px-4 text-center shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <p className="text-[16px] font-extrabold leading-tight text-black">{card.title}</p>
              <p className="mt-7 text-[24px] font-extrabold leading-none text-black">{card.value}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-[10px] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead>
                <tr className="bg-[#EEF3FB] text-[12px] font-extrabold text-black">
                  <th className="w-[82px] px-6 py-4 text-center">No</th>
                  <th className="px-4 py-4">Jenis Laporan</th>
                  <th className="px-4 py-4 text-center">Jumlah</th>
                  <th className="px-4 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, index) => (
                  <tr key={`${row.key}-${row.title}`} className="border-b border-[#E4E4E4] text-[12px] font-extrabold text-black last:border-b">
                    <td className="px-6 py-4 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-4 py-4">{row.title}</td>
                    <td className="px-4 py-4 text-center">{row.value}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => setSelectedReport(row.key)}
                          className="rounded-[6px] bg-[#F3F4F6] p-1.5 text-black transition-colors hover:bg-[#E5E7EB]"
                          aria-label={`Lihat ${row.title}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-center gap-7 py-8">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="text-[#8A8A8A] disabled:opacity-30"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            {Array.from({ length: totalPages }).map((_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-5 w-5 items-center justify-center rounded-[6px] text-[12px] font-extrabold leading-none ${
                    currentPage === page ? "bg-[#5E81CC] text-white" : "text-black"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="text-[#8A8A8A] disabled:opacity-30"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {selectedReport && (
        <ReportDetailModal
          config={modalConfig[selectedReport]}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </section>
  );
}

function ReportDetailModal({ config, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex min-h-[444px] w-full max-w-[900px] flex-col rounded-[6px] bg-white px-5 py-7 sm:px-8 lg:px-[42px]">
        <h2 className="mb-6 text-[18px] font-extrabold text-black sm:text-[20px]">{config.title}</h2>

        <div className="overflow-x-auto">
          {config.type === "patient" ? (
            <PatientDetailTable rows={config.rows} />
          ) : (
            <AppointmentDetailTable rows={config.rows} />
          )}
        </div>

        <div className="mt-auto flex justify-center pt-10">
          <button
            onClick={onClose}
            className="h-[36px] w-full max-w-[184px] rounded-[6px] border border-[#5E81CC] text-[16px] font-extrabold text-[#5E81CC] transition-colors hover:bg-[#F0FBFF]"
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
    <table className="w-full min-w-[700px] border-collapse text-left">
      <thead>
        <tr className="bg-[#EEF3FB] text-[13px] font-extrabold text-black">
          <th className="w-[70px] px-5 py-3 text-center">No</th>
          <th className="px-4 py-3">Pasien</th>
          <th className="px-4 py-3">Dokter</th>
          <th className="px-4 py-3">Tanggal</th>
          <th className="px-4 py-3">Waktu</th>
          <th className="px-4 py-3">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row.patient}-${row.time}-${index}`} className="text-[13px] font-extrabold text-black">
            <td className="px-5 py-4 text-center">{row.no}</td>
            <td className="px-4 py-4">{row.patient}</td>
            <td className="px-4 py-4">{row.doctor}</td>
            <td className="px-4 py-4">{row.date}</td>
            <td className="px-4 py-4">{row.time}</td>
            <td className="px-4 py-4">
              {appointmentStatusClass[row.status] ? (
                <span className={`rounded-[6px] px-3 py-1 text-[13px] font-extrabold leading-none ${appointmentStatusClass[row.status]}`}>
                  {row.status}
                </span>
              ) : (
                row.status
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
    <table className="w-full min-w-[570px] border-collapse text-left">
      <thead>
        <tr className="bg-[#EEF3FB] text-[13px] font-extrabold text-black">
          <th className="w-[70px] px-5 py-3 text-center">No</th>
          <th className="px-4 py-3">Nama Pasien</th>
          <th className="px-4 py-3">Tanggal daftar</th>
          <th className="px-4 py-3">No Telepon</th>
          <th className="px-4 py-3">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.patient} className="border-b border-black text-[13px] font-extrabold text-black">
            <td className="px-5 py-4 text-center">{row.no}</td>
            <td className="px-4 py-4">{row.patient}</td>
            <td className="px-4 py-4">{row.date}</td>
            <td className="px-4 py-4">{row.phone}</td>
            <td className="px-4 py-4">
              <span className="rounded-[6px] bg-[#DDFBDA] px-4 py-1 text-[13px] font-extrabold leading-none text-[#05B705]">
                {row.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
