"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase, waitForSupabaseUser } from "@/lib/supabase";
import CalendarWidget from "@/components/CalendarWidget";
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
  ListFilter,
  Trash2,
  CalendarCheck,
  CalendarDays,
  Loader2
} from "lucide-react";

// ── Virtual State Logic ─────────
function computeVirtualStatus(appt) {
  const now = new Date();
  const apptDate = (appt.appointment_date || "").split("T")[0];
  const endTime = appt.end_time;

  if (!apptDate || !endTime) return appt.status;

  const endDateTime = new Date(`${apptDate}T${endTime}`);

  // Rule 3: Awaiting notes
  if (appt.status === "Sedang Berlangsung" && now > endDateTime && !appt.notes) {
    return "Menunggu Catatan Dokter";
  }

  return appt.status;
}

export default function PatientAppointmentsPage() {
  const router = useRouter();

  // State Data
  const [currentUser, setCurrentUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [sortOption, setSortOption] = useState("date-newest"); // date-newest, date-oldest, name-asc, name-desc
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // State Calendar
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonthView, setCurrentMonthView] = useState(new Date());

  // State Modal
  const [activeModal, setActiveModal] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [cancelConfirmApptId, setCancelConfirmApptId] = useState(null);
  const [isCanceling, setIsCanceling] = useState(false);

  // State Form Reschedule
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [rescheduleDoctor, setRescheduleDoctor] = useState(null);
  const [rescheduleSchedules, setRescheduleSchedules] = useState([]);
  const [rescheduleAppointments, setRescheduleAppointments] = useState([]);
  const [isLoadingReschedule, setIsLoadingReschedule] = useState(false);

  const fetchAppointments = async (userId) => {
    try {
      const res = await fetch(`/api/appointments?patient_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.data) ? data.data : [];
        // Filter active only
        const activeList = list.filter(a => a.status !== "Selesai" && a.status !== "Dibatalkan" && a.status !== "Dibatalkan Admin");
        // Enrich with virtual status
        const enriched = activeList.map(appt => ({
          ...appt,
          virtualStatus: computeVirtualStatus(appt),
        }));
        setAppointments(enriched);
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

  const isSameDate = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };
  
  const isSameDateStr = (dateStr, dateObj) => {
    if (!dateStr) return false;
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
    return y === dateObj.getFullYear() && (m - 1) === dateObj.getMonth() && d === dateObj.getDate();
  };

  const today = new Date();

  // Derived Data: Sorted & Paginated Appointments
  const sortedAppointments = useMemo(() => {
    let result = [...appointments];
    if (selectedDate) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      const selectedStr = `${y}-${m}-${d}`;
      result = result.filter(appt => {
        const apptDateStr = (appt.appointment_date || '').split('T')[0];
        return apptDateStr === selectedStr;
      });
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(appt => appt.doctor_name.toLowerCase().includes(q));
    }
    
    return result.sort((a, b) => {
      const dateA = new Date(`${a.appointment_date}T${a.schedule_time.split(' - ')[0] || '00:00'}:00`);
      const dateB = new Date(`${b.appointment_date}T${b.schedule_time.split(' - ')[0] || '00:00'}:00`);
      
      switch (sortOption) {
        case "date-newest":
          return dateA - dateB;
        case "date-oldest":
          return dateB - dateA;
        case "name-asc":
          return a.doctor_name.localeCompare(b.doctor_name);
        case "name-desc":
          return b.doctor_name.localeCompare(a.doctor_name);
        default:
          return 0;
      }
    });
  }, [appointments, sortOption, selectedDate]);

  const totalPages = Math.ceil(sortedAppointments.length / itemsPerPage);
  const paginatedAppointments = sortedAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleMonthChange = (delta) => {
    setCurrentMonthView(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + delta);
      return newMonth;
    });
  };

  const selectedDateAppointments = useMemo(() => {
    const filterObj = selectedDate || today;
    return appointments.filter(appt => {
      return isSameDateStr(appt.appointment_date, filterObj);
    });
  }, [appointments, selectedDate, today]);

  // Derived Data: Next Reminder
  const nextReminder = useMemo(() => {
    const upcoming = appointments
      .filter(appt => appt.virtualStatus === 'Menunggu')
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

  const next7Days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return {
        dateObj: d,
        dateStr: localDateStr,
        dayName: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][d.getDay()],
        dayDate: d.getDate(),
        monthShort: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"][d.getMonth()],
        fullDate: localDateStr
      };
    });
  }, []);

  const generateTimeSlots = (startTime, endTime, durationMinutes) => {
    const slots = [];
    let [currentHour, currentMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const startStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`;
      
      currentMinute += durationMinutes;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
      
      if (currentHour > endHour || (currentHour === endHour && currentMinute > endMinute)) {
        break;
      }
      
      const endStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`;
      
      slots.push({
        start_time: startStr,
        end_time: endStr,
        label: `${startStr.substring(0,5)} - ${endStr.substring(0,5)} WIB`
      });
    }
    
    return slots;
  };

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
    setIsCanceling(true);

    try {
      const res = await fetch(`/api/appointments?id=${apptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Dibatalkan", cancellation_reason: "Dibatalkan oleh Pasien" })
      });

      if (res.ok) {
        setCancelConfirmApptId(null);
        setActiveModal(null);
        fetchAppointments(currentUser.id);
      } else {
        alert("Gagal membatalkan janji temu.");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsCanceling(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!newDate || !newTime) return alert("Pilih tanggal dan jam baru terlebih dahulu.");
    setIsProcessing(true);

    // Find the matching schedule to get proper end_time
    const [syear, smonth, sday] = newDate.split('-').map(Number);
    const selectedDayOfWeek = new Date(Date.UTC(syear, smonth - 1, sday)).getUTCDay();
    const schedulesForDay = rescheduleSchedules.filter(s => s.day_of_week === selectedDayOfWeek);
    let endTime = newTime;
    for (const sched of schedulesForDay) {
      const slots = generateTimeSlots(sched.start_time, sched.end_time, sched.slot_duration_minutes || 30);
      const matchedSlot = slots.find(s => s.start_time.substring(0,5) === newTime.substring(0,5));
      if (matchedSlot) {
        endTime = matchedSlot.end_time;
        break;
      }
    }

    try {
      const res = await fetch(`/api/appointments?id=${selectedAppt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          appointment_date: newDate,
          start_time: newTime,
          end_time: endTime
        })
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

  const fetchDoctorDetailsForReschedule = async (doctorId) => {
    setIsLoadingReschedule(true);
    try {
      const docRes = await fetch(`/api/doctors`);
      if (docRes.ok) {
        const docJson = await docRes.json();
        const doc = docJson.data.find(d => d.id === doctorId);
        setRescheduleDoctor(doc);
      }
      
      const schedRes = await fetch(`/api/doctorSchedules`);
      if (schedRes.ok) {
        const schedJson = await schedRes.json();
        setRescheduleSchedules(schedJson.data.filter(s => s.doctor_id === doctorId));
      }
      
      const apptRes = await fetch(`/api/appointments?doctor_id=${doctorId}`);
      if (apptRes.ok) {
        const apptJson = await apptRes.json();
        setRescheduleAppointments(apptJson.data);
      }
    } catch (e) {
      console.error("Error fetching reschedule data:", e);
    } finally {
      setIsLoadingReschedule(false);
    }
  };

  const openModal = (type, appt) => {
    setSelectedAppt(appt);
    setActiveModal(type);
    if (type === 'reschedule') {
      setNewDate("");
      setNewTime("");
      fetchDoctorDetailsForReschedule(appt.doctor_id);
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
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px] items-start w-full">
        {/* ================= KOLOM KIRI (Daftar Janji Temu) ================= */}
        <div className="space-y-6 w-full">
          <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Janji Temu</h1>
            <p className="text-gray-500 text-sm">Kelola daftar janji temu konsultasi Anda.</p>
          </div>
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input 
                  type="text"
                  placeholder="Cari nama dokter..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-9 pr-4 py-2 w-[200px] sm:w-[240px] rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 shadow-sm transition active:scale-95 h-full"
                >
                  <ListFilter size={16} />
                  Urutkan
                </button>
                
                {isSortDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-100 bg-white shadow-lg py-1 z-20">
                    <button onClick={() => { setSortOption('date-newest'); setIsSortDropdownOpen(false); setCurrentPage(1); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${sortOption === 'date-newest' ? 'font-bold text-indigo-600' : 'text-slate-700'}`}>Terdekat</button>
                    <button onClick={() => { setSortOption('date-oldest'); setIsSortDropdownOpen(false); setCurrentPage(1); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${sortOption === 'date-oldest' ? 'font-bold text-indigo-600' : 'text-slate-700'}`}>Terlama</button>
                    <button onClick={() => { setSortOption('name-asc'); setIsSortDropdownOpen(false); setCurrentPage(1); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${sortOption === 'name-asc' ? 'font-bold text-indigo-600' : 'text-slate-700'}`}>Dokter (A-Z)</button>
                    <button onClick={() => { setSortOption('name-desc'); setIsSortDropdownOpen(false); setCurrentPage(1); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${sortOption === 'name-desc' ? 'font-bold text-indigo-600' : 'text-slate-700'}`}>Dokter (Z-A)</button>
                  </div>
                )}
              </div>
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
                  onCancel={() => setCancelConfirmApptId(appt.id)}
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
                      ? 'bg-[#5E81CC] text-white shadow-sm font-bold' 
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

        {/* ================= KOLOM KANAN (Widget Kalender) ================= */}
        <div className="space-y-6 w-full">

          {/* Widget Kalender & Schedule Strip */}
          <div className="overflow-hidden rounded-3xl shadow-sm bg-white border border-gray-100">
            <CalendarWidget
              currentMonth={currentMonthView}
              onChangeMonth={handleMonthChange}
              selectedDate={selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` : null}
              onSelectDate={(isoString) => {
                const newDate = new Date(isoString);
                setSelectedDate(prev => prev && isSameDate(prev, newDate) ? null : newDate);
              }}
              eventDates={appointments
                .filter(a => a.virtualStatus !== 'Dibatalkan' && a.virtualStatus !== 'Dibatalkan Admin')
                .map(a => a.appointment_date?.split('T')[0])
              }
            />

            {/* Schedule strip di bawah (Konsisten dengan Dashboard) */}
            <div className="bg-gray-50 border-t border-gray-100 px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[12px] font-extrabold text-gray-700 uppercase tracking-wide">
                  {(!selectedDate || isSameDate(selectedDate, today)) ? "Hari ini" : `Jadwal ${selectedDate.toLocaleDateString('id-ID', {day:'numeric', month:'short'})}`}
                </h3>
              </div>
              
              <div className="space-y-2">
                {selectedDateAppointments.length > 0 ? (
                  selectedDateAppointments.map(appt => {
                    const isCancelled = appt.virtualStatus === 'Dibatalkan' || appt.virtualStatus === 'Dibatalkan Admin';
                    const isDone = appt.virtualStatus === 'Selesai' || appt.virtualStatus === 'Completed';
                    const lineColor = isCancelled ? 'bg-red-300' : isDone ? 'bg-green-400' : 'bg-[#5E81CC]';
                    return (
                      <div key={appt.id} className={`flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2 shadow-sm transition-all ${isCancelled ? 'bg-slate-50 opacity-60' : 'bg-white hover:border-[#5E81CC]/30 hover:shadow-md'}`}>
                        <div className={`w-[3px] self-stretch rounded-full shrink-0 ${lineColor}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-[11px] font-extrabold truncate ${isCancelled ? 'text-slate-500 line-through' : 'text-gray-800'}`}>{appt.doctor_name}</p>
                          <p className={`text-[10px] font-bold mt-0.5 ${isCancelled ? 'text-slate-400' : 'text-[#5E81CC]'}`}>
                            {appt.schedule_time} WIB
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center gap-2 py-2">
                    <span className="text-[11px] text-gray-400 font-medium italic">Tidak ada jadwal.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reminder Card */}
          {nextReminder && (
            <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-red-50/60 p-5 shadow-sm">
              <div className="relative z-10 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-red-600">
                  <Bell size={16} /> Pengingat berikutnya
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
            <h2 className="text-lg font-bold text-slate-900">Detail Janji Temu</h2>
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
            <StatusBadge status={selectedAppt.virtualStatus} />
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
            <div className="grid grid-cols-3 gap-2 border-b border-slate-50 pb-2">
              <span className="text-slate-400 font-medium">Catatan Keluhan</span>
              <span className="col-span-2 font-semibold text-slate-800">{selectedAppt.notes || "-"}</span>
            </div>
            {selectedAppt.virtualStatus === 'Dibatalkan' && (
              <div className="grid grid-cols-3 gap-2 border-b border-slate-50 pb-2">
                <span className="text-red-400 font-medium">Alasan Batal</span>
                <span className="col-span-2 font-semibold text-red-600">
                  {selectedAppt.cancellation_reason || "-"}
                </span>
              </div>
            )}
          </div>

          {selectedAppt.virtualStatus === 'Menunggu' && (
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => openModal('reschedule', selectedAppt)} className="flex-1 rounded-xl border border-indigo-600 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50/60 transition active:scale-95">
                Ubah Jadwal
              </button>
              <button onClick={() => setCancelConfirmApptId(selectedAppt.id)} className="flex-1 rounded-xl border border-red-200 text-red-500 py-2.5 text-sm font-bold hover:bg-red-50 transition active:scale-95">
                Batalkan Janji
              </button>
            </div>
          )}
        </ModalWrapper>
      )}

      {activeModal === 'reschedule' && selectedAppt && (
        <ModalWrapper onClose={() => setActiveModal(null)}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-lg font-bold text-slate-900">Ubah Jadwal Janji Temu</h2>
            <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"><X size={18} /></button>
          </div>

          <div className="space-y-6 mb-6 text-left">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3">Pilih Tanggal Baru</label>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {next7Days.map((d, i) => {
                  let isDisabled = false;
                  if (rescheduleDoctor?.inactive_from) {
                    const inactiveDate = new Date(rescheduleDoctor.inactive_from).toISOString().split('T')[0];
                    if (d.fullDate >= inactiveDate) {
                      isDisabled = true;
                    }
                  }
                  
                  return (
                    <button
                      key={i}
                      onClick={() => { if (!isDisabled) { setNewDate(d.dateStr); setNewTime(""); } }}
                      disabled={isDisabled}
                      className={`flex min-w-[70px] shrink-0 flex-col items-center justify-center rounded-2xl border p-3 transition-all ${
                        isDisabled 
                          ? "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                          : newDate === d.dateStr
                            ? "bg-[#5E81CC] border-[#5E81CC] text-white shadow-md"
                            : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
                      }`}
                    >
                      <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${newDate === d.dateStr && !isDisabled ? "text-indigo-100" : "text-slate-400"}`}>
                        {d.monthShort}
                      </span>
                      <span className="text-lg font-extrabold">{d.dayDate}</span>
                      <span className={`text-xs font-medium ${newDate === d.dateStr && !isDisabled ? "text-indigo-100" : "text-slate-500"}`}>
                        {d.dayName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {newDate && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-bold text-slate-900 mb-3">Pilih Jam Baru</label>
                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    const [syear, smonth, sday] = newDate.split('-').map(Number);
                    const selectedDayOfWeek = new Date(Date.UTC(syear, smonth - 1, sday)).getUTCDay();
                    const schedulesForToday = rescheduleSchedules.filter(s => {
                      if (s.day_of_week !== selectedDayOfWeek) return false;
                      // Check effective date validity
                      const fromOk = !s.effective_from || s.effective_from <= newDate;
                      const untilOk = !s.effective_until || s.effective_until >= newDate;
                      return fromOk && untilOk;
                    });

                    if (schedulesForToday.length === 0) {
                      return <div className="col-span-2 text-sm text-center py-4 text-slate-500 border border-dashed rounded-xl border-slate-300">Tidak ada jadwal praktek di hari ini.</div>;
                    }

                    return schedulesForToday.map(sched => {
                      const slots = generateTimeSlots(sched.start_time, sched.end_time, sched.slot_duration_minutes || 30);
                      
                      return slots.map(slot => {
                        const bookedAppt = rescheduleAppointments.find(
                          a => {
                            const dateMatch = a.appointment_date?.split('T')[0] === newDate;
                            const timeMatch = a.start_time?.substring(0, 5) === slot.start_time.substring(0, 5);
                            const statusMatch = !['Dibatalkan', 'Selesai', 'Cancelled', 'Completed'].includes(a.status);
                            return dateMatch && timeMatch && statusMatch;
                          }
                        );
                        
                        let isPastSlot = false;
                        const now = new Date();
                        const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                        if (newDate === todayStr) {
                            const [slotH, slotM] = slot.start_time.split(':').map(Number);
                            const currentH = now.getHours();
                            const currentM = now.getMinutes();
                            if (currentH > slotH || (currentH === slotH && currentM >= slotM)) {
                                isPastSlot = true;
                            }
                        }
                        
                        // Is this slot booked by someone else?
                        const isBookedByOther = bookedAppt && bookedAppt.id !== selectedAppt.id;
                        // Is this slot the user's own current appointment?
                        const isOwnSlot = bookedAppt && bookedAppt.id === selectedAppt.id;
                        
                        const isDisabled = isBookedByOther || isPastSlot;
                        
                        return (
                          <button
                            key={slot.start_time}
                            onClick={() => !isDisabled && setNewTime(slot.start_time)}
                            disabled={isDisabled}
                            className={`flex flex-col items-center justify-center rounded-xl border py-2 text-sm font-bold transition-all ${
                              isBookedByOther
                                ? "bg-amber-50 border-amber-300 text-amber-700 cursor-not-allowed"
                              : isPastSlot
                                ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                                : newTime === slot.start_time
                                  ? "bg-[#5E81CC] border-[#5E81CC] text-white shadow-md"
                                  : isOwnSlot
                                    ? "bg-blue-50 border-[#5E81CC] text-[#5E81CC] ring-1 ring-[#5E81CC]/30"
                                    : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                            }`}
                          >
                            <span>{slot.label}</span>
                            {isBookedByOther ? (
                              <span className="block text-[10px] text-amber-600 mt-0.5 font-semibold">Sudah ada janji</span>
                            ) : isPastSlot ? (
                              <span className="block text-[10px] text-slate-400 mt-0.5 font-semibold">Waktu terlewat</span>
                            ) : isOwnSlot && newTime !== slot.start_time ? (
                              <span className="block text-[10px] text-[#5E81CC] mt-0.5 font-semibold">Jadwal Anda saat ini</span>
                            ) : (
                              <span className="block text-[10px] text-transparent mt-0.5 font-semibold select-none">Tersedia</span>
                            )}
                          </button>
                        );
                      });
                    });
                  })()}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button onClick={() => setActiveModal(null)} className="flex-1 rounded-xl border border-slate-200 py-3.5 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95 transition-all">
              Batal
            </button>
            <button
              onClick={handleRescheduleSubmit}
              disabled={isProcessing || !newTime}
              className="flex-1 rounded-xl bg-[#5E81CC] py-3.5 text-sm font-bold text-white shadow-[0_2px_10px_rgba(94,129,204,0.3)] hover:bg-[#4D6FB5] active:scale-95 transition-all disabled:opacity-50"
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
              <div className="flex justify-between"><span className="text-slate-400 font-medium">Waktu</span><span className="font-semibold text-slate-800">{newTime.substring(0, 5)} WIB</span></div>
            </div>

            <button onClick={() => setActiveModal(null)} className="w-full rounded-xl bg-[#5E81CC] py-2.5 text-sm font-bold text-white hover:bg-[#4D6FB5] shadow-md transition active:scale-95">
              Selesai
            </button>
          </div>
        </ModalWrapper>
      )}

      {cancelConfirmApptId && (
        <ModalWrapper onClose={() => !isCanceling && setCancelConfirmApptId(null)}>
          <div className="text-center p-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 border-4 border-red-100/50">
              <Trash2 size={24} />
            </div>
            <h3 className="mb-2 text-xl font-extrabold text-slate-900 tracking-tight">Batalkan Janji Temu?</h3>
            <p className="mb-8 text-sm text-slate-500 font-medium leading-relaxed">
              Apakah Anda yakin ingin membatalkan janji temu ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelConfirmApptId(null)}
                disabled={isCanceling}
                className="flex-1 rounded-xl bg-slate-100 py-3.5 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Kembali
              </button>
              <button
                onClick={() => handleCancelAppointment(cancelConfirmApptId)}
                disabled={isCanceling}
                className="flex-1 rounded-xl bg-red-500 py-3.5 text-sm font-bold text-white shadow-md hover:bg-red-600 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:active:scale-100 disabled:cursor-not-allowed"
              >
                {isCanceling ? <Loader2 size={18} className="animate-spin" /> : "Ya, Batalkan"}
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

    </>
  );
}

// ================= LAYOUT SUB-COMPONENTS =================

function AppointmentCard({ appt, onDetail, onReschedule, onCancel }) {
  const isWaiting = appt.virtualStatus === 'Menunggu';

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
        <StatusBadge status={appt.virtualStatus} />

        <div className="flex flex-col gap-2 w-full sm:w-auto md:w-full md:max-w-[130px]">
          <button onClick={onDetail} className="flex items-center justify-center rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50/50 transition">
            Lihat Detail
          </button>
          {isWaiting && (
            <>
              <button onClick={onReschedule} className="flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50/50 transition">
                <CalendarDays size={14} />
                Ubah Jadwal
              </button>
              <button onClick={onCancel} className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 transition">
                <Trash2 size={12} />
                Batalkan
              </button>
            </>
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
  if (status === 'Dibatalkan' || status === 'Cancelled' || status === 'Dibatalkan Admin') {
    return <span className="inline-flex rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-bold text-red-500">{status === 'Dibatalkan Admin' ? 'Dibatalkan Admin' : 'Dibatalkan'}</span>;
  }
  if (status === 'Sedang Berlangsung') {
    return <span className="inline-flex rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-600">Sedang Berlangsung</span>;
  }
  if (status === 'Menunggu Catatan Dokter') {
    return <span className="inline-flex rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-600">Menunggu Catatan</span>;
  }
  if (status === 'Selesai' || status === 'Completed') {
    return <span className="inline-flex rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-600">Selesai</span>;
  }
  return <span className="inline-flex rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-500">{status}</span>;
}