"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, waitForSupabaseUser } from "@/lib/supabase";
import { 
  Search, 
  ChevronDown, 
  ArrowUpDown, 
  Heart, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight,
  Star,
  MapPin,
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserRound,
  Baby,
  Activity
} from "lucide-react";
import Image from "next/image";

// Helper function to generate time slots (same as in dashboard)
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
      label: `${slotH}.${slotM} - ${nextH}.${nextM} WIB` // Format from image
    });
  }
  return slots;
}

export default function PatientDoctorsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-full"><p className="text-slate-500 font-medium animate-pulse">Memuat...</p></div>}>
      <PatientDoctorsContent />
    </Suspense>
  );
}

function PatientDoctorsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- States ---
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Data
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [schedules, setSchedules] = useState([]);

  // Filtering & Sorting
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedSpecialization, setSelectedSpecialization] = useState("Semua Spesialis");
  const [sortOption, setSortOption] = useState(""); // "" | "A-Z" | "Z-A" | "Terdekat"
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Booking Modal
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1); // 1 = Form, 2 = Success
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState("Klinik Dipo 1"); // Hardcoded as in image
  const [medicalNotes, setMedicalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctorAppointments, setDoctorAppointments] = useState([]);

  // Favorites
  const [favoriteDoctors, setFavoriteDoctors] = useState({});

  // --- Fetch Data ---
  useEffect(() => {
    const savedFav = localStorage.getItem("favorite_doctors");
    if (savedFav) {
      try { setFavoriteDoctors(JSON.parse(savedFav)); } catch (e) {}
    }
    
    const initData = async () => {
      setLoading(true);
      // Get User
      const { data: { user }, error: authError } = await waitForSupabaseUser();
      if (authError || !user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);

      try {
        // Fetch Doctors (status=active includes doctors with future inactive_from)
        const docRes = await fetch("/api/doctors?status=active", { cache: 'no-store' });
        const docData = await docRes.json();
        
        // Fetch Specializations
        const specRes = await fetch("/api/specializations", { cache: 'no-store' });
        const specData = await specRes.json();
        
        // Fetch Schedules
        const schedRes = await fetch("/api/doctorSchedules", { cache: 'no-store' });
        const schedData = await schedRes.json();

        if (docRes.ok) setDoctors(Array.isArray(docData.data) ? docData.data : []);
        if (specRes.ok) setSpecializations(Array.isArray(specData.data) ? specData.data : []);
        if (schedRes.ok) setSchedules(Array.isArray(schedData.data) ? schedData.data : []);
      } catch (err) {
        console.error("Gagal memuat data:", err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [router]);

  // --- Memoized Derived Data ---
  
  const next7Days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i + 1);
      const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return {
        dateNum: d.getDate(),
        dayName: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][d.getDay()],
        monthShort: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"][d.getMonth()],
        fullDate: localDateStr
      };
    });
  }, []);
  
  // Calculate specialization counts
  const specializationCounts = useMemo(() => {
    const counts = { "Semua Spesialis": doctors.length };
    doctors.forEach(doc => {
      const spec = doc.specialization_name || "Lainnya";
      counts[spec] = (counts[spec] || 0) + 1;
    });
    return counts;
  }, [doctors]);

  // Map doctors with their schedules
  const mappedDoctors = useMemo(() => {
    return doctors.map(doc => {
      const docSchedules = schedules.filter(s => s.doctor_id === doc.id);
      
      // For card display, show schedules valid for "today or future"
      const todayISO = new Date().toISOString().split('T')[0];
      const activeSchedules = docSchedules.filter(s => {
        const fromOk = !s.effective_from || s.effective_from <= todayISO;
        const untilOk = !s.effective_until || s.effective_until >= todayISO;
        return fromOk && untilOk;
      });
      
      // Calculate min/max days for display
      const days = activeSchedules.map(s => s.day_of_week).sort();
      let scheduleText = "Belum ada jadwal";
      let timeText = "";
      
      if (days.length > 0) {
        const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
        const firstDay = dayNames[days[0]];
        const lastDay = dayNames[days[days.length - 1]];
        scheduleText = days.length > 1 ? `${firstDay} - ${lastDay}` : firstDay;
        
        // Assume mostly uniform hours, pick the first one
        if (docSchedules[0]?.start_time && docSchedules[0]?.end_time) {
           const start = docSchedules[0].start_time.substring(0, 5).replace(':', '.');
           const end = docSchedules[0].end_time.substring(0, 5).replace(':', '.');
           timeText = `${start} - ${end}`;
        }
      }

      return {
        ...doc,
        schedules: docSchedules,
        scheduleText,
        timeText,
        reviews: 260
      };
    });
  }, [doctors, schedules]);

  // Filter & Sort
  const filteredAndSortedDoctors = useMemo(() => {
    let result = [...mappedDoctors];

    // Filter by Specialization
    if (selectedSpecialization !== "Semua Spesialis") {
      result = result.filter(d => d.specialization_name === selectedSpecialization);
    }

    // Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.full_name.toLowerCase().includes(q) || 
        (d.specialization_name || "").toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortOption === "A-Z") {
      result.sort((a, b) => a.full_name.localeCompare(b.full_name));
    } else if (sortOption === "Z-A") {
      result.sort((a, b) => b.full_name.localeCompare(a.full_name));
    } else if (sortOption === "Terdekat") {
      // Sort by whoever has schedule today/tomorrow. Simplified for UI.
      const today = new Date().getDay();
      result.sort((a, b) => {
         const aNext = a.schedules.find(s => s.day_of_week >= today) || a.schedules[0];
         const bNext = b.schedules.find(s => s.day_of_week >= today) || b.schedules[0];
         const aDay = aNext ? (aNext.day_of_week >= today ? aNext.day_of_week - today : aNext.day_of_week + 7 - today) : 99;
         const bDay = bNext ? (bNext.day_of_week >= today ? bNext.day_of_week - today : bNext.day_of_week + 7 - today) : 99;
         return aDay - bDay;
      });
    }

    return result;
  }, [mappedDoctors, searchQuery, selectedSpecialization, sortOption]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredAndSortedDoctors.length / itemsPerPage) || 1;
  const currentDoctors = filteredAndSortedDoctors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handleSort = (option) => {
    setSortOption(option);
    setShowSortDropdown(false);
    setCurrentPage(1);
  };

  const openBookingModal = async (doc) => {
    setSelectedDoctor(doc);
    setSelectedDate("");
    setSelectedSchedule(null);
    setMedicalNotes("");
    setBookingStep(1);
    setIsBookingModalOpen(true);
    setDoctorAppointments([]);

    // Fetch existing appointments to block booked slots
    try {
      const res = await fetch(`/api/appointments?doctor_id=${doc.id}`);
      if (res.ok) {
        const data = await res.json();
        setDoctorAppointments(Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedDoctor(null);
  };

  const submitBooking = async () => {
    if (!selectedDate || !selectedSchedule) {
      alert("Pilih tanggal dan jam terlebih dahulu!");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: currentUser.id,
          schedule_id: selectedSchedule.id,
          appointment_date: selectedDate,
          complaints: medicalNotes,
          start_time: selectedSchedule.start_time,
          end_time: selectedSchedule.end_time
        })
      });

      if (res.ok) {
        setBookingStep(3); // Show Success Modal
      } else {
        const err = await res.json();
        alert(err.message || "Gagal membuat janji temu.");
      }
    } catch (e) {
      alert("Error menghubungi server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFavorite = (doctorId) => {
    setFavoriteDoctors((prev) => {
      const next = { ...prev, [doctorId]: !prev[doctorId] };
      localStorage.setItem("favorite_doctors", JSON.stringify(next));
      return next;
    });
  };

  // --- Render Helpers ---
  const getIconForSpec = (specName) => {
    const name = specName?.toLowerCase() || "";
    if (name.includes("gigi")) return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C7 2 7 9 7 9s0 3 2 4c2 1 2 4 3 6v1h2v-1c1-2 1-5 3-6 2-1 2-4 2-4s0-7-5-7z"/><path d="M12 9v4"/></svg>;
    if (name.includes("anak")) return <Baby className="w-4 h-4" />;
    if (name.includes("kandungan")) return <Activity className="w-4 h-4" />;
    return <UserRound className="w-4 h-4" />;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><p className="text-slate-500 font-medium animate-pulse">Memuat Daftar Dokter...</p></div>;
  }

  return (
    <div className="flex flex-col h-full">
      
      {/* Header Info & Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Daftar Dokter</h1>
          <p className="text-gray-500 text-sm">Lihat dokter spesialis yang tersedia dan buat janji temu konsultasi Anda dengan mudah.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full sm:w-[240px] pl-10 pr-3 py-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-[13px] focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 font-bold text-slate-700"
              placeholder="Cari Dokter atau spesialis"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Specialization Dropdown */}
          <div className="relative w-full sm:w-auto">
            <select
              className="appearance-none w-full sm:w-[180px] bg-white shadow-sm border border-slate-100 text-slate-500 text-[13px] font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
              value={selectedSpecialization}
              onChange={(e) => { setSelectedSpecialization(e.target.value); setCurrentPage(1); }}
            >
              <option value="Semua Spesialis">Semua Spesialis</option>
              {specializations.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>

          {/* Sort Button */}
          <div className="relative w-full sm:w-auto flex-shrink-0">
            <button 
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center justify-center gap-2 bg-white border border-slate-100 text-slate-700 text-[13px] font-bold rounded-xl px-4 py-2.5 hover:bg-slate-50 transition-colors shadow-sm w-full h-full"
            >
              <ArrowUpDown className="h-4 w-4" />
              Urutkan {sortOption ? `(${sortOption})` : ''}
            </button>
            
            {showSortDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-[999] py-1.5 overflow-hidden">
                {['A-Z', 'Z-A', 'Terdekat'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleSort(opt)}
                    className={`block w-full text-left px-4 py-2.5 text-[13px] font-bold hover:bg-indigo-50 transition-colors ${sortOption === opt ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700'}`}
                  >
                    {opt}
                  </button>
                ))}
                {sortOption !== "" && (
                   <button onClick={() => handleSort("")} className="block w-full text-left px-4 py-2.5 text-[13px] font-bold text-rose-500 hover:bg-rose-50 border-t border-slate-100 mt-1">Reset Urutan</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 z-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {currentDoctors.map(doc => (
              <div key={doc.id} className="bg-white rounded-[24px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col relative group transition-all duration-300 hover:shadow-[0_8px_24px_rgba(94,129,204,0.12)]">
                
                {/* Image Placeholder */}
                <div className="h-44 bg-slate-50 relative border-b border-slate-100">
                  <div className="absolute inset-0 flex items-end justify-center overflow-hidden">
                     <img src={doc.img_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.full_name)}&background=random&size=256`} alt={doc.full_name} className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1 items-center text-center">
                  <h3 className="text-base font-extrabold text-slate-900 mb-0.5">{doc.full_name}</h3>
                  <p className="text-[12px] font-bold text-slate-400 mb-6">{doc.specialization_name || "Spesialis Umum"}</p>
                  
                  {/* Jadwal */}
                  <div className="flex items-center justify-center gap-3 text-[13px] font-extrabold text-slate-700 mb-6 w-full border border-slate-100 rounded-xl py-2.5 bg-slate-50">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-slate-500" />
                      <span>{doc.scheduleText}</span>
                    </div>
                    <div className="w-[2px] h-[14px] bg-slate-200"></div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span>{doc.timeText || "-"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full mt-auto border-t border-slate-100 pt-5">
                    {/* Tersedia Kiri */}
                    <span className={`text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg border ${doc.inactive_from ? 'text-rose-500 bg-rose-50 border-rose-100' : 'text-emerald-500 bg-emerald-50 border-emerald-100'}`}>
                      {doc.inactive_from ? `Nonaktif ${new Date(doc.inactive_from).toLocaleDateString('id-ID', {day:'numeric',month:'short'})}` : 'Tersedia'}
                    </span>

                    {/* Booking Kanan */}
                    <button 
                      onClick={() => openBookingModal(doc)}
                      className="bg-[#5E81CC] hover:bg-[#4D6FB5] text-white text-[13px] font-extrabold py-2 px-6 rounded-xl transition-colors shadow-[0_2px_10px_rgba(94,129,204,0.3)] active:scale-95"
                    >
                      Buat Janji
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {currentDoctors.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-[24px]">
                Tidak ada dokter yang ditemukan sesuai pencarian.
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-10">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded text-slate-400 hover:text-indigo-600 disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              {Array.from({length: totalPages}).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-extrabold transition-colors ${
                    currentPage === i + 1 
                      ? 'bg-[#5E81CC] text-white shadow-md' 
                      : 'text-slate-500 hover:bg-indigo-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded text-slate-400 hover:text-indigo-600 disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Bottom Banner Dihapus */}

          {/* Pagination End */}
        </div>

      {/* ================= BOOKING MODAL ================= */}
      {isBookingModalOpen && selectedDoctor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-[480px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 p-6 pb-4">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {bookingStep === 1 && "Pilih Jadwal Konsultasi"}
                {bookingStep === 2 && "Detail Keluhan"}
                {bookingStep === 3 && "Berhasil!"}
              </h2>
              {bookingStep < 3 && (
                <button onClick={() => setIsBookingModalOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="p-6 pt-2">
              {/* STEP 1 */}
              {bookingStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex h-12 w-12 overflow-hidden items-center justify-center rounded-full bg-white text-2xl shadow-sm border border-slate-200">
                      {selectedDoctor.img_url ? (
                        <img src={selectedDoctor.img_url} alt={selectedDoctor.full_name} className="w-full h-full object-cover" />
                      ) : (
                        "👨‍⚕️"
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{selectedDoctor.full_name}</h3>
                      <p className="text-xs font-medium text-slate-500">{selectedDoctor.specialization_name || "Klinik Umum"}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-sm font-bold text-slate-900">Pilih Tanggal</h4>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                      {next7Days.map((d) => {
                        let isDisabled = false;
                        if (selectedDoctor.inactive_from) {
                          const inactiveDate = new Date(selectedDoctor.inactive_from).toISOString().split('T')[0];
                          if (d.fullDate >= inactiveDate) {
                            isDisabled = true;
                          }
                        }
                        
                        return (
                          <button
                            key={d.fullDate}
                            onClick={() => { if (!isDisabled) { setSelectedDate(d.fullDate); setSelectedSchedule(null); } }}
                            disabled={isDisabled}
                            className={`flex min-w-[70px] flex-col items-center justify-center rounded-2xl border p-3 transition-all ${
                              isDisabled 
                                ? "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                                : selectedDate === d.fullDate
                                  ? "bg-[#5E81CC] border-[#5E81CC] text-white shadow-md"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
                              }`}
                          >
                            <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${selectedDate === d.fullDate && !isDisabled ? "text-indigo-100" : "text-slate-400"}`}>{d.monthShort}</span>
                            <span className="text-lg font-extrabold">{d.dateNum}</span>
                            <span className={`text-xs font-medium ${selectedDate === d.fullDate && !isDisabled ? "text-indigo-100" : "text-slate-500"}`}>{d.dayName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-sm font-bold text-slate-900">Waktu Tersedia</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {(() => {
                        if (!selectedDate) return <div className="col-span-2 text-sm text-center py-4 text-slate-500 border border-dashed rounded-xl border-slate-300">Pilih tanggal terlebih dahulu</div>;
                        const [syear, smonth, sday] = selectedDate.split('-').map(Number);
                        const selectedDayOfWeek = new Date(Date.UTC(syear, smonth - 1, sday)).getUTCDay();
                        const schedulesForToday = selectedDoctor.schedules.filter(s => {
                          if (s.day_of_week !== selectedDayOfWeek) return false;
                          // Check effective date validity
                          const fromOk = !s.effective_from || s.effective_from <= selectedDate;
                          const untilOk = !s.effective_until || s.effective_until >= selectedDate;
                          return fromOk && untilOk;
                        });

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
                                            ? "bg-[#5E81CC] border-[#5E81CC] text-white shadow-md"
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
                    className="w-full mt-4 rounded-xl bg-[#5E81CC] py-3.5 text-sm font-bold text-white shadow-[0_2px_10px_rgba(94,129,204,0.3)] hover:bg-[#4D6FB5] active:scale-95 transition-all disabled:opacity-50"
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
                      <span className="font-bold text-slate-900">{selectedSchedule.start_time.substring(0, 5)} - {selectedSchedule.end_time.substring(0, 5)} WIB</span>
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
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm focus:border-[#5E81CC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition resize-none"
                    ></textarea>
                  </div>
                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={() => setBookingStep(1)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                    >
                      Kembali
                    </button>
                    <button
                      onClick={submitBooking}
                      disabled={isSubmitting}
                      className="w-full rounded-xl bg-[#5E81CC] py-3.5 text-sm font-bold text-white shadow-[0_2px_10px_rgba(94,129,204,0.3)] hover:bg-[#4D6FB5] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Menyimpan...
                        </>
                      ) : (
                        "Konfirmasi Janji Temu"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {bookingStep === 3 && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-500 shadow-inner">
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-2xl font-bold text-slate-900">Janji Temu Berhasil!</h3>
                  <p className="mb-8 text-sm text-slate-500 max-w-[280px]">
                    Janji temu Anda telah berhasil dijadwalkan. Silakan cek menu Janji Temu untuk detail lebih lanjut.
                  </p>
                  <button
                    onClick={() => {
                      setIsBookingModalOpen(false);
                      setBookingStep(1);
                      router.push('/patient/appointments');
                    }}
                    className="w-full rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-md hover:bg-slate-800 active:scale-95 transition-all"
                  >
                    Tutup & Lihat Appointment
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}
