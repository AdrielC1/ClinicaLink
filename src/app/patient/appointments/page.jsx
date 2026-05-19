"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppSidebarLayout from "@/components/AppSidebarLayout";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Star,
  ChevronLeft,
  ChevronRight,
  Bell,
  X,
  CheckCircle2
} from "lucide-react";

export default function PatientAppointmentsPage() {
  const router = useRouter();

  // State Data
  const [currentUser, setCurrentUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Modal
  const [activeModal, setActiveModal] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null);

  // State Form Reschedule
  const [newDate, setNewDate] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Ambil Bulan & Tahun Aktual untuk Kalender Kanan
  const today = new Date();
  const currentMonthYear = today.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', month: 'long', year: 'numeric' });

  const fetchAppointments = async (userId) => {
    try {
      const res = await fetch(`/api/appointments?patient_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error("Gagal memuat janji temu:", error);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);
      await fetchAppointments(user.id);
      setLoading(false);
    };
    initData();
  }, [router]);

  const handleCancelAppointment = async (apptId) => {
    const confirmCancel = window.confirm("Apakah Anda yakin ingin membatalkan janji temu ini?");
    if (!confirmCancel) return;

    try {
      const res = await fetch(`/api/appointments?id=${apptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Dibatalkan" })
      });

      if (res.ok) {
        setActiveModal(null);
        fetchAppointments(currentUser.id);
      } else {
        alert("Gagal membatalkan janji temu.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!newDate) return alert("Pilih tanggal baru terlebih dahulu.");
    setIsProcessing(true);

    try {
      const res = await fetch(`/api/appointments?id=${selectedAppt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_date: newDate })
      });

      if (res.ok) {
        setActiveModal('success');
        fetchAppointments(currentUser.id);
      } else {
        alert("Gagal menjadwalkan ulang.");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openModal = (type, appt) => {
    setSelectedAppt(appt);
    setActiveModal(type);
    if (type === 'reschedule') {
      setNewDate(appt.appointment_date);
    }
  };

  if (loading) {
    return (
      <AppSidebarLayout role="patient">
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-slate-400 font-medium animate-pulse">Memuat Jadwal Konsultasi...</p>
        </div>
      </AppSidebarLayout>
    );
  }

  return (
    <AppSidebarLayout role="patient">
      {/* Grid Utama: Membagi 12 kolom untuk mencegah elemen terpotong */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start w-full">

        {/* ================= KOLOM KIRI (Daftar Janji Temu - 8 Kolom) ================= */}
        <div className="lg:col-span-8 space-y-6 w-full">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointment</h1>
              <p className="text-sm text-slate-500 mt-1">Kelola jadwal konsultasi dan appointment anda.</p>
            </div>
            <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 shadow-sm transition active:scale-95">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5h10" /><path d="M11 9h7" /><path d="M11 13h4" /><path d="M3 17l3 3 3-3" /><path d="M6 18V4" /></svg>
              Urutkan
            </button>
          </div>

          {/* Wrapper Card List */}
          <div className="space-y-4 w-full">
            {appointments.length > 0 ? (
              appointments.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  onDetail={() => openModal('detail', appt)}
                  onReschedule={() => openModal('reschedule', appt)}
                  onCancel={() => handleCancelAppointment(appt.id)}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400 shadow-sm">
                Belum ada jadwal janji temu terdaftar.
              </div>
            )}
          </div>

          {/* Pagination */}
          {appointments.length > 0 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"><ChevronLeft size={18} /></button>
              <button className="h-8 w-8 rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">1</button>
              <button className="h-8 w-8 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">2</button>
              <button className="h-8 w-8 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">3</button>
              <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"><ChevronRight size={18} /></button>
            </div>
          )}
        </div>

        {/* ================= KOLOM KANAN (Widget Kalender - 4 Kolom) ================= */}
        <div className="lg:col-span-4 space-y-6 w-full">

          {/* Widget Kalender */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <button className="rounded-lg p-1.5 hover:bg-slate-50 text-slate-600 transition"><ChevronLeft size={16} /></button>
              <span className="text-sm font-bold text-slate-800">{currentMonthYear}</span>
              <button className="rounded-lg p-1.5 hover:bg-slate-50 text-slate-600 transition"><ChevronRight size={16} /></button>
            </div>
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400">
              <div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div><div>Min</div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold text-slate-700">
              <div className="p-1 text-slate-200">28</div><div className="p-1 text-slate-200">29</div><div className="p-1 text-slate-200">30</div>
              <div className="rounded-lg p-1 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition">1</div>
              <div className="rounded-lg p-1 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition">2</div>
              <div className="rounded-lg p-1 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition">3</div>
              <div className="rounded-lg p-1 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition">4</div>
              <div className="rounded-lg p-1 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition">5</div>
              <div className="rounded-lg p-1 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition">6</div>
              <div className="rounded-lg p-1 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition">7</div>
              <div className="rounded-lg p-1 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition">8</div>
              <div className="rounded-lg p-1 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition">9</div>
              <div className="rounded-full bg-indigo-600 p-1 text-white shadow-md cursor-pointer">10</div>
              <div className="rounded-lg p-1 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition">11</div>
              <div className="rounded-lg p-1 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition">12</div>
              <div className="rounded-lg p-1 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition">13</div>
            </div>
          </div>

          {/* Reminder Card */}
          <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-red-50/60 p-5 shadow-sm">
            <div className="relative z-10 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-red-600">
                <Bell size={16} /> Reminder berikutnya
              </div>
              <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-red-500 shadow-sm border border-red-100">H-1</span>
            </div>
            <p className="relative z-10 text-sm leading-relaxed text-slate-700">
              Konsultasi dengan <span className="font-bold text-slate-900">DR. Mike</span><br />
              Besok pukul <span className="font-bold text-slate-900">10.00 WIB</span> di Ruang Konsultasi 1.
            </p>
          </div>
        </div>

      </div>

      {/* ================= MODAL MANAGERS ================= */}
      {activeModal === 'detail' && selectedAppt && (
        <ModalWrapper onClose={() => setActiveModal(null)}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-lg font-bold text-slate-900">Detail Appointment</h2>
            <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"><X size={18} /></button>
          </div>

          <div className="flex items-center justify-between mb-6 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl border border-slate-200 shadow-sm">👨‍⚕️</div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">{selectedAppt.doctor_name}</h3>
                <p className="text-xs text-slate-500 font-medium">Spesialis Umum</p>
              </div>
            </div>
            <StatusBadge status={selectedAppt.status} />
          </div>

          <div className="space-y-3.5 text-sm mb-6 px-1">
            <div className="grid grid-cols-3 gap-2 border-b border-slate-50 pb-2">
              <span className="text-slate-400 font-medium">Tanggal</span>
              <span className="col-span-2 font-semibold text-slate-800">
                {new Date(selectedAppt.appointment_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 border-b border-slate-50 pb-2">
              <span className="text-slate-400 font-medium">Waktu</span>
              <span className="col-span-2 font-semibold text-slate-800">{selectedAppt.schedule_time} WIB</span>
            </div>
            <div className="grid grid-cols-3 gap-2 border-b border-slate-50 pb-2">
              <span className="text-slate-400 font-medium">Lokasi Klinik</span>
              <span className="col-span-2 font-semibold text-slate-800">ClinicaLink Center</span>
            </div>
            <div className="grid grid-cols-3 gap-2 border-b border-slate-50 pb-2">
              <span className="text-slate-400 font-medium">Ruangan</span>
              <span className="col-span-2 font-semibold text-slate-800">{selectedAppt.room_number}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-400 font-medium">Catatan Keluhan</span>
              <span className="col-span-2 font-semibold text-slate-800">{selectedAppt.notes || "Tidak ada catatan"}</span>
            </div>
          </div>

          {(selectedAppt.status === 'Menunggu' || selectedAppt.status === 'Scheduled') && (
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => openModal('reschedule', selectedAppt)} className="flex-1 rounded-xl border border-indigo-600 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50/60 transition active:scale-95">
                Reschedule
              </button>
              <button onClick={() => handleCancelAppointment(selectedAppt.id)} className="flex-1 rounded-xl border border-red-200 text-red-500 py-2.5 text-sm font-bold hover:bg-red-50 transition active:scale-95">
                Batalkan Janji
              </button>
            </div>
          )}
        </ModalWrapper>
      )}

      {activeModal === 'reschedule' && selectedAppt && (
        <ModalWrapper onClose={() => setActiveModal(null)}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-lg font-bold text-slate-900">Reschedule Appointment</h2>
            <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"><X size={18} /></button>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Pilih Tanggal Baru</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Pilih Jam Baru</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-sm font-medium focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none appearance-none cursor-pointer transition">
                  <option value={selectedAppt.schedule_time}>{selectedAppt.schedule_time} WIB</option>
                  <option value="13:00 - 15:00">13:00 - 15:00 WIB (Sesi Siang)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <ChevronRight size={16} className="transform rotate-90" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button onClick={() => setActiveModal(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
              Batal
            </button>
            <button
              onClick={handleRescheduleSubmit}
              disabled={isProcessing}
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 shadow-md transition disabled:opacity-50 active:scale-95"
            >
              {isProcessing ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </ModalWrapper>
      )}

      {activeModal === 'success' && selectedAppt && (
        <ModalWrapper onClose={() => setActiveModal(null)}>
          <div className="flex flex-col items-center text-center p-2">
            <div className="h-14 w-14 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4 border border-green-100">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Jadwal Berhasil Diubah!</h2>
            <p className="text-sm text-slate-400">Appointment telah dijadwal ulang</p>

            <div className="w-full bg-slate-50/60 border border-slate-100 rounded-xl p-4 my-5 space-y-2.5 text-sm text-left">
              <div className="flex justify-between"><span className="text-slate-400 font-medium">Dokter</span><span className="font-semibold text-slate-800">{selectedAppt.doctor_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400 font-medium">Tanggal Baru</span><span className="font-semibold text-slate-800">{new Date(newDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
              <div className="flex justify-between"><span className="text-slate-400 font-medium">Waktu</span><span className="font-semibold text-slate-800">{selectedAppt.schedule_time} WIB</span></div>
            </div>

            <button onClick={() => setActiveModal(null)} className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 shadow-md transition active:scale-95">
              Selesai
            </button>
          </div>
        </ModalWrapper>
      )}
    </AppSidebarLayout>
  );
}

// ================= LAYOUT SUB-COMPONENTS =================

function AppointmentCard({ appt, onDetail, onReschedule, onCancel }) {
  const isWaiting = appt.status === 'Menunggu' || appt.status === 'Scheduled';

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition duration-200 items-center w-full">

      {/* Profil Dokter (4 Kolom) */}
      <div className="md:col-span-4 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-2xl border border-slate-100 shadow-sm">👨‍⚕️</div>
        <div className="space-y-0.5">
          <h3 className="font-bold text-slate-900 text-base leading-tight">{appt.doctor_name}</h3>
          <p className="text-xs font-semibold text-indigo-600">Klinik Umum</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-0.5 text-[11px] text-slate-500">
              <MapPin size={11} className="text-slate-400" /> ClinicaLink
            </span>
            <span className="flex items-center gap-0.5 text-[11px] text-slate-500 font-medium">
              <Star size={11} className="text-yellow-400 fill-yellow-400" /> 4.9
            </span>
          </div>
        </div>
      </div>

      {/* Detail Waktu & Lokasi (4 Kolom) */}
      <div className="md:col-span-4 grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0 md:border-l md:pl-5 text-sm text-slate-600 font-medium">
        <div className="flex items-center gap-2.5">
          <CalendarIcon size={15} className="text-slate-400 shrink-0" />
          <span>{new Date(appt.appointment_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Clock size={15} className="text-slate-400 shrink-0" />
          <span>{appt.schedule_time} WIB</span>
        </div>
        <div className="flex items-center gap-2.5">
          <svg className="text-slate-400 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          <span className="text-slate-500">{appt.room_number}</span>
        </div>
      </div>

      {/* Status & Tombol Aksi (4 Kolom) */}
      <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col gap-2.5 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0 items-start md:items-end w-full justify-end">
        <StatusBadge status={appt.status} />

        <div className="grid grid-cols-3 gap-1.5 w-full md:max-w-[210px]">
          <button onClick={onDetail} className="rounded-lg border border-indigo-200 px-2 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50/50 transition">
            Detail
          </button>
          {isWaiting ? (
            <>
              <button onClick={onReschedule} className="rounded-lg border border-indigo-200 px-2 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50/50 transition">
                Resched
              </button>
              <button onClick={onCancel} className="rounded-lg border border-red-200 px-2 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 transition">
                Batal
              </button>
            </>
          ) : (
            <div className="col-span-2"></div>
          )}
        </div>
      </div>

    </div>
  );
}

function ModalWrapper({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === 'Menunggu' || status === 'Scheduled') {
    return <span className="inline-flex rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-bold text-green-600">Dijadwalkan</span>;
  }
  if (status === 'Dibatalkan' || status === 'Cancelled') {
    return <span className="inline-flex rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-bold text-red-500">Dibatalkan</span>;
  }
  return <span className="inline-flex rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-500">{status}</span>;
}