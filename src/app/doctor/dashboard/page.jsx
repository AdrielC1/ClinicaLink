"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import CalendarWidget from "@/components/CalendarWidget";

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
  "Sedang Berlangsung":  { bg: "bg-[#dbeafe]", text: "text-[#1d4ed8]" },
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
function ActionButton({ appointment, onAction, onFinish, loading }) {
  const { id, status, appointment_date, start_time } = appointment;
  const isLoading = loading === id;

  if (status === "Selesai" || status === "Dibatalkan") {
    return (
      <span className="h-[28px] min-w-[70px] rounded-full px-4 text-[11px] font-extrabold bg-[#e2e8f0] text-gray-500 inline-flex items-center justify-center">
        {status}
      </span>
    );
  }

  if (status === "Menunggu") {
    const now = new Date();
    const apptDateStr = (appointment_date || "").split("T")[0];
    const apptDateTime = new Date(`${apptDateStr}T${start_time}`);
    const isLocked = now < apptDateTime;

    return (
      <button
        disabled={isLoading || isLocked}
        title={isLocked ? "Belum memasuki waktu janji temu" : "Mulai Sesi"}
        onClick={() => onAction(id, "Sedang Berlangsung")}
        className="h-[28px] min-w-[70px] rounded-full px-4 text-[11px] font-extrabold border border-[#5E81CC] text-[#5E81CC] hover:bg-[#5E81CC] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1"
      >
        {isLoading ? <Loader2 size={11} className="animate-spin" /> : null}
        Mulai
      </button>
    );
  }

  if (status === "Sedang Berlangsung") {
    return (
      <button
        disabled={isLoading}
        onClick={() => onFinish(id)}
        className="h-[28px] min-w-[70px] rounded-full px-4 text-[11px] font-extrabold bg-[#16a34a] text-white hover:bg-[#15803d] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1"
      >
        {isLoading ? <Loader2 size={11} className="animate-spin" /> : null}
        Selesai
      </button>
    );
  }

  return null;
}

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
  const [finishTarget, setFinishTarget] = useState(null); // id appointment untuk modal selesai
  const [medicalNotes, setMedicalNotes] = useState("");

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
        const activeAppointments = all.filter(a => a.status !== 'Dibatalkan');
        // Simpan semua untuk titik kalender
        setAllAppointments(activeAppointments);
        // Filter hanya untuk tanggal terpilih
        const filtered = activeAppointments.filter(a => {
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
  const handleAction = async (appointmentId, newStatus, notes = "") => {
    setActionLoading(appointmentId);
    try {
      const payload = { status: newStatus };
      if (notes) payload.medical_notes = notes;

      const res = await fetch(`/api/appointments?id=${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Update state lokal tanpa refetch (lebih responsif)
        const update = (list) =>
          list.map(a => a.id === appointmentId ? { ...a, status: newStatus, medical_notes: notes || a.medical_notes } : a);
        setDayAppointments(update);
        setAllAppointments(update);
        setFinishTarget(null);
        setMedicalNotes("");
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
    <>
      <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_300px]">

        {/* ── MAIN CONTENT ── */}
      <main className="min-w-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Halo, Dr {doctorName || "…"}
          </h1>
          <p className="text-gray-500 text-sm">
            Berikut ringkasan jadwal dan pasien hari ini.
          </p>
        </div>

        <section className="mt-8 rounded-2xl bg-white shadow-sm overflow-hidden">
          {/* Header tabel */}
          <div className="p-6 pb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900">{selectedDayLabel}</h2>
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
                          onFinish={(id) => {
                            setFinishTarget(id);
                            setMedicalNotes("");
                          }}
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
        {/* ── KALENDER CLEAN & SCHEDULE STRIP ── */}
        <div className="overflow-hidden rounded-3xl shadow-sm bg-white border border-gray-100">
          <CalendarWidget
            currentMonth={currentMonth}
            onChangeMonth={handleChangeMonth}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            eventDates={Array.from(appointmentDates)}
          />

          {/* Schedule strip di bawah */}
          <div className="bg-gray-50 border-t border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[12px] font-extrabold text-gray-700 uppercase tracking-wide">
                {selectedDate === todayISO ? "Hari ini" : `Jadwal ${formatDisplayDate(selectedDate)}`}
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
                      appt.status === 'Sedang Berlangsung' ? 'bg-blue-400' : 'bg-[#5E81CC]'
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

      {/* ── MODAL SELESAI (CATATAN MEDIS) ── */}
      {finishTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Selesaikan Sesi</h2>
              <button
                onClick={() => setFinishTarget(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Sesi konsultasi telah selesai. Silakan tambahkan catatan medis (diagnosis, resep, atau saran) untuk pasien ini sebelum mengakhiri sesi.
              </p>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Catatan Medis <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                placeholder="Tulis diagnosis atau resep di sini..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E81CC]/30 transition-colors resize-none"
              ></textarea>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setFinishTarget(null)}
                  className="px-5 py-2 border border-slate-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={actionLoading === finishTarget || !medicalNotes.trim()}
                  onClick={() => handleAction(finishTarget, "Selesai", medicalNotes)}
                  className="px-5 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-semibold hover:bg-[#15803d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === finishTarget ? "Menyimpan..." : "Simpan & Selesai"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
