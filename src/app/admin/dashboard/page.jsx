"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  UserRound,
  Bell,
  X,
  CheckCheck,
  RefreshCw,
} from "lucide-react";

const ROWS_PER_PAGE = 10;

const STATUS_OPTIONS = [
  "Menunggu",
  "Berlangsung",
  "Selesai",
  "Dibatalkan",
];

const STATUS_STYLES = {
  Selesai: "bg-green-100 text-green-600 border border-green-200",
  Berlangsung: "bg-blue-100 text-blue-600 border border-blue-200",
  Menunggu: "bg-yellow-100 text-yellow-600 border border-yellow-200",
  Dibatalkan: "bg-red-100 text-red-600 border border-red-200",
};

const INDONESIAN_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function formatDateLabel(rawDate) {
  if (!rawDate) return "-";
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return rawDate;
  return `${date.getDate()} ${INDONESIAN_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function formatTimeLabel(timeValue) {
  if (!timeValue) return "-";
  return timeValue.substring(0, 5).replace(":", ".");
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, loading }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex-1 min-w-[140px] flex flex-col items-center justify-center">
      <span className="text-sm font-bold text-gray-600 mb-2 text-center">{label}</span>
      {loading ? (
        <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
      ) : (
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      )}
    </div>
  );
}

// ─── Notification Panel ───────────────────────────────────────────────────────
function NotificationPanel({ notifications, onMarkAll, onMarkOne, onClose }) {
  return (
    <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="font-bold text-gray-900 text-sm">Notifikasi</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onMarkAll}
            className="text-xs text-[#5E81CC] hover:underline flex items-center gap-1"
            title="Tandai semua dibaca"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Tandai semua
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Tidak ada notifikasi baru.</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${!n.is_read ? "bg-blue-50/60" : ""}`}
              onClick={() => onMarkOne(n.id)}
            >
              <p className={`text-xs font-semibold mb-0.5 ${!n.is_read ? "text-[#5E81CC]" : "text-gray-700"}`}>
                {n.title}
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
              <p className="text-[10px] text-gray-400 mt-1">
                {new Date(n.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ appointment, onClose }) {
  if (!appointment) return null;
  const rows = [
    ["Pasien", appointment.patient_name],
    ["Email", appointment.patient_email],
    ["Telepon", appointment.patient_phone],
    ["Dokter", appointment.doctor_name],
    ["Tanggal", formatDateLabel(appointment.appointment_date)],
    ["Waktu", appointment.schedule_time || "-"],
    ["Ruangan", appointment.room_number],
    ["Status", appointment.status],
    ["Keluhan", appointment.complaints || "-"],
    ["Catatan Medis", appointment.notes || "-"],
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-gray-900">Detail Janji Temu</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {rows.map(([label, value]) => (
            <div key={label} className="flex gap-3 text-sm">
              <span className="w-32 text-gray-500 flex-shrink-0">{label}</span>
              <span className="font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>
        <div className="px-6 pb-5 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-100 text-gray-700 text-sm font-semibold hover:bg-slate-200 transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit / Status Modal ──────────────────────────────────────────────────────
function EditModal({ appointment, onClose, onSaved }) {
  const [form, setForm] = useState({
    appointment_date: appointment?.appointment_date || "",
    start_time: appointment?.start_time || "",
    end_time: appointment?.end_time || "",
    status: appointment?.status || "Menunggu",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async () => {
    if (!appointment) return;
    setSaving(true);
    setErr("");
    try {
      const res = await fetch(`/api/appointments?id=${appointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || "Gagal menyimpan.");
      }
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-gray-900">Edit Janji Temu</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Pasien</label>
            <p className="text-sm font-bold text-gray-800">{appointment?.patient_name}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E81CC]/30"
            >
              {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Tanggal</label>
            <input
              type="date"
              value={form.appointment_date}
              onChange={(e) => setForm((f) => ({ ...f, appointment_date: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E81CC]/30"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 block mb-1">Mulai</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E81CC]/30"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 block mb-1">Selesai</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E81CC]/30"
              />
            </div>
          </div>
          {err && <p className="text-xs text-red-500">{err}</p>}
        </div>
        <div className="px-6 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-100 text-gray-700 text-sm font-semibold hover:bg-slate-200 transition-colors">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#5E81CC] text-white text-sm font-semibold hover:bg-[#4A6BB0] transition-colors disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
  // function DeleteModal({ appointment, onClose, onDeleted }) {
  //   const [deleting, setDeleting] = useState(false);
  //   const [err, setErr] = useState("");
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [editAppointment, setEditAppointment] = useState(null);

  // Notification panel
  const [showNotif, setShowNotif] = useState(false);

  // ── Fetch helpers ────────────────────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    try {
      // Admin user_id: adjust as needed (e.g. from session/context)
      const res = await fetch("/api/notifications?user_id=admin");
      if (!res.ok) return;
      const json = await res.json();
      setNotifications(Array.isArray(json.notifications) ? json.notifications : []);
    } catch (_) {}
  }, []);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [doctorRes, patientRes, appointmentRes, todayRes] = await Promise.all([
        fetch("/api/doctors", { cache: "no-store" }),
        fetch("/api/patient", { cache: "no-store" }),
        fetch("/api/appointments", { cache: "no-store" }),
        fetch("/api/appointments?today=true", { cache: "no-store" }),
      ]);

      const [doctorJson, patientJson, appointmentJson, todayJson] = await Promise.all([
        doctorRes.json(),
        patientRes.json(),
        appointmentRes.json(),
        todayRes.json(),
      ]);

      if (!doctorRes.ok || !patientRes.ok || !appointmentRes.ok || !todayRes.ok) {
        throw new Error("Gagal memuat data sistem.");
      }

      setDoctors(Array.isArray(doctorJson.data) ? doctorJson.data : []);
      setPatients(Array.isArray(patientJson.data) ? patientJson.data : []);
      setAppointments(Array.isArray(appointmentJson.data) ? appointmentJson.data : []);
      setTodayAppointments(Array.isArray(todayJson.data) ? todayJson.data : []);
    } catch (err) {
      setError(err?.message || "Terjadi kesalahan saat memuat dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    loadNotifications();
  }, [loadDashboardData, loadNotifications]);

  // ── Pagination logic ─────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(todayAppointments.length / ROWS_PER_PAGE));
  const paginatedRows = todayAppointments.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const pageNumbers = useMemo(() => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }, [totalPages]);

  // ── Recent activities ────────────────────────────────────────────────────────
  const recentActivities = useMemo(() => {
    return appointments.slice(0, 5).map((item) => {
      const name = item.patient_name || "Pasien";
      if (item.status === "Dibatalkan") return { text: `Appointment ${name} telah dibatalkan`, type: "cancel" };
      if (item.status === "Selesai") return { text: `Appointment ${name} telah selesai`, type: "success" };
      return { text: `Appointment ${name} sedang berlangsung`, type: "edit" };
    });
  }, [appointments]);

  const activityIcon = (type) => {
    if (type === "cancel") return { icon: Trash2, color: "text-red-500" };
    if (type === "success") return { icon: CalendarCheck, color: "text-green-500" };
    return { icon: CalendarCheck, color: "text-yellow-500" };
  };

  // ── Notification handlers ────────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkOne = async (id) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAll = async () => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "admin" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin membatalkan appointment ini?")) return;
    try {
      const res = await fetch(`/api/appointments?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus.");
      loadDashboardData();
    } catch (e) {
      window.alert(e.message);
    }
  };

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = [
    { label: "Total dokter", value: doctors.length },
    { label: "Total pasien", value: patients.length },
    { label: "Total janji temu", value: appointments.length },
    { label: "Janji temu hari ini", value: todayAppointments.length },
  ];

  return (
    <div className="font-sans text-slate-800 pb-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Halo, Admin</h1>
          <p className="text-gray-500 text-sm">Berikut ringkasan data sistem ClinicaLink.</p>
        </div>

        {/* Notification bell */}
        <div className="relative mt-1">
          <button
            onClick={() => setShowNotif((v) => !v)}
            className="relative p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotif && (
            <NotificationPanel
              notifications={notifications}
              onMarkAll={handleMarkAll}
              onMarkOne={handleMarkOne}
              onClose={() => setShowNotif(false)}
            />
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {stats.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} loading={loading} />
        ))}
      </div>

      {/* Today's Schedule Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden pb-4 mb-6">
        <div className="p-6 pb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Jadwal hari ini</h2>
          <button
            onClick={loadDashboardData}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#5E81CC] transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F3F6FB] text-gray-700 font-semibold text-xs border-y border-gray-100">
              <tr>
                <th className="px-6 py-4 text-center w-12">No</th>
                <th className="px-6 py-4">Pasien</th>
                <th className="px-6 py-4">Dokter</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-400 text-sm">
                    Tidak ada jadwal untuk hari ini.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((item, idx) => {
                  const rowNo = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
                  const statusClass = STATUS_STYLES[item.status] || "bg-gray-100 text-gray-600 border border-gray-200";
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-center font-medium text-gray-500">{rowNo}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{item.patient_name}</td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{item.doctor_name}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDateLabel(item.appointment_date)}</td>
                      <td className="px-6 py-4 text-[#5E81CC] font-bold">
                        {formatTimeLabel(item.start_time)} WIB
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-bold ${statusClass}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedAppointment(item)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Lihat"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditAppointment(item)}
                            className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Batalkan"
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Dynamic Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 mb-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 text-gray-400 hover:text-[#5E81CC] transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 flex items-center justify-center rounded-full font-semibold text-sm transition-colors ${
                  currentPage === page
                    ? "bg-[#5E81CC] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 text-gray-400 hover:text-[#5E81CC] transition-colors disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Aktivitas terbaru</h2>
        </div>
        <div className="space-y-4">
          {recentActivities.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada aktivitas.</p>
          ) : (
            recentActivities.map((activity, i) => {
              const { icon: Icon, color } = activityIcon(activity.type);
              return (
                <div key={i} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                  <div className={`p-2.5 rounded-xl bg-gray-50 ${color}`}>
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <p className="text-sm font-medium text-gray-700">{activity.text}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedAppointment && (
        <DetailModal appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} />
      )}
      {editAppointment && (
        <EditModal
          appointment={editAppointment}
          onClose={() => setEditAppointment(null)}
          onSaved={() => {
            setEditAppointment(null);
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
}