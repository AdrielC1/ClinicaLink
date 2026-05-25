"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ── Helper: format tanggal ISO (YYYY-MM-DD) → display "25 Mei 2025"
const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const WEEKDAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const WEEKDAYS_FULL  = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

function toLocalISO(date) {
  // Kembalikan string YYYY-MM-DD menggunakan lokal offset (bukan UTC)
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime(t) {
  if (!t) return "";
  // "08:00:00" → "08.00"
  return t.substring(0, 5).replace(":", ".");
}

// ── Status badge config
const STATUS_CONFIG = {
  Menunggu:     { bg: "bg-[#fef9c3]", text: "text-[#ca8a04]" },
  Berlangsung:  { bg: "bg-[#dbeafe]", text: "text-[#1d4ed8]" },
  Selesai:      { bg: "bg-[#dcfce7]", text: "text-[#16a34a]" },
  Dibatalkan:   { bg: "bg-[#fee2e2]", text: "text-[#dc2626]" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { bg: "bg-gray-100", text: "text-gray-600" };
  return (
    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-extrabold ${cfg.bg} ${cfg.text}`}>
      {status}
    </span>
  );
}

// ── Tombol aksi berdasarkan status appointment
function ActionButton({ appointment, onAction, loading }) {
  const { id, status } = appointment;
  const isLoading = loading === id;

  if (status === "Selesai" || status === "Dibatalkan") {
    return (
      <span className="h-[28px] min-w-[70px] rounded-full px-4 text-[11px] font-extrabold bg-[#e2e8f0] text-gray-500 inline-flex items-center justify-center">
        {status}
      </span>
    );
  }

  if (status === "Menunggu") {
    return (
      <button
        disabled={isLoading}
        onClick={() => onAction(id, "Berlangsung")}
        className="h-[28px] min-w-[70px] rounded-full px-4 text-[11px] font-extrabold border border-[#5E81CC] text-[#5E81CC] hover:bg-[#5E81CC] hover:text-white transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1"
      >
        {isLoading ? <Loader2 size={11} className="animate-spin" /> : null}
        Mulai
      </button>
    );
  }

  if (status === "Berlangsung") {
    return (
      <button
        disabled={isLoading}
        onClick={() => onAction(id, "Selesai")}
        className="h-[28px] min-w-[70px] rounded-full px-4 text-[11px] font-extrabold bg-[#16a34a] text-white hover:bg-[#15803d] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1"
      >
        {isLoading ? <Loader2 size={11} className="animate-spin" /> : null}
        Selesai
      </button>
    );
  }

  return null;
}

// ── Komponen Kalender kecil (sidebar)
function MiniCalendar({ selectedDate, onSelectDate, appointmentDates, currentMonth, onChangeMonth }) {
  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Buat grid 42 sel (6 minggu)
  const cells = [];
  const firstDay = new Date(year, month, 1).getDay(); // 0=Minggu
  const daysInMonth    = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Isi hari dari bulan sebelumnya
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, isCurrentMonth: false, date: new Date(year, month - 1, daysInPrevMonth - i) });
  }
  // Isi hari bulan ini
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isCurrentMonth: true, date: new Date(year, month, d) });
  }
  // Isi hari dari bulan berikutnya
  let next = 1;
  while (cells.length < 42) {
    cells.push({ day: next, isCurrentMonth: false, date: new Date(year, month + 1, next) });
    next++;
  }

  const todayISO = toLocalISO(new Date());

  return (
    <section className="bg-white px-6 py-7 sm:px-8 shadow-sm rounded-2xl">
      {/* Header bulan */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          aria-label="Bulan sebelumnya"
          onClick={() => onChangeMonth(-1)}
          className="shrink-0 p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="min-w-0 truncate text-[12px] font-extrabold">
          {MONTHS_ID[month]} {year}
        </p>
        <button
          type="button"
          aria-label="Bulan berikutnya"
          onClick={() => onChangeMonth(1)}
          className="shrink-0 p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Nama hari */}
      <div className="mt-7 grid grid-cols-7 gap-y-4 text-center text-[10px] font-bold text-gray-500">
        {WEEKDAYS_SHORT.map((d) => <span key={d}>{d}</span>)}
      </div>

      {/* Grid tanggal */}
      <div className="mt-4 grid grid-cols-7 gap-y-3 text-center text-[11px] font-extrabold text-gray-800">
        {cells.map((cell, idx) => {
          const isoDate = toLocalISO(cell.date);
          const isSelected = isoDate === selectedDate;
          const isToday    = isoDate === todayISO;
          const hasAppt    = cell.isCurrentMonth && appointmentDates.has(isoDate);

          return (
            <div key={idx} className="flex flex-col items-center gap-[3px]">
              <button
                type="button"
                onClick={() => cell.isCurrentMonth && onSelectDate(isoDate)}
                className={`mx-auto flex h-[26px] w-[26px] items-center justify-center rounded-full transition-colors
                  ${!cell.isCurrentMonth ? "text-[#b9bec7] font-medium cursor-default" : "cursor-pointer hover:bg-indigo-50"}
                  ${isSelected ? "bg-[#5E81CC] text-white hover:bg-[#5E81CC]" : ""}
                  ${isToday && !isSelected ? "ring-2 ring-[#5E81CC] text-[#5E81CC]" : ""}
                `}
              >
                {cell.day}
              </button>
              {/* Titik indikator ada appointment */}
              {hasAppt && (
                <span className={`h-[4px] w-[4px] rounded-full ${isSelected ? "bg-white" : "bg-[#5E81CC]"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Jadwal pada tanggal terpilih */}
      <div className="mt-8 border-t border-[#f1f5f9] pt-6">
        <h3 className="text-[13px] font-extrabold text-gray-900">
          Jadwal {selectedDate === todayISO ? "Hari ini" : formatDisplayDate(selectedDate)}
        </h3>
        <SidebarScheduleList selectedDate={selectedDate} appointmentDates={appointmentDates} />
      </div>
    </section>
  );
}

// placeholder — akan diisi lewat props
function SidebarScheduleList() { return null; }

function formatDisplayDate(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  return `${d} ${MONTHS_ID[m - 1]}`;
}

// =========================================================
// KOMPONEN UTAMA
// =========================================================
export default function DoctorDashboardPage() {
  const [doctorName, setDoctorName]     = useState("");
  const [doctorId, setDoctorId]         = useState(null);

  // Kalender
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(toLocalISO(today));

  // Data appointment
  const [allAppointments, setAllAppointments] = useState([]); // semua milik dokter (untuk titik kalender)
  const [dayAppointments, setDayAppointments] = useState([]); // hanya tanggal terpilih (untuk tabel)
  const [loadingTable, setLoadingTable] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // id appointment yang sedang diproses

  // ── Ambil identitas dokter yang login
  useEffect(() => {
    const initDoctor = async () => {
      // 1. Nama dari localStorage
      const storedName = localStorage.getItem("clinicalink:name");
      if (storedName) {
        setDoctorName(storedName.replace(/^dr\.?\s*/i, ""));
      }

      // 2. Ambil doctor_id dari Supabase (dibutuhkan untuk query appointment)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Ambil nama terbaru jika belum ada
      if (!storedName) {
        const { data: userData } = await supabase
          .from("users")
          .select("full_name")
          .eq("id", user.id)
          .single();
        const name = userData?.full_name || user.user_metadata?.full_name || "Dokter";
        setDoctorName(name.replace(/^dr\.?\s*/i, ""));
        localStorage.setItem("clinicalink:name", name);
      }

      // Ambil doctor_id dari tabel doctors
      const { data: doctorData } = await supabase
        .from("doctors")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (doctorData) {
        setDoctorId(doctorData.id);
      }
    };

    initDoctor();
  }, []);


  // ── Ambil appointment berdasarkan tanggal yang dipilih
  const fetchDayAppointments = useCallback(async (date) => {
    if (!doctorId) return;
    setLoadingTable(true);

    try {
      const res = await fetch(`/api/appointments?doctor_id=${doctorId}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const all  = Array.isArray(json.data) ? json.data : [];
        // Simpan semua untuk titik kalender
        setAllAppointments(all);
        // Filter hanya untuk tanggal terpilih
        const filtered = all.filter(a => {
          const aDate = (a.appointment_date || "").split("T")[0];
          return aDate === date;
        });
        // Urutkan berdasarkan start_time
        filtered.sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
        setDayAppointments(filtered);
      }
    } catch (err) {
      console.error("Gagal memuat appointment:", err);
    } finally {
      setLoadingTable(false);
    }
  }, [doctorId]);

  // Panggil saat doctorId tersedia atau tanggal berubah
  useEffect(() => {
    if (doctorId) {
      fetchDayAppointments(selectedDate);
    }
  }, [doctorId, selectedDate, fetchDayAppointments]);

  // ── Kumpulan tanggal yang punya appointment (untuk titik kalender)
  const appointmentDates = new Set(
    allAppointments.map(a => (a.appointment_date || "").split("T")[0]).filter(Boolean)
  );

  // ── Ganti status appointment (Mulai / Selesai)
  const handleAction = async (appointmentId, newStatus) => {
    setActionLoading(appointmentId);
    try {
      const res = await fetch(`/api/appointments?id=${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Update state lokal tanpa refetch (lebih responsif)
        const update = (list) =>
          list.map(a => a.id === appointmentId ? { ...a, status: newStatus } : a);
        setDayAppointments(update);
        setAllAppointments(update);
      } else {
        const err = await res.json();
        alert(err.message || "Gagal memperbarui status.");
      }
    } catch (e) {
      alert("Koneksi bermasalah. Coba lagi.");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Pindah bulan kalender
  const handleChangeMonth = (delta) => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  // ── Header tabel berubah sesuai tanggal
  const todayISO = toLocalISO(today);
  const selectedDayLabel = selectedDate === todayISO
    ? "Jadwal hari ini"
    : `Jadwal ${WEEKDAYS_FULL[new Date(selectedDate + "T00:00:00").getDay()]}, ${formatDisplayDate(selectedDate)}`;

  // ── Mini list untuk sidebar kalender
  const sidebarAppointments = dayAppointments.slice(0, 3);

  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_300px]">

      {/* ── MAIN CONTENT ── */}
      <main className="min-w-0">
        <h1 className="text-[23px] font-extrabold tracking-[-0.01em]">
          Halo, Dr {doctorName || "…"}
        </h1>
        <p className="mt-2 text-[15px] text-gray-500 font-medium">
          Berikut ringkasan jadwal dan pasien hari ini.
        </p>

        <section className="mt-8 rounded-2xl bg-white shadow-sm overflow-hidden">
          {/* Header tabel */}
          <div className="p-6 pb-4 flex items-center justify-between gap-4">
            <h2 className="text-[16px] font-extrabold text-gray-900">{selectedDayLabel}</h2>
            {loadingTable && (
              <Loader2 size={16} className="animate-spin text-[#5E81CC]" />
            )}
          </div>

          {/* Kondisi kosong — compact, tidak pakai table */}
          {!loadingTable && dayAppointments.length === 0 ? (
            <div className="px-6 pb-5 flex items-center gap-3 text-gray-400">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-gray-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span className="text-[13px] font-medium">Tidak ada jadwal untuk tanggal ini.</span>
            </div>
          ) : (
            /* Tabel — tumbuh ke bawah mengikuti jumlah data, tidak ada fixed height */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#f8fafc] text-gray-500 font-bold">
                  <tr>
                    <th className="px-6 py-3">Waktu</th>
                    <th className="px-6 py-3">Nama Pasien</th>
                    <th className="px-6 py-3">Keluhan</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dayAppointments.map((appt) => (
                    <tr key={appt.id} className="font-bold text-gray-800 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap">
                        {formatTime(appt.start_time)}
                        {appt.end_time ? ` – ${formatTime(appt.end_time)}` : ""}
                      </td>
                      <td className="px-6 py-3">{appt.patient_name || "—"}</td>
                      <td className="px-6 py-3 text-gray-500">{appt.notes || "—"}</td>
                      <td className="px-6 py-3 text-center">
                        <StatusBadge status={appt.status} />
                      </td>
                      <td className="px-6 py-3 text-center">
                        <ActionButton
                          appointment={appt}
                          onAction={handleAction}
                          loading={actionLoading}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>


      {/* ── SIDEBAR KANAN ── */}
      <aside className="space-y-6">
        {/* ── KALENDER CLEAN ── */}
        <div className="overflow-hidden rounded-3xl shadow-sm bg-white border border-gray-100">

          {/* Header Kalender */}
          <div className="bg-[#5E81CC] px-5 pt-6 pb-2">
            {/* Navigasi bulan */}
            <div className="flex items-center justify-between mb-6">
              <button
                type="button"
                aria-label="Bulan sebelumnya"
                onClick={() => handleChangeMonth(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-white hover:bg-white/20 transition-all active:scale-90"
              >
                <ChevronLeft size={18} />
              </button>
              <p className="text-[14px] font-extrabold text-white tracking-wide">
                {MONTHS_ID[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </p>
              <button
                type="button"
                aria-label="Bulan berikutnya"
                onClick={() => handleChangeMonth(1)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-white hover:bg-white/20 transition-all active:scale-90"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Nama hari */}
            <div className="grid grid-cols-7 text-center">
              {WEEKDAYS_SHORT.map((d) => (
                <span key={d} className="text-[11px] font-bold text-blue-100 tracking-wider py-1">
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* Body kalender */}
          <div className="bg-white px-4 pb-4 pt-3">
            <CalendarGrid
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              appointmentDates={appointmentDates}
              onSelectDate={setSelectedDate}
            />
          </div>

          {/* Schedule strip di bawah */}
          <div className="bg-gray-50 border-t border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[12px] font-extrabold text-gray-700 uppercase tracking-wide">
                {selectedDate === todayISO ? "Hari ini" : formatDisplayDate(selectedDate)}
              </h3>
              {loadingTable && <Loader2 size={12} className="animate-spin text-[#5E81CC]" />}
            </div>

            {sidebarAppointments.length === 0 ? (
              <div className="flex items-center gap-2 py-2">
                <span className="text-[11px] text-gray-400 font-medium italic">Tidak ada jadwal</span>
              </div>
            ) : (
              <div className="space-y-2">
                {sidebarAppointments.map((appt, i) => (
                  <div
                    key={appt.id}
                    className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 px-3 py-2 shadow-sm hover:border-[#5E81CC]/30 hover:shadow-md transition-all"
                  >
                    {/* Warna aksen status */}
                    <div className={`w-[3px] self-stretch rounded-full shrink-0 ${
                      appt.status === 'Selesai' ? 'bg-green-400' :
                      appt.status === 'Berlangsung' ? 'bg-blue-400' : 'bg-[#5E81CC]'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-extrabold text-gray-800 truncate">{appt.patient_name}</p>
                      <p className="text-[10px] text-[#5E81CC] font-bold mt-0.5">
                        {formatTime(appt.start_time)}{appt.end_time ? ` – ${formatTime(appt.end_time)}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {dayAppointments.length > 3 && (
              <button
                type="button"
                className="mt-3 w-full text-center text-[11px] font-extrabold text-[#5E81CC] hover:underline"
              >
                +{dayAppointments.length - 3} jadwal lainnya
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

// ── Sub-komponen Grid Kalender (Modern)
function CalendarGrid({ currentMonth, selectedDate, appointmentDates, onSelectDate }) {
  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const todayISO = toLocalISO(new Date());

  const cells = [];
  const firstDay       = new Date(year, month, 1).getDay();
  const daysInMonth    = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  let next = 1;
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, next++), isCurrentMonth: false });
  }

  return (
    <div className="grid grid-cols-7 gap-y-1">
      {cells.map((cell, idx) => {
        const isoDate    = toLocalISO(cell.date);
        const isSelected = isoDate === selectedDate;
        const isToday    = isoDate === todayISO;
        const hasAppt    = cell.isCurrentMonth && appointmentDates.has(isoDate);
        const day        = cell.date.getDate();

        return (
          <div key={idx} className="flex flex-col items-center py-[2px]">
            <button
              type="button"
              onClick={() => cell.isCurrentMonth && onSelectDate(isoDate)}
              disabled={!cell.isCurrentMonth}
              className={[
                "relative w-8 h-8 flex items-center justify-center rounded-xl text-[12px] font-bold transition-all duration-150 select-none",
                !cell.isCurrentMonth
                  ? "text-gray-300 cursor-default"
                  : "cursor-pointer",
                isSelected
                  ? "bg-[#5E81CC] text-white shadow-md shadow-[#5E81CC]/30 scale-105 font-extrabold"
                  : isToday
                    ? "bg-[#EEF3FF] text-[#5E81CC] font-extrabold ring-2 ring-[#5E81CC] ring-offset-1"
                    : cell.isCurrentMonth
                      ? "text-gray-700 hover:bg-indigo-50 hover:text-[#5E81CC]"
                      : "",
              ].join(" ")}
            >
              {day}
              {/* Titik appointment: muncul di sudut kanan atas */}
              {hasAppt && !isSelected && (
                <span className="absolute top-[5px] right-[5px] w-[5px] h-[5px] rounded-full bg-[#5E81CC] shadow-sm" />
              )}
              {hasAppt && isSelected && (
                <span className="absolute top-[5px] right-[5px] w-[5px] h-[5px] rounded-full bg-white/80" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
