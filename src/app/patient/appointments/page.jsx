"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase, waitForSupabaseUser } from "@/lib/supabase";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Star,
  ChevronLeft,
  ChevronRight,
  Bell,
  X,
  CheckCircle2,
  ListFilter
} from "lucide-react";

export default function PatientAppointmentsPage() {
  const router = useRouter();

  // State Data
  const [currentUser, setCurrentUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [sortOption, setSortOption] = useState("date-nearest"); // date-nearest, date-farthest, name-asc, name-desc
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // State Calendar
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonthView, setCurrentMonthView] = useState(new Date());

  // State Modal
  const [activeModal, setActiveModal] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null);

  // State Form Reschedule
  const [newDate, setNewDate] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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
      const { data: { user }, error: authError } = await waitForSupabaseUser();
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

  // Derived Data: Sorted & Paginated Appointments
  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const dateA = new Date(`${a.appointment_date}T${a.schedule_time.split(' - ')[0] || '00:00'}:00`);
      const dateB = new Date(`${b.appointment_date}T${b.schedule_time.split(' - ')[0] || '00:00'}:00`);
      
      switch (sortOption) {
        case "date-nearest":
          return dateA - dateB;
        case "date-farthest":
          return dateB - dateA;
        case "name-asc":
          return a.doctor_name.localeCompare(b.doctor_name);
        case "name-desc":
          return b.doctor_name.localeCompare(a.doctor_name);
        default:
          return 0;
      }
    });
  }, [appointments, sortOption]);

  const totalPages = Math.ceil(sortedAppointments.length / itemsPerPage);
  const paginatedAppointments = sortedAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Derived Data: Calendar
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust so Monday is 0
  };

  const currentYear = currentMonthView.getFullYear();
  const currentMonthIdx = currentMonthView.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonthIdx);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonthIdx);

  const prevMonthDays = getDaysInMonth(currentYear, currentMonthIdx - 1);
  const calendarCells = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarCells.push({ day: prevMonthDays - i, isCurrentMonth: false, date: new Date(currentYear, currentMonthIdx - 1, prevMonthDays - i) });
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({ day: i, isCurrentMonth: true, date: new Date(currentYear, currentMonthIdx, i) });
  }
  // Next month leading days (to fill 42 cells typically, or just complete the week)
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({ day: i, isCurrentMonth: false, date: new Date(currentYear, currentMonthIdx + 1, i) });
  }

  const handlePrevMonth = () => {
    setCurrentMonthView(new Date(currentYear, currentMonthIdx - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonthView(new Date(currentYear, currentMonthIdx + 1, 1));
  };

  const isSameDate = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };
  const today = new Date();
  
  // Derived Data: Selected Date Appointments
  const selectedDateAppointments = useMemo(() => {
    return appointments.filter(appt => {
      if (appt.status === 'Dibatalkan') return false;
      const apptDate = new Date(appt.appointment_date);
      return isSameDate(apptDate, selectedDate);
    });
  }, [appointments, selectedDate]);

  // Derived Data: Next Reminder
  const nextReminder = useMemo(() => {
    const upcoming = appointments
      .filter(appt => (appt.status === 'Menunggu' || appt.status === 'Scheduled' || appt.status === 'Confirmed' || appt.status === 'Akan Datang'))
      .filter(appt => {
        const apptDate = new Date(`${appt.appointment_date}T${appt.schedule_time.split(' - ')[0] || '00:00'}:00`);
        return apptDate >= new Date();
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.appointment_date}T${a.schedule_time.split(' - ')[0] || '00:00'}:00`);
        const dateB = new Date(`${b.appointment_date}T${b.schedule_time.split(' - ')[0] || '00:00'}:00`);
        return dateA - dateB;
      });
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [appointments]);

  const getReminderText = (reminderAppt) => {
    if (!reminderAppt) return null;
    const apptDate = new Date(reminderAppt.appointment_date);
    const timeDiff = apptDate.getTime() - new Date().setHours(0,0,0,0);
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff === 0) return "Hari Ini";
    if (daysDiff === 1) return "Besok";
    return `H-${daysDiff}`;
  };

  // Handlers
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-400 font-medium animate-pulse">Memuat Jadwal Konsultasi...</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start w-full">
        {/* ================= KOLOM KIRI (Daftar Janji Temu - 8 Kolom) ================= */}
        <div className="lg:col-span-8 space-y-6 w-full">
          <div className="flex items-center justify-between">
            <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Janji Temu</h1>
            <p className="text-gray-500 text-sm">Kelola daftar janji temu konsultasi Anda.</p>
          </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 shadow-sm transition active:scale-95"
              >
                <ListFilter size={16} />
                Urutkan
              </button>
              
              {isSortDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-100 bg-white shadow-lg py-1 z-20">
                  <button onClick={() => { setSortOption('date-nearest'); setIsSortDropdownOpen(false); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${sortOption === 'date-nearest' ? 'font-bold text-indigo-600' : 'text-slate-700'}`}>Waktu Terdekat</button>
                  <button onClick={() => { setSortOption('date-farthest'); setIsSortDropdownOpen(false); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${sortOption === 'date-farthest' ? 'font-bold text-indigo-600' : 'text-slate-700'}`}>Waktu Terjauh</button>
                  <button onClick={() => { setSortOption('name-asc'); setIsSortDropdownOpen(false); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${sortOption === 'name-asc' ? 'font-bold text-indigo-600' : 'text-slate-700'}`}>Dokter (A-Z)</button>
                  <button onClick={() => { setSortOption('name-desc'); setIsSortDropdownOpen(false); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${sortOption === 'name-desc' ? 'font-bold text-indigo-600' : 'text-slate-700'}`}>Dokter (Z-A)</button>
                </div>
              )}
            </div>
          </div>

          {/* Wrapper Card List */}
          <div className="space-y-4 w-full">
            {paginatedAppointments.length > 0 ? (
              paginatedAppointments.map((appt) => (
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
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 rounded-lg text-sm font-semibold transition ${
                    currentPage === page 
                      ? 'bg-indigo-600 text-white shadow-sm font-bold' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* ================= KOLOM KANAN (Widget Kalender - 4 Kolom) ================= */}
        <div className="lg:col-span-4 space-y-6 w-full">

          {/* Widget Kalender */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <button onClick={handlePrevMonth} className="rounded-lg p-1.5 hover:bg-slate-50 text-slate-600 transition"><ChevronLeft size={16} /></button>
              <span className="text-sm font-bold text-slate-800">
                {currentMonthView.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={handleNextMonth} className="rounded-lg p-1.5 hover:bg-slate-50 text-slate-600 transition"><ChevronRight size={16} /></button>
            </div>
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400">
              <div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div><div>Min</div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold text-slate-700">
              {calendarCells.map((cell, idx) => {
                const isSelected = isSameDate(cell.date, selectedDate);
                const isToday = isSameDate(cell.date, today);
                const hasAppt = appointments.some(a => a.status !== 'Dibatalkan' && isSameDate(new Date(a.appointment_date), cell.date));

                let btnClass = "rounded-lg p-1 transition cursor-pointer relative ";
                if (!cell.isCurrentMonth) {
                  btnClass += "text-slate-300 ";
                } else if (isSelected) {
                  btnClass += "bg-indigo-600 text-white shadow-md font-bold ";
                } else {
                  btnClass += "hover:bg-indigo-50 hover:text-indigo-600 ";
                  if (isToday) btnClass += "bg-slate-100 text-slate-900 font-bold ";
                }

                return (
                  <div 
                    key={idx} 
                    className={btnClass}
                    onClick={() => setSelectedDate(cell.date)}
                  >
                    {cell.day}
                    {hasAppt && !isSelected && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full"></span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Jadwal pada Tanggal yang Dipilih */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3">
              Jadwal {isSameDate(selectedDate, today) ? "Hari Ini" : selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
            </h3>
            {selectedDateAppointments.length > 0 ? (
              <div className="space-y-3">
                {selectedDateAppointments.map(appt => (
                  <div key={appt.id} className="flex items-center gap-3 text-sm">
                    <span className="font-semibold text-slate-800 w-24 shrink-0">{appt.schedule_time.split(' - ')[0]}</span>
                    <span className="text-slate-600 truncate">{appt.doctor_name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Tidak ada jadwal.</p>
            )}
          </div>

          {/* Reminder Card */}
          {nextReminder && (
            <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-red-50/60 p-5 shadow-sm">
              <div className="relative z-10 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-red-600">
                  <Bell size={16} /> Reminder berikutnya
                </div>
                <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-red-500 shadow-sm border border-red-100">
                  {getReminderText(nextReminder)}
                </span>
              </div>
              <p className="relative z-10 text-sm leading-relaxed text-slate-700">
                Konsultasi dengan <span className="font-bold text-slate-900">{nextReminder.doctor_name}</span><br />
                {new Date(nextReminder.appointment_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} pukul <span className="font-bold text-slate-900">{nextReminder.schedule_time.split(' - ')[0]} WIB</span> di {nextReminder.room_number}.
              </p>
            </div>
          )}
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
              <div className="flex h-11 w-11 shrink-0 overflow-hidden items-center justify-center rounded-full bg-white text-xl border border-slate-200 shadow-sm">
                {selectedAppt.doctor_img ? (
                  <img src={selectedAppt.doctor_img} alt={selectedAppt.doctor_name} className="h-full w-full object-cover" />
                ) : (
                  "👨‍⚕️"
                )}
              </div>
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

          {(selectedAppt.status === 'Menunggu' || selectedAppt.status === 'Scheduled' || selectedAppt.status === 'Akan Datang') && (
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
    </>
  );
}

// ================= LAYOUT SUB-COMPONENTS =================

function AppointmentCard({ appt, onDetail, onReschedule, onCancel }) {
  const isWaiting = appt.status === 'Menunggu' || appt.status === 'Scheduled' || appt.status === 'Akan Datang';

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition duration-200 items-center w-full">

      {/* Profil Dokter (4 Kolom) */}
      <div className="md:col-span-4 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 overflow-hidden items-center justify-center rounded-2xl bg-slate-50 text-2xl border border-slate-100 shadow-sm">
          {appt.doctor_img ? (
            <img src={appt.doctor_img} alt={appt.doctor_name} className="h-full w-full object-cover" />
          ) : (
            "👨‍⚕️"
          )}
        </div>
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
  if (status === 'Menunggu' || status === 'Scheduled' || status === 'Akan Datang') {
    return <span className="inline-flex rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-bold text-green-600">Dijadwalkan</span>;
  }
  if (status === 'Dibatalkan' || status === 'Cancelled') {
    return <span className="inline-flex rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-bold text-red-500">Dibatalkan</span>;
  }
  return <span className="inline-flex rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-500">{status}</span>;
}