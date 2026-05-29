"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, waitForSupabaseUser } from "@/lib/supabase";
import calendarCheckIcon from "@/app/icons/calenderCheck.svg";
import clockIcon from "@/app/icons/clock.svg";
import {
  CalendarDays,
  ChevronDown,
  Clock,
  MapPin,
  X,
  XCircle,
  CheckCircle2,
} from "lucide-react";

function formatDateLabel(rawDate) {
  if (!rawDate) return "-";
  const date = new Date(rawDate);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimeLabel(time) {
  if (!time) return "-";
  return time.substring(0, 5).replace(":", ".");
}

function getStatusClasses(status) {
  const normalized = (status || "").toLowerCase();
  if (normalized === "selesai") return "bg-emerald-50 text-emerald-700";
  if (normalized === "dibatalkan") return "bg-rose-50 text-rose-700";
  if (normalized === "menunggu") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function generateTimeSlots(startTimeStr, endTimeStr, intervalMinutes = 30) {
  const slots = [];
  if (!startTimeStr || !endTimeStr) return slots;

  let [h, m] = startTimeStr.split(":").map(Number);
  let [eh, em] = endTimeStr.split(":").map(Number);
  let start = h * 60 + m;
  let end = eh * 60 + em;

  for (let time = start; time + intervalMinutes <= end; time += intervalMinutes) {
    const slotH = Math.floor(time / 60).toString().padStart(2, "0");
    const slotM = (time % 60).toString().padStart(2, "0");
    const nextTime = time + intervalMinutes;
    const nextH = Math.floor(nextTime / 60).toString().padStart(2, "0");
    const nextM = (nextTime % 60).toString().padStart(2, "0");
    slots.push({
      start_time: `${slotH}:${slotM}:00`,
      end_time: `${nextH}:${nextM}:00`,
      label: `${slotH}.${slotM} - ${nextH}.${nextM} WIB`,
    });
  }

  return slots;
}

export default function PatientHistoryPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorSchedules, setDoctorSchedules] = useState([]);
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState("Klinik Dipo 1");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data, error } = await waitForSupabaseUser();
      if (error || !data?.user) {
        router.push("/login");
        return;
      }
      setCurrentUser(data.user);

      try {
        const res = await fetch(`/api/appointments?patient_id=${data.user.id}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const body = await res.json();
          const list = Array.isArray(body.data) ? body.data : [];
          
          // Virtual Status: Dibatalkan jika Menunggu > 4 jam
          const now = new Date().getTime();
          const updatedList = list.map(appt => {
            if (appt.status === "Menunggu" && appt.appointment_date && appt.start_time) {
               const dateStr = appt.appointment_date.split('T')[0];
               const timeStr = appt.start_time;
               const apptTime = new Date(`${dateStr}T${timeStr}`).getTime();
               if (now - apptTime > 4 * 60 * 60 * 1000) {
                 return { ...appt, status: "Dibatalkan" };
               }
            }
            return appt;
          });
          
          setAppointments(updatedList);
        }
      } catch (err) {
        console.error("Gagal memuat history:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const dateA = new Date(a.appointment_date || "");
      const dateB = new Date(b.appointment_date || "");
      return dateB - dateA;
    });
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return sortedAppointments;
    return sortedAppointments.filter((appt) => {
      const value = `${appt.doctor_name || ""} ${appt.status || ""} ${appt.room_number || ""} ${appt.complaints || ""}`.toLowerCase();
      return value.includes(normalized);
    });
  }, [searchQuery, sortedAppointments]);

  const stats = useMemo(() => {
    const total = appointments.length;
    const selesai = appointments.filter((appt) => appt.status === "Selesai").length;
    const dibatalkan = appointments.filter((appt) => appt.status === "Dibatalkan").length;
    const menunggu = appointments.filter((appt) => appt.status === "Menunggu").length;
    return { total, selesai, dibatalkan, menunggu };
  }, [appointments]);

  const latestConsultation = useMemo(() => {
    return sortedAppointments[0] || null;
  }, [sortedAppointments]);

  const openDetail = (appt) => {
    setSelectedAppointment(appt);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setSelectedAppointment(null);
    setIsDetailOpen(false);
  };

  const loadDoctorBookingData = async (doctorPayload) => {
    try {
      setDoctorSchedules([]);
      setDoctorAppointments([]);
      const docId = doctorPayload.doctor_id;
      const [schedulesRes, appointmentsRes] = await Promise.all([
        fetch(`/api/doctorSchedules?doctor_id=${docId}`, { cache: "no-store" }),
        fetch(`/api/appointments?doctor_id=${docId}`, { cache: "no-store" }),
      ]);

      if (schedulesRes.ok) {
        const body = await schedulesRes.json();
        setDoctorSchedules(Array.isArray(body.data) ? body.data : []);
      }
      if (appointmentsRes.ok) {
        const body = await appointmentsRes.json();
        setDoctorAppointments(Array.isArray(body.data) ? body.data : []);
      }
    } catch (err) {
      console.error("Gagal memuat data booking dokter:", err);
    }
  };

  const openBookingModal = async (appt) => {
    const doctorPayload = {
      doctor_id: appt.doctor_id,
      doctor_name: appt.doctor_name,
      doctor_img: appt.doctor_img,
    };

    setSelectedDoctor(doctorPayload);
    setSelectedDate("");
    setSelectedSchedule(null);
    setMedicalNotes("");
    setBookingStep(1);
    setIsBookingModalOpen(true);
    await loadDoctorBookingData(doctorPayload);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedDoctor(null);
    setDoctorSchedules([]);
    setDoctorAppointments([]);
    setSelectedDate("");
    setSelectedSchedule(null);
    setMedicalNotes("");
    setBookingStep(1);
  };

  const handleBookingSubmit = async () => {
    if (!selectedDate || !selectedSchedule) {
      alert("Pilih tanggal dan jam terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: currentUser?.id,
          schedule_id: selectedSchedule.id,
          appointment_date: selectedDate,
          complaints: medicalNotes,
          start_time: selectedSchedule.start_time,
          end_time: selectedSchedule.end_time,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        alert(body.message || "Gagal membuat janji temu.");
        return;
      }

      const body = await res.json();
      setBookingStep(2);
      const refreshRes = await fetch(`/api/appointments?patient_id=${currentUser?.id}`, {
        cache: "no-store",
      });
      if (refreshRes.ok) {
        const refreshBody = await refreshRes.json();
        setAppointments(Array.isArray(refreshBody.data) ? refreshBody.data : []);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal membuat janji temu, silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const bookingDateValue = selectedDate;
  const availableSchedules = selectedDate
    ? doctorSchedules.filter((item) => item.day_of_week === new Date(selectedDate).getDay())
    : [];

  const todayString = new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full px-4 py-10">
        <div className="text-slate-500 font-semibold animate-pulse">Memuat riwayat konsultasi...</div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Riwayat Konsultasi</h1>
        <p className="text-gray-500 text-sm">
          Lihat seluruh riwayat konsultasi dan daftar janji temu Anda.
        </p>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left: List */}
        <div className="flex-1 min-w-0">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#5E81CC] shrink-0">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500">Total Konsultasi</p>
                <p className="text-2xl font-black text-slate-900">{stats.total}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500">Janji Temu Selesai</p>
                <p className="text-2xl font-black text-slate-900">{stats.selesai}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500">Dibatalkan</p>
                <p className="text-2xl font-black text-slate-900">{stats.dibatalkan}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {filteredAppointments.length === 0 ? (
              <div className="rounded-2xl bg-white border border-dashed border-slate-200 p-10 text-center text-slate-500 font-bold">
                Belum ada riwayat janji temu.
              </div>
            ) : (
              filteredAppointments.map((appt) => {
                const isCancelled = appt.status === "Dibatalkan";
                return (
                  <div key={appt.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-5">
                    {/* Foto dokter */}
                    <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <img
                        src={appt.doctor_img || `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.doctor_name || "Doctor")}&background=cbd5e1&color=fff&size=256`}
                        alt={appt.doctor_name || "Doctor"}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Info dokter */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-extrabold text-slate-900 truncate">{appt.doctor_name}</p>
                      <p className="text-[12px] font-bold text-[#5E81CC] mb-1.5">{appt.specialization_name || "Spesialis Umum"}</p>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>ClinicaLink</span>
                      </div>
                    </div>

                    {/* Info jadwal */}
                    <div className="hidden md:flex flex-col gap-1.5 min-w-[180px] shrink-0">
                      <div className="flex items-center gap-2 text-[12px] font-bold text-slate-700">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDateLabel(appt.appointment_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] font-bold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{`${formatTimeLabel(appt.start_time)} - ${formatTimeLabel(appt.end_time)} WIB`}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{appt.room_number || "-"}</span>
                      </div>
                    </div>

                    {/* Status + Aksi */}
                    <div className="flex flex-col items-end gap-2 shrink-0 ml-auto">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${getStatusClasses(appt.status)}`}>
                        {appt.status}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => openDetail(appt)}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-extrabold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          Lihat Detail
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full xl:w-[300px] flex flex-col gap-5 shrink-0">
          {/* Konsultasi Terakhir */}
          <div className="rounded-2xl bg-[#EFF3FF] border border-indigo-100 p-5 shadow-sm">
            <h3 className="text-[13px] font-extrabold text-slate-800 mb-4">Konsultasi Terakhir</h3>
            {latestConsultation ? (
              <div className="space-y-4">
                {/* Foto dokter */}
                <div className="flex justify-center">
                  <div className="w-[90px] h-[90px] rounded-full overflow-hidden border-4 border-white shadow-md">
                    <img
                      src={latestConsultation.doctor_img || `https://ui-avatars.com/api/?name=${encodeURIComponent(latestConsultation.doctor_name || "Doctor")}&background=cbd5e1&color=fff&size=256`}
                      alt={latestConsultation.doctor_name || "Doctor"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-extrabold text-slate-900">{latestConsultation.doctor_name}</p>
                  <p className="text-[12px] font-bold text-slate-500">{latestConsultation.specialization_name || "Dokter Umum"}</p>
                </div>
                {/* Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5">
                    <CalendarDays className="w-4 h-4 text-[#5E81CC] shrink-0" />
                    <span className="text-[12px] font-bold text-slate-700">{formatDateLabel(latestConsultation.appointment_date)}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5">
                    <Clock className="w-4 h-4 text-[#5E81CC] shrink-0" />
                    <span className="text-[12px] font-bold text-slate-700">{`${formatTimeLabel(latestConsultation.start_time)} - ${formatTimeLabel(latestConsultation.end_time)} WIB`}</span>
                  </div>
                </div>
                {/* Status */}
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold ${getStatusClasses(latestConsultation.status)}`}>
                    <span className="w-2 h-2 rounded-full bg-current" />
                    {latestConsultation.status}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[12px] font-bold text-slate-400 text-center py-4">Belum ada konsultasi.</p>
            )}
          </div>

          {/* Butuh Bantuan */}
          <div className="rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#FDE68A] flex items-center justify-center text-[#B45309] text-lg shrink-0">?</div>
              <div className="text-right">
                <p className="text-[13px] font-extrabold text-slate-900">Butuh Bantuan?</p>
                <p className="text-[11px] font-semibold text-slate-600">Hubungi kami jika ada pertanyaan atau kendala</p>
              </div>
            </div>
            <button className="w-full rounded-xl bg-white px-4 py-2.5 text-[12px] font-extrabold text-[#B45309] hover:bg-amber-50 transition-colors border border-[#FDE68A]">
              Hubungi Support
            </button>
          </div>
        </div>
      </div>

      {isDetailOpen && selectedAppointment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-[24px] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Detail Konsultasi</h2>
                <p className="text-sm font-bold text-slate-500">Riwayat konsultasi pasien</p>
              </div>
              <button onClick={closeDetail} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100">
                  <img
                    src={selectedAppointment.doctor_img || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAppointment.doctor_name || "Doctor")}&background=cbd5e1&color=fff&size=256`}
                    alt={selectedAppointment.doctor_name || "Doctor"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-900">{selectedAppointment.doctor_name}</p>
                  <p className="text-sm font-bold text-slate-500">Dokter Umum</p>
                </div>
                <div className={`ml-auto rounded-full px-3 py-1 text-[11px] font-extrabold ${getStatusClasses(selectedAppointment.status)}`}>
                  {selectedAppointment.status}
                </div>
              </div>

              <div className="grid gap-4 text-sm text-slate-700">
                <div className="grid grid-cols-[110px_1fr] gap-4">
                  <span className="font-bold text-slate-500">Tanggal</span>
                  <span>{formatDateLabel(selectedAppointment.appointment_date)}</span>
                </div>
                <div className="grid grid-cols-[110px_1fr] gap-4">
                  <span className="font-bold text-slate-500">Waktu</span>
                  <span>{`${formatTimeLabel(selectedAppointment.start_time)} - ${formatTimeLabel(selectedAppointment.end_time)} WIB`}</span>
                </div>
                <div className="grid grid-cols-[110px_1fr] gap-4">
                  <span className="font-bold text-slate-500">Ruangan</span>
                  <span>{selectedAppointment.room_number || "-"}</span>
                </div>
                <div className="grid grid-cols-[110px_1fr] gap-4">
                  <span className="font-bold text-slate-500">Keluhan</span>
                  <span>{selectedAppointment.complaints || "-"}</span>
                </div>
                <div className="grid grid-cols-[110px_1fr] gap-4">
                  <span className="font-bold text-slate-500">Diagnosis</span>
                  <span>{selectedAppointment.notes || "Karies gigi ringan"}</span>
                </div>
                <div className="grid grid-cols-[110px_1fr] gap-4">
                  <span className="font-bold text-slate-500">Saran</span>
                  <span>Hindari makanan manis dan lakukan penambalan gigi.</span>
                </div>
                <div className="grid grid-cols-[110px_1fr] gap-4">
                  <span className="font-bold text-slate-500">Resep</span>
                  <span>Paracetamol, Mouthwash</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    closeDetail();
                    openBookingModal(selectedAppointment);
                  }}
                  className="flex-1 rounded-[18px] bg-[#5E81CC] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#4D6FB5] transition-colors"
                >
                  Buat Janji Lagi
                </button>
                <button
                  onClick={closeDetail}
                  className="flex-1 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isBookingModalOpen && selectedDoctor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-[24px] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Buat Janji Temu</h2>
                <p className="text-sm font-bold text-slate-500">Pilih tanggal, jam, dan buat janji baru dengan dokter.</p>
              </div>
              <button onClick={closeBookingModal} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingStep === 1 && (
              <div className="px-6 py-6 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-none">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100">
                    <img
                      src={selectedDoctor.doctor_img || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDoctor.doctor_name || "Doctor")}&background=cbd5e1&color=fff&size=256`}
                      alt={selectedDoctor.doctor_name || "Doctor"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-slate-900">{selectedDoctor.doctor_name}</p>
                    <p className="text-sm font-bold text-slate-500">Dokter Umum</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-extrabold text-slate-900">Tanggal</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 pl-4 flex items-center">
                        <CalendarDays className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="date"
                        value={bookingDateValue}
                        min={todayString}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setSelectedSchedule(null);
                        }}
                        className="w-full rounded-[18px] border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-100 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-extrabold text-slate-900">Jam</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 pl-4 flex items-center">
                        <Clock className="w-4 h-4 text-slate-400" />
                      </div>
                      <select
                        value={selectedSchedule?.start_time || ""}
                        onChange={(e) => {
                          const slot = e.target.value;
                          const slotPayload = e.target.selectedOptions[0]?.dataset?.slot;
                          if (!slot || !slotPayload) {
                            setSelectedSchedule(null);
                            return;
                          }
                          setSelectedSchedule(JSON.parse(slotPayload));
                        }}
                        disabled={!selectedDate}
                        className="w-full rounded-[18px] border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm font-bold text-slate-700 outline-none focus:border-indigo-100 focus:ring-2 focus:ring-indigo-100 appearance-none"
                      >
                        <option value="">Pilih Jam</option>
                        {selectedDate && availableSchedules.length === 0 && (
                          <option disabled>Tidak ada jadwal dokter di hari terpilih</option>
                        )}
                        {availableSchedules.map((schedule) => {
                          const slots = generateTimeSlots(
                            schedule.start_time,
                            schedule.end_time,
                            schedule.slot_duration_minutes || 30
                          );

                          return slots.map((slot) => {
                            const alreadyBooked = doctorAppointments.some(
                              (appt) =>
                                appt.appointment_date?.split("T")[0] === selectedDate &&
                                appt.start_time?.substring(0, 5) === slot.start_time.substring(0, 5) &&
                                appt.status !== "Dibatalkan"
                            );

                            const isPast = selectedDate === todayString && (() => {
                              const [sh, sm] = slot.start_time.split(":").map(Number);
                              const now = new Date();
                              return sh < now.getHours() || (sh === now.getHours() && sm <= now.getMinutes());
                            })();

                            const optionPayload = JSON.stringify({
                              id: schedule.id,
                              start_time: slot.start_time,
                              end_time: slot.end_time,
                              room_number: schedule.room_number || "-",
                            });

                            return (
                              <option
                                key={`${schedule.id}-${slot.start_time}`}
                                value={slot.start_time}
                                data-slot={optionPayload}
                                disabled={alreadyBooked || isPast}
                              >
                                {slot.label} {alreadyBooked ? "(Penuh)" : isPast ? "(Lewat)" : ""}
                              </option>
                            );
                          });
                        })}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-extrabold text-slate-900">Lokasi</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 pl-4 flex items-center">
                        <MapPin className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={selectedLocation}
                        readOnly
                        className="w-full rounded-[18px] border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none cursor-default"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-extrabold text-slate-900">Keluhan</label>
                    <textarea
                      rows={4}
                      value={medicalNotes}
                      onChange={(e) => setMedicalNotes(e.target.value)}
                      placeholder="Contoh: Sakit gigi sebelah kanan sejak 2 hari yang lalu."
                      className="w-full rounded-[18px] border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-100 focus:ring-2 focus:ring-indigo-100 resize-none"
                    />
                    <p className="mt-2 text-right text-[11px] font-semibold text-slate-400">{medicalNotes.length}/200</p>
                  </div>
                </div>

                <button
                  onClick={handleBookingSubmit}
                  disabled={isSubmitting}
                  className="w-full rounded-[18px] bg-[#5E81CC] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#4D6FB5] transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? "Memproses..." : "Konfirmasi Janji Temu"}
                </button>
              </div>
            )}

            {bookingStep === 2 && (
              <div className="px-8 py-10 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="mb-2 text-2xl font-extrabold text-slate-900">Janji Temu Berhasil!</h2>
                <p className="mb-8 text-sm font-bold text-slate-500">Janji temu Anda berhasil dibuat. Silakan cek halaman appointment untuk detail.</p>

                <div className="grid gap-4 text-left text-sm text-slate-700">
                  <div className="grid grid-cols-[100px_1fr] gap-4">
                    <span className="font-bold text-slate-500">Dokter</span>
                    <span>{selectedDoctor.doctor_name}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-4">
                    <span className="font-bold text-slate-500">Tanggal</span>
                    <span>{formatDateLabel(selectedDate)}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-4">
                    <span className="font-bold text-slate-500">Jam</span>
                    <span>{selectedSchedule ? `${formatTimeLabel(selectedSchedule.start_time)} - ${formatTimeLabel(selectedSchedule.end_time)} WIB` : "-"}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-4">
                    <span className="font-bold text-slate-500">Lokasi</span>
                    <span>{selectedLocation}</span>
                  </div>
                </div>

                <div className="mt-8 grid gap-3">
                  <button
                    onClick={() => {
                      closeBookingModal();
                      router.push("/patient/appointments");
                    }}
                    className="w-full rounded-[18px] bg-[#5E81CC] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#4D6FB5] transition-colors"
                  >
                    Lihat Appointment
                  </button>
                  <button
                    onClick={closeBookingModal}
                    className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
