"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
// HAPUS import AppSidebarLayout dari sini jika masih ada
import {
  CalendarCheck,
  Bell,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  CheckCircle2,
  CalendarDays
} from "lucide-react";

function generateTimeSlots(startTimeStr, endTimeStr, intervalMinutes = 30) {
  const slots = [];
  if (!startTimeStr || !endTimeStr) return slots;
  
  let [h, m] = startTimeStr.split(':').map(Number);
  let [eh, em] = endTimeStr.split(':').map(Number);
  let start = h * 60 + m;
  let end = eh * 60 + em;

  for (let time = start; time + intervalMinutes <= end; time += intervalMinutes) {
    const slotH = Math.floor(time / 60).toString().padStart(2, '0');
    const slotM = (time % 60).toString().padStart(2, '0');
    const nextTime = time + intervalMinutes;
    const nextH = Math.floor(nextTime / 60).toString().padStart(2, '0');
    const nextM = (nextTime % 60).toString().padStart(2, '0');
    slots.push({
      start_time: `${slotH}:${slotM}:00`,
      end_time: `${nextH}:${nextM}:00`,
      label: `${slotH}:${slotM} - ${nextH}:${nextM}`
    });
  }
  return slots;
}

export default function PatientDashboardPage() {
  const router = useRouter();

  // ================= STATE MANAGEMENT =================
  const [currentUser, setCurrentUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorSchedules, setDoctorSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasUnread, setHasUnread] = useState(true);

  const [bookingStep, setBookingStep] = useState(0);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [medicalNotes, setMedicalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctorAppointments, setDoctorAppointments] = useState([]);

  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  });

  const today = new Date();
  const currentMonthYear = today.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    month: 'long',
    year: 'numeric'
  });

  const next7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      fullDate: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('id-ID', { weekday: 'long' }),
      dateNum: d.getDate(),
      monthShort: d.toLocaleDateString('id-ID', { month: 'short' })
    };
  });

  // ================= DATA FETCHING =================
  const fetchDashboardData = async (userId) => {
    try {
      const apptRes = await fetch(`/api/appointments?patient_id=${userId}`, { cache: 'no-store' });
      if (apptRes.ok) {
        const apptData = await apptRes.json();
        setAppointments(Array.isArray(apptData.data) ? apptData.data : (apptData.data ? [apptData.data] : []));
      }

      const docRes = await fetch("/api/doctors", { cache: 'no-store' });
      if (docRes.ok) {
        const docData = await docRes.json();
        const docsArray = Array.isArray(docData.data) ? docData.data : [];
        setDoctors(docsArray.filter(doc => doc.is_active !== false));
      }

      const schedRes = await fetch("/api/doctorSchedules", { cache: 'no-store' });
      if (schedRes.ok) {
        const schedData = await schedRes.json();
        setDoctorSchedules(Array.isArray(schedData.data) ? schedData.data : []);
      }
    } catch (error) {
      console.error("Gagal memuat data dashboard:", error);
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

      const { data: userData } = await supabase.from("users").select("full_name").eq("id", user.id).single();
      
      const rawUser = localStorage.getItem("clinicalink:user") ?? sessionStorage.getItem("clinicalink:user");
      let storedName = null;
      if (rawUser) {
        try { storedName = JSON.parse(rawUser)?.full_name || JSON.parse(rawUser)?.name; } catch (e) {}
      }

      const fullName = storedName || userData?.full_name || user.user_metadata?.full_name || "Pasien";
      setCurrentUser({ id: user.id, name: fullName });

      await fetchDashboardData(user.id);
      
      const read = localStorage.getItem("notifications_read");
      setHasUnread(read !== "true");
      
      const handleStorage = () => {
        const r = localStorage.getItem("notifications_read");
        setHasUnread(r !== "true");
      };
      window.addEventListener("storage", handleStorage);
      
      setLoading(false);
    };
    initData();
  }, [router]);

  const handleOpenBooking = async (doc) => {
    setSelectedDoctor(doc);
    setSelectedDate(next7Days[0].fullDate);
    setSelectedSchedule(null);
    setMedicalNotes("");
    setDoctorAppointments([]);
    setBookingStep(1);

    try {
      const res = await fetch(`/api/appointments?doctor_id=${doc.id}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const appts = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []);
        setDoctorAppointments(appts);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const submitBooking = async () => {
    if (!selectedSchedule) return alert("Pilih jam jadwal terlebih dahulu.");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: currentUser.id,
          schedule_id: selectedSchedule.id,
          appointment_date: selectedDate,
          notes: medicalNotes,
          start_time: selectedSchedule.start_time,
          end_time: selectedSchedule.end_time
        })
      });

      if (res.ok) {
        setBookingStep(3);
        fetchDashboardData(currentUser.id);
      } else {
        const errData = await res.json();
        alert(errData.message || "Gagal membuat janji temu.");
      }
    } catch (error) {
      alert("Error menghubungi server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const upcomingAppointments = appointments.filter(a => a.status === "Menunggu" || a.status === "Scheduled");
  const completedAppointments = appointments.filter(a => a.status === "Selesai" || a.status === "Completed");

  // --- Dynamic Calendar Logic ---
  const currentMonthYearStr = currentCalendarMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  
  const handlePrevMonth = () => {
    setCurrentCalendarMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentCalendarMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Generate 42 days grid (6 weeks)
  const calendarDays = [];
  const year = currentCalendarMonth.getFullYear();
  const month = currentCalendarMonth.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  const firstDayWeekday = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
  
  // Padding previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i);
    calendarDays.push({ date: d, isCurrentMonth: false });
  }
  
  // Current month
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const d = new Date(year, month, i);
    calendarDays.push({ date: d, isCurrentMonth: true });
  }
  
  // Padding next month
  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    const d = new Date(year, month + 1, i);
    calendarDays.push({ date: d, isCurrentMonth: false });
  }

  // --- Daily Schedule & Reminder Logic ---
  const appointmentsOnSelectedDate = appointments.filter(a => {
    if (!a.appointment_date) return false;
    const aDate = a.appointment_date.split('T')[0];
    return aDate === selectedCalendarDate;
  });

  const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const validUpcomingAppts = upcomingAppointments
    .filter(a => (a.appointment_date?.split('T')[0] || "") >= todayStr)
    .sort((a, b) => {
      const dateA = a.appointment_date?.split('T')[0] || "";
      const dateB = b.appointment_date?.split('T')[0] || "";
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const timeA = a.schedule_time || "23:59:59";
      const timeB = b.schedule_time || "23:59:59";
      return timeA.localeCompare(timeB);
    });

  const nearestAppointment = validUpcomingAppts.length > 0 ? validUpcomingAppts[0] : null;
  let reminderLabel = "";
  if (nearestAppointment) {
    const apptDate = nearestAppointment.appointment_date.split('T')[0];
    const diffTime = Math.abs(new Date(apptDate) - new Date(todayStr));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) reminderLabel = "Hari Ini";
    else reminderLabel = `H-${diffDays}`;
  }

  // Jika loading, tidak perlu me-render AppSidebarLayout lagi di sini
  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <p className="text-slate-500 font-medium animate-pulse">Memuat Dashboard...</p>
      </div>
    );
  }

  return (
    <> {/* <-- Cukup gunakan Fragment atau <div> biasa sebagai pembungkus paling luar */}

      {/* GRID UTAMA */}
      <div className="flex flex-col lg:flex-row gap-8 w-full">

        {/* ================= KOLOM KIRI ================= */}
        <div className="flex-1 space-y-8 min-w-0">

          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 to-[#5E81CC] p-8 sm:p-10 text-white shadow-lg border border-indigo-400/30">
            <div className="relative z-10 w-full md:w-3/4">
              <h1 className="mb-3 text-3xl sm:text-4xl font-extrabold tracking-tight">
                Selamat Pagi, {currentUser?.name?.split(" ")[0]}!
              </h1>
              <p className="mb-6 text-indigo-100 font-medium leading-relaxed">
                Pantau kesehatanmu dan kelola jadwal konsultasi klinik hari ini dengan lebih mudah.
              </p>
              <button className="rounded-xl bg-white text-indigo-600 px-6 py-3 font-bold shadow-sm hover:bg-indigo-50 hover:scale-[1.02] transition-all active:scale-95">
                Mulai Booking Baru
              </button>
            </div>
            <div className="absolute -bottom-16 -right-16 h-80 w-80 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute -top-10 right-20 h-40 w-40 rounded-full bg-blue-300/20 blur-2xl"></div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={<CalendarCheck className="text-amber-500" size={24} />} title="Janji Temu Mendatang" value={upcomingAppointments.length} />
            <StatCard icon={<CheckCircle2 className="text-emerald-500" size={24} />} title="Konsultasi Selesai" value={completedAppointments.length} />
            <StatCard icon={<Bell className="text-rose-500" size={24} />} title="Notifikasi Baru" value={hasUnread ? 1 : 0} />
          </div>

          {/* Dokter Tersedia */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Dokter Tersedia</h2>
              <button className="text-sm font-bold text-indigo-600 hover:underline">Lihat Semua</button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {doctors.map((doc) => (
                <div key={doc.id} className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 border-4 border-white shadow-sm text-3xl group-hover:scale-110 transition-transform">
                    👨‍⚕️
                  </div>
                  <h3 className="font-bold text-slate-900 text-[15px]">{doc.full_name}</h3>
                  <p className="mb-4 text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">{doc.specialization_name || "Poli Umum"}</p>

                  <div className="w-full space-y-2 mt-auto">
                    <span className="block w-full rounded-lg bg-green-50 border border-green-200 py-1.5 text-[11px] font-extrabold text-green-600 uppercase tracking-wider">
                      Tersedia
                    </span>
                    <button
                      onClick={() => handleOpenBooking(doc)}
                      className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-md"
                    >
                      Booking
                    </button>
                  </div>
                </div>
              ))}
              {doctors.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                  Belum ada dokter yang tersedia saat ini.
                </div>
              )}
            </div>
          </div>

          {/* List Janji Temu Mendatang */}
          <div>
            <h2 className="mb-5 text-xl font-extrabold text-slate-800 tracking-tight">Jadwal Anda Selanjutnya</h2>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.slice(0, 3).map((appt) => (
                  <div key={appt.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center hover:border-indigo-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xl border border-indigo-100">👨‍⚕️</div>
                      <div>
                        <h3 className="font-bold text-slate-900">{appt.doctor_name}</h3>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{appt.room_number || "ClinicaLink Center"}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <CalendarDays size={16} className="text-indigo-500" />
                        {new Date(appt.appointment_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Clock size={16} className="text-indigo-500" />
                        {appt.schedule_time} WIB
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                Tidak ada janji temu terdekat.
              </div>
            )}
          </div>

        </div>

        {/* ================= KOLOM KANAN ================= */}
        <div className="w-full lg:w-[360px] shrink-0 space-y-8">

          {/* Widget Kalender */}
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden">
            <div className="mb-6 flex items-center justify-between relative z-10">
              <button onClick={handlePrevMonth} className="rounded-xl p-2 bg-slate-50 hover:bg-slate-100 transition shadow-sm"><ChevronLeft size={16} className="text-slate-600" /></button>
              <span className="text-[13px] font-extrabold text-slate-900">{currentMonthYearStr}</span>
              <button onClick={handleNextMonth} className="rounded-xl p-2 bg-slate-50 hover:bg-slate-100 transition shadow-sm"><ChevronRight size={16} className="text-slate-600" /></button>
            </div>
            
            <div className="mb-3 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider font-extrabold text-slate-400 relative z-10">
              <div>Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div>
            </div>
            
            <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center text-[13px] font-bold text-slate-700 relative z-10">
              {calendarDays.map((c, i) => {
                const dateStr = new Date(c.date.getTime() - c.date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                const isSelected = selectedCalendarDate === dateStr;
                const hasAppt = appointments.some(a => a.appointment_date?.split('T')[0] === dateStr);
                
                return (
                  <div 
                    key={i}
                    onClick={() => setSelectedCalendarDate(dateStr)}
                    className={`relative flex items-center justify-center rounded-[10px] w-full aspect-square cursor-pointer transition-all active:scale-95 ${
                      !c.isCurrentMonth ? "text-slate-300" : ""
                    } ${
                      isSelected 
                        ? "bg-[#5E81CC] text-white shadow-md font-extrabold scale-105" 
                        : "hover:bg-indigo-50 hover:text-[#5E81CC]"
                    }`}
                  >
                    <span>{c.date.getDate()}</span>
                    {hasAppt && !isSelected && (
                      <span className="absolute bottom-1 w-[4px] h-[4px] rounded-full bg-[#5E81CC]"></span>
                    )}
                    {hasAppt && isSelected && (
                      <span className="absolute bottom-1 w-[4px] h-[4px] rounded-full bg-white"></span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-7 border-t border-slate-100 pt-6 relative z-10">
              <h3 className="mb-4 text-[13px] font-extrabold text-slate-900 tracking-tight">
                {selectedCalendarDate === todayStr ? "Jadwal Hari ini" : `Jadwal ${new Date(selectedCalendarDate).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}`}
              </h3>
              
              <div className="space-y-3">
                {appointmentsOnSelectedDate.length > 0 ? (
                  appointmentsOnSelectedDate.map(appt => (
                    <div key={appt.id} className="flex items-start gap-4 rounded-[16px] border border-slate-100 bg-slate-50 p-3 hover:border-indigo-100 hover:bg-white transition-all hover:shadow-sm">
                      <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white text-[#5E81CC] shrink-0 shadow-sm border border-slate-100">
                         <Clock size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                           <p className="text-[13px] font-extrabold text-slate-900">{appt.schedule_time} WIB</p>
                           <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${appt.status === 'Selesai' || appt.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-[#5E81CC]'}`}>{appt.status}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 mt-1 truncate">{appt.doctor_name}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-400 font-bold py-4 text-center border border-dashed border-slate-200 rounded-[16px] bg-slate-50/50">Tidak ada jadwal.</p>
                )}
              </div>
              
              <div className="mt-5 text-center">
                 <button onClick={() => router.push('/patient/appointments')} className="text-[11px] font-extrabold text-[#5E81CC] hover:underline hover:text-indigo-700 transition-colors">Lihat Semua</button>
              </div>
            </div>
            
            {/* Dekorasi blur background */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none"></div>
          </div>
          
          {/* Widget Reminder */}
          {nearestAppointment && (
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-rose-100 transition-colors duration-500 pointer-events-none"></div>
               
               <div className="flex items-start justify-between mb-4 relative z-10">
                 <div className="flex items-center gap-2">
                    <Bell className="w-[18px] h-[18px] text-rose-500 animate-[bounce_3s_infinite]" />
                    <h3 className="text-[13px] font-extrabold text-slate-900">Reminder</h3>
                 </div>
                 <span className="bg-rose-100 text-rose-600 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">{reminderLabel}</span>
               </div>
               
               <p className="text-[13px] font-bold text-slate-600 leading-relaxed relative z-10 mb-4 pr-6">
                 Jangan lupa appointment dengan <span className="text-slate-900 font-extrabold">{nearestAppointment.doctor_name}</span> {reminderLabel === 'Hari Ini' ? 'hari ini' : reminderLabel === 'H-1' ? 'besok' : 'nanti'} pukul <span className="text-slate-900 font-extrabold">{nearestAppointment.schedule_time} WIB</span>.
               </p>
               
               <div className="w-full flex justify-end relative z-10 -mt-2">
                 <CalendarDays className="w-12 h-12 text-slate-100 group-hover:text-rose-100 transition-colors opacity-80 -mb-2 -mr-2" strokeWidth={1.5} />
               </div>
            </div>
          )}

        </div>

      </div>

      {/* ================= MODAL BOOKING MANAGER ================= */}
      {bookingStep > 0 && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-[480px] rounded-3xl bg-white p-6 shadow-2xl">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {bookingStep === 1 && "Pilih Jadwal Konsultasi"}
                {bookingStep === 2 && "Detail Keluhan"}
                {bookingStep === 3 && "Berhasil!"}
              </h2>
              {bookingStep < 3 && (
                <button onClick={() => setBookingStep(0)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                  <X size={20} />
                </button>
              )}
            </div>

            {/* STEP 1 */}
            {bookingStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm border border-slate-200">👨‍⚕️</div>
                  <div>
                    <h3 className="font-bold text-slate-900">{selectedDoctor.full_name}</h3>
                    <p className="text-xs font-medium text-slate-500">{selectedDoctor.specialization_name || "Klinik Umum"}</p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-bold text-slate-900">Pilih Tanggal</h4>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                    {next7Days.map((d) => (
                      <button
                        key={d.fullDate}
                        onClick={() => { setSelectedDate(d.fullDate); setSelectedSchedule(null); }}
                        className={`flex min-w-[70px] flex-col items-center justify-center rounded-2xl border p-3 transition-all ${selectedDate === d.fullDate
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                          : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
                          }`}
                      >
                        <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${selectedDate === d.fullDate ? "text-indigo-100" : "text-slate-400"}`}>{d.monthShort}</span>
                        <span className="text-lg font-extrabold">{d.dateNum}</span>
                        <span className={`text-xs font-medium ${selectedDate === d.fullDate ? "text-indigo-100" : "text-slate-500"}`}>{d.dayName}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-bold text-slate-900">Waktu Tersedia</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {(() => {
                      // Gunakan UTC agar tidak terjadi shift tanggal akibat timezone
                      const [syear, smonth, sday] = selectedDate.split('-').map(Number);
                      const selectedDayOfWeek = new Date(Date.UTC(syear, smonth - 1, sday)).getUTCDay();
                      const schedulesForToday = doctorSchedules.filter(
                        s => s.doctor_id === selectedDoctor.id && s.day_of_week === selectedDayOfWeek
                      );

                      if (schedulesForToday.length > 0) {
                        return schedulesForToday.map(sched => {
                          const slots = generateTimeSlots(sched.start_time, sched.end_time, sched.slot_duration_minutes || 30);
                          
                          return (
                            <div key={sched.id} className="col-span-2 grid grid-cols-2 gap-3">
                              {slots.map(slot => {
                                const isBooked = doctorAppointments.some(
                                  a => {
                                    const dateMatch = a.appointment_date?.split('T')[0] === selectedDate?.split('T')[0];
                                    const timeMatch = a.start_time?.substring(0, 5) === slot.start_time.substring(0, 5);
                                    const statusMatch = !['Dibatalkan', 'Selesai', 'Cancelled', 'Completed'].includes(a.status);
                                    return dateMatch && timeMatch && statusMatch;
                                  }
                                );
                                
                                return (
                                  <button
                                    key={slot.start_time}
                                    onClick={() => !isBooked && setSelectedSchedule({ ...sched, start_time: slot.start_time, end_time: slot.end_time })}
                                    disabled={isBooked}
                                    className={`flex flex-col items-center justify-center rounded-xl border py-2 text-sm font-bold transition-all ${
                                      isBooked 
                                        ? "bg-amber-50 border-amber-300 text-amber-700 cursor-not-allowed"
                                        : selectedSchedule?.start_time === slot.start_time && selectedSchedule?.id === sched.id
                                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                                          : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                                    }`}
                                  >
                                    <span>{slot.label}</span>
                                    {isBooked ? (
                                      <span className="block text-[10px] text-amber-600 mt-0.5 font-semibold">Sudah ada janji</span>
                                    ) : (
                                      <span className="block text-[10px] text-transparent mt-0.5 font-semibold select-none">Tersedia</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        });
                      } else {
                        return (
                          <div className="col-span-2 text-sm text-center py-4 text-slate-500 border border-dashed rounded-xl border-slate-300">
                            Tidak ada jadwal praktik dokter di hari ini.
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>

                <button
                  onClick={() => setBookingStep(2)}
                  disabled={!selectedSchedule}
                  className="w-full mt-4 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  Selanjutnya
                </button>
              </div>
            )}

            {/* STEP 2 */}
            {bookingStep === 2 && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Tanggal</span>
                    <span className="font-bold text-slate-900">{new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Waktu</span>
                    <span className="font-bold text-slate-900">{selectedSchedule.start_time} - {selectedSchedule.end_time} WIB</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Dokter</span>
                    <span className="font-bold text-slate-900">{selectedDoctor.full_name}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Detail Keluhan (Opsional)</label>
                  <textarea
                    rows={4}
                    placeholder="Tuliskan keluhan yang Anda rasakan..."
                    value={medicalNotes}
                    onChange={(e) => setMedicalNotes(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setBookingStep(1)} className="w-1/3 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                    Kembali
                  </button>
                  <button
                    onClick={submitBooking}
                    disabled={isSubmitting}
                    className="w-2/3 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Memproses..." : "Konfirmasi Booking"}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {bookingStep === 3 && (
              <div className="flex flex-col items-center text-center p-4">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 border-4 border-emerald-100">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="mb-2 text-2xl font-extrabold text-slate-900 tracking-tight">Booking Berhasil!</h2>
                <p className="mb-8 text-sm text-slate-500 font-medium leading-relaxed">
                  Janji temu Anda dengan <span className="text-slate-800 font-bold">{selectedDoctor.full_name}</span> telah berhasil dijadwalkan.
                </p>
                <button
                  onClick={() => setBookingStep(0)}
                  className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  Lihat Janji Temu
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
        {icon}
      </div>
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
      </div>
    </div>
  );
}