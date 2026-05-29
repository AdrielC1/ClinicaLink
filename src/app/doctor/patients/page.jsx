"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, ChevronDown, ChevronLeft, ChevronRight, Loader2, X, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ── Helpers ──────────────────────────────────────────────
const MONTHS_ID = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

function toLocalISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_ID[m - 1]} ${y}`;
}

function formatTime(t) {
  if (!t) return "";
  return t.substring(0, 5).replace(":", ".");
}

// ── Virtual State Logic (from .antigravityrules) ─────────
function computeVirtualStatus(appt) {
  const now = new Date();
  const apptDate = (appt.appointment_date || "").split("T")[0];
  const endTime = appt.end_time;

  if (!apptDate || !endTime) return appt.status;

  const endDateTime = new Date(`${apptDate}T${endTime}`);
  const endPlus4h = new Date(endDateTime.getTime() + 4 * 60 * 60 * 1000);

  // Rule 4: Forced Selesai after 4 hours past end_time
  if (appt.status === "Sedang Berlangsung" && now > endPlus4h) {
    return "Selesai";
  }
  // Rule 3: Awaiting notes — still "Sedang Berlangsung" in DB but past end_time without notes
  if (appt.status === "Sedang Berlangsung" && now > endDateTime && !appt.notes) {
    return "Menunggu Catatan Dokter";
  }
  // Rule 2: Normal Sedang Berlangsung
  if (appt.status === "Sedang Berlangsung") {
    return "Sedang Berlangsung";
  }
  // Rule 1: Auto-cancelled — Menunggu but time has fully passed
  if (appt.status === "Menunggu" && now > endDateTime) {
    return "Dibatalkan (Otomatis)";
  }

  // Default: return DB status as-is
  return appt.status;
}

// ── Status Badge Config ──────────────────────────────────
const STATUS_STYLES = {
  "Menunggu":                { bg: "bg-amber-50",   text: "text-amber-600",  dot: "bg-amber-400" },
  "Sedang Berlangsung":      { bg: "bg-blue-50",    text: "text-blue-600",   dot: "bg-blue-400" },
  "Menunggu Catatan Dokter": { bg: "bg-orange-50",  text: "text-orange-600", dot: "bg-orange-400" },
  "Selesai":                 { bg: "bg-emerald-50", text: "text-emerald-600",dot: "bg-emerald-400" },
  "Dibatalkan":              { bg: "bg-red-50",     text: "text-red-500",    dot: "bg-red-400" },
  "Dibatalkan (Otomatis)":   { bg: "bg-red-50",     text: "text-red-500",    dot: "bg-red-400" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_STYLES[status] ?? { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

// ── Constants ────────────────────────────────────────────
const ITEMS_PER_PAGE = 10;
const STATUS_FILTERS = [
  "Semua Status",
  "Menunggu",
  "Sedang Berlangsung",
  "Menunggu Catatan Dokter",
  "Selesai",
  "Dibatalkan (Otomatis)",
];

// =========================================================
// MAIN COMPONENT
// =========================================================
export default function DoctorPatientsPage() {
  // ── State ──────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── Fetch appointments ─────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: doctorData } = await supabase
        .from("doctors")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!doctorData) return;

      const res = await fetch(`/api/appointments?doctor_id=${doctorData.id}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const all = Array.isArray(json.data) ? json.data : [];
        setAppointments(all);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // ── Computed: enrich with virtual status ────────────────
  const enrichedAppointments = useMemo(() => {
    return appointments.map(appt => ({
      ...appt,
      virtualStatus: computeVirtualStatus(appt),
    }));
  }, [appointments]);

  // ── Filter & Sort ──────────────────────────────────────
  const filteredAppointments = useMemo(() => {
    let result = enrichedAppointments;

    // Filter by status
    if (filterStatus !== "Semua Status") {
      result = result.filter(a => a.virtualStatus === filterStatus);
    }

    // Search by patient name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => (a.patient_name || "").toLowerCase().includes(q));
    }

    // Sort by date descending, then time descending
    result.sort((a, b) => {
      const dateA = a.appointment_date || "";
      const dateB = b.appointment_date || "";
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      
      const timeA = a.start_time || "";
      const timeB = b.start_time || "";
      return timeB.localeCompare(timeA);
    });

    return result;
  }, [enrichedAppointments, filterStatus, searchQuery]);

  // ── Pagination ─────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE));
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery]);

  // ── Modal handlers ─────────────────────────────────────
  const openDetail = (appt) => { setSelectedAppt(appt); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setSelectedAppt(null); };

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Riwayat Konsultasi
        </h1>
        <p className="text-gray-500 text-sm">
          Lihat seluruh riwayat konsultasi dan detail pasien.
        </p>
      </div>

      {/* Controls Row */}
      <div className="mb-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Left: Total Konsultasi */}
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900">
            Total Riwayat
          </h2>
          <span className="text-[12px] font-bold text-gray-400">
            {filteredAppointments.length} konsultasi
          </span>
        </div>

        {/* Right: Search + Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Cari nama pasien..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#5E81CC]/20 focus:border-[#5E81CC] placeholder:text-gray-400 shadow-sm transition-all"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative w-full sm:w-[220px]">
            <button
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-[#5E81CC]/30 rounded-xl text-[13px] text-[#5E81CC] shadow-sm font-bold focus:outline-none hover:bg-[#5E81CC]/5 transition-colors"
            >
              <span>{filterStatus}</span>
              <ChevronDown size={16} className={`text-[#5E81CC] transition-transform ${filterDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {filterDropdownOpen && (
              <div className="absolute top-full mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1.5 overflow-hidden">
                {STATUS_FILTERS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setFilterStatus(s); setFilterDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-[13px] font-semibold transition-colors ${
                      filterStatus === s
                        ? "bg-[#5E81CC]/10 text-[#5E81CC]"
                        : "text-gray-700 hover:bg-[#5E81CC]/10 hover:text-[#5E81CC]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#F8FAFC] border-b border-gray-100">
              <tr className="text-gray-900 font-extrabold text-[12px]">
                <th className="px-6 py-4 tracking-wide">No</th>
                <th className="px-6 py-4 tracking-wide">Tanggal</th>
                <th className="px-6 py-4 tracking-wide">Nama Pasien</th>
                <th className="px-6 py-4 tracking-wide">Waktu</th>
                <th className="px-6 py-4 tracking-wide">Keluhan</th>
                <th className="px-6 py-4 tracking-wide">Status</th>
                <th className="px-6 py-4 tracking-wide text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 size={24} className="animate-spin text-[#5E81CC]" />
                      <p className="text-sm font-medium">Memuat riwayat konsultasi...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedAppointments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Calendar size={28} className="text-gray-300" />
                      <p className="text-sm font-medium">Tidak ada riwayat konsultasi.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAppointments.map((appt, idx) => (
                  <tr key={appt.id} className="text-gray-800 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-[13px] font-extrabold">
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </td>
                    <td className="px-6 py-4 text-[13px] font-bold text-gray-700">
                      {formatDisplayDate((appt.appointment_date || "").split("T")[0])}
                    </td>
                    <td className="px-6 py-4 text-[13px] font-bold">{appt.patient_name}</td>
                    <td className="px-6 py-4 text-[13px] font-semibold text-gray-600">
                      {formatTime(appt.start_time)}
                      {appt.end_time ? ` – ${formatTime(appt.end_time)}` : ""}
                    </td>
                    <td className="px-6 py-4 text-[13px] font-medium text-gray-500 max-w-[200px] truncate">
                      {appt.complaints || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={appt.virtualStatus} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openDetail(appt)}
                        className="px-4 py-1.5 text-[11px] font-extrabold text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all"
                      >
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-[13px] font-bold transition-colors ${
                currentPage === page
                  ? "bg-[#8CAAE6] text-white font-extrabold shadow-sm"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── Modal Detail Pasien ─────────────────────────── */}
      {isModalOpen && selectedAppt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Detail Konsultasi</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Profile */}
            <div className="p-6 border-b border-gray-100 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 mb-3 border-2 border-white shadow-sm flex items-center justify-center">
                <img
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${selectedAppt.patient_name}`}
                  alt={selectedAppt.patient_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-[15px] font-bold text-gray-900">{selectedAppt.patient_name}</h3>
              <p className="text-[13px] font-medium text-gray-500">Pasien</p>
              <div className="mt-2">
                <StatusBadge status={selectedAppt.virtualStatus} />
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                <DetailRow label="Email" value={selectedAppt.patient_email} />
                <DetailRow label="No Telepon" value={selectedAppt.patient_phone} />
                <DetailRow
                  label="Tanggal Lahir"
                  value={selectedAppt.patient_dob ? formatDisplayDate(selectedAppt.patient_dob) : null}
                />
              </div>

              <hr className="border-gray-100" />

              <div className="space-y-3">
                <DetailRow
                  label="Tanggal Konsultasi"
                  value={formatDisplayDate((selectedAppt.appointment_date || "").split("T")[0])}
                />
                <DetailRow
                  label="Waktu"
                  value={
                    formatTime(selectedAppt.start_time) +
                    (selectedAppt.end_time ? ` – ${formatTime(selectedAppt.end_time)}` : "")
                  }
                />
                <DetailRow label="Ruangan" value={selectedAppt.room_number} />
              </div>

              <hr className="border-gray-100" />

              <div className="space-y-3">
                <DetailRow label="Keluhan" value={selectedAppt.complaints} multiline />
                <DetailRow label="Catatan Medis" value={selectedAppt.notes} multiline />
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 flex justify-center">
              <button
                onClick={closeModal}
                className="px-8 py-2 bg-[#5E81CC] hover:bg-[#4b6eb3] text-white text-[13px] font-bold rounded-lg shadow-sm transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close dropdown on outside click */}
      {filterDropdownOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setFilterDropdownOpen(false)} />
      )}
    </div>
  );
}

// ── Sub-component: Detail Row for modal ──────────────────
function DetailRow({ label, value, multiline = false }) {
  const displayValue = value && value !== "-" ? value : "—";
  return (
    <div className={`grid grid-cols-[120px_1fr] gap-2 ${multiline ? "items-start" : "items-center"}`}>
      <span className="text-[13px] font-bold text-gray-800">{label}</span>
      <span className={`text-[13px] font-semibold text-gray-600 ${multiline ? "whitespace-pre-wrap" : ""} break-words`}>
        {displayValue}
      </span>
    </div>
  );
}
