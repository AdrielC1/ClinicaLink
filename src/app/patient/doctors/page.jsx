"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);

      try {
        // Fetch Doctors
        const docRes = await fetch("/api/doctors?is_active=true", { cache: 'no-store' });
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
      
      // Calculate min/max days for display
      const days = docSchedules.map(s => s.day_of_week).sort();
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
        rating: 4.9, // Hardcoded per requirement
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
        setDoctorAppointments(Array.isArray(data.data) ? data.data : []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedDoctor(null);
  };

  const handleBookingSubmit = async () => {
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
          notes: medicalNotes,
          start_time: selectedSchedule.start_time,
          end_time: selectedSchedule.end_time
        })
      });

      if (res.ok) {
        setBookingStep(2); // Show Success Modal
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
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      
      {/* Header Info */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Daftar Dokter</h1>
        <p className="text-sm font-semibold text-slate-600">Pilih dokter sesuai kebutuhan konsultasi anda</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 relative z-10">
        {/* Search Input */}
        <div className="relative flex-1 max-w-xs bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 bg-transparent text-[13px] focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 font-bold text-slate-700"
            placeholder="Cari Dokter atau spesialis"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        {/* Specialization Dropdown */}
        <div className="relative">
          <select
            className="appearance-none w-full md:w-56 bg-white shadow-sm border border-slate-100 text-slate-500 text-[13px] font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
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
        <div className="relative ml-auto">
          <button 
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-2 bg-white border border-slate-100 text-slate-700 text-[13px] font-bold rounded-xl px-4 py-2.5 hover:bg-slate-50 transition-colors shadow-sm"
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

      {/* Main Content Grid */}
      <div className="flex flex-col lg:flex-row gap-8 flex-1 z-0">
        
        {/* Left: Doctors Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {currentDoctors.map(doc => (
              <div key={doc.id} className="bg-white rounded-[24px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col relative group transition-all duration-300 hover:shadow-[0_8px_24px_rgba(94,129,204,0.12)]">
                
                {/* Image Placeholder */}
                <div className="h-44 bg-slate-100 relative">
                  <div className="absolute inset-0 flex items-end justify-center overflow-hidden">
                     <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(doc.full_name)}&background=random&size=256`} alt={doc.full_name} className="w-full h-full object-cover opacity-80 mix-blend-multiply" />
                  </div>
                  {/* Heart Icon Top Right */}
                  <button onClick={() => toggleFavorite(doc.id)} className="absolute top-4 right-4 p-2 bg-white/40 backdrop-blur-md rounded-full hover:bg-white text-slate-500 hover:text-rose-500 transition-colors shadow-sm">
                    <Heart className={`h-4 w-4 ${favoriteDoctors[doc.id] ? "fill-rose-500 text-rose-500" : ""}`} />
                  </button>
                </div>

                <div className="p-5 flex flex-col flex-1 items-center text-center">
                  <h3 className="text-base font-extrabold text-slate-900 mb-0.5">{doc.full_name}</h3>
                  <p className="text-[11px] font-bold text-slate-400 mb-4">{doc.specialization_name || "Spesialis Umum"}</p>
                  
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-700 mb-2">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                    <span>{doc.scheduleText}</span>
                    <span className="text-slate-300 mx-1">|</span>
                    <span>{doc.timeText || "-"}</span>
                  </div>
                  
                  <div className="mb-5">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-md">
                      Tersedia
                    </span>
                  </div>

                  <div className="flex items-center justify-between w-full mt-auto">
                    <button 
                      onClick={() => openBookingModal(doc)}
                      className="bg-[#5E81CC] hover:bg-indigo-600 text-white text-[13px] font-extrabold py-2 px-6 rounded-xl transition-colors shadow-sm"
                    >
                      Booking
                    </button>
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-[11px] font-extrabold text-slate-700">{doc.rating} <span className="text-slate-400 font-bold">({doc.reviews})</span></span>
                    </div>
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

          {/* Bottom Banner */}
          <div className="mt-10 bg-[#E6EDFF] rounded-[20px] p-4 flex items-center justify-center gap-3">
             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-[#5E81CC]">
                <ShieldCheck className="w-4 h-4" />
             </div>
             <div>
                <h4 className="text-[13px] font-extrabold text-slate-900 leading-none mb-1">Semua Dokter sudah terverifikasi</h4>
                <p className="text-[11px] font-bold text-slate-500 leading-none">Kami memastikan semua dokter memiliki izin praktik yang resmi.</p>
             </div>
          </div>

        </div>

        {/* Right: Specializations Sidebar */}
        <div className="w-full lg:w-[240px] shrink-0">
          <div className="bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 p-5">
            <h3 className="text-[13px] font-extrabold text-slate-900 mb-4">Kategori Spesialis</h3>
            <div className="space-y-1">
              
              {specializations.map(spec => (
                <button
                  key={spec.id}
                  onClick={() => { setSelectedSpecialization(spec.name); setCurrentPage(1); }}
                  className="flex items-center justify-between w-full py-2.5 px-3 hover:bg-slate-50 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-[#5E81CC]">
                      {getIconForSpec(spec.name)}
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-700 group-hover:text-slate-900">
                      {spec.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-slate-900">{specializationCounts[spec.name] || 0}</span>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                  </div>
                </button>
              ))}

            </div>
            
            <button 
              onClick={() => { setSelectedSpecialization("Semua Spesialis"); setCurrentPage(1); }}
              className="text-[11px] font-extrabold text-[#5E81CC] mt-4 px-3 hover:underline"
            >
              Lihat semua
            </button>
          </div>
        </div>
      </div>

      {/* ================= BOOKING MODAL ================= */}
      {isBookingModalOpen && selectedDoctor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
              <h2 className="text-[15px] font-extrabold text-slate-900">Booking Appointment</h2>
              <button onClick={closeBookingModal} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingStep === 1 && (
              <div className="px-6 py-6 max-h-[80vh] overflow-y-auto scrollbar-none">
                {/* Doctor Info */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-[60px] h-[60px] rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                     <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDoctor.full_name)}&background=random`} alt={selectedDoctor.full_name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-extrabold text-slate-900">{selectedDoctor.full_name}</h3>
                    <p className="text-[13px] font-bold text-slate-500">{selectedDoctor.specialization_name || "Spesialis Umum"}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Tanggal */}
                  <div>
                    <label className="block text-[13px] font-extrabold text-slate-900 mb-2">Tanggal</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <CalendarDays className="h-[18px] w-[18px] text-slate-500" />
                      </div>
                      <input 
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={selectedDate}
                        onChange={(e) => { setSelectedDate(e.target.value); setSelectedSchedule(null); }}
                        className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-[14px] text-[13px] font-extrabold text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-[#5E81CC] outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Jam */}
                  <div>
                    <label className="block text-[13px] font-extrabold text-slate-900 mb-2">Jam</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Clock className="h-[18px] w-[18px] text-slate-500" />
                      </div>
                      <select
                        value={selectedSchedule?.start_time || ""}
                        onChange={(e) => {
                           if(!e.target.value) { setSelectedSchedule(null); return; }
                           const slotStr = e.target.options[e.target.selectedIndex].dataset.slot;
                           if(slotStr) setSelectedSchedule(JSON.parse(slotStr));
                        }}
                        disabled={!selectedDate}
                        className="block w-full pl-11 pr-10 py-2.5 border border-slate-200 rounded-[14px] text-[13px] font-extrabold text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-[#5E81CC] outline-none transition-all appearance-none bg-white disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer"
                      >
                        <option value="">Pilih Jam</option>
                        {(() => {
                           if(!selectedDate) return null;
                           const dateObj = new Date(selectedDate);
                           const dayOfWeek = dateObj.getDay();
                           const availableSchedules = selectedDoctor.schedules.filter(s => s.day_of_week === dayOfWeek);
                           
                           if (availableSchedules.length === 0) {
                              return <option disabled>Tidak ada jadwal di hari ini</option>;
                           }
                           
                           return availableSchedules.map(sched => {
                              const slots = generateTimeSlots(sched.start_time, sched.end_time, sched.slot_duration_minutes || 30);
                              
                              const now = new Date();
                              const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                              const currentH = now.getHours();
                              const currentM = now.getMinutes();

                              return slots.map(slot => {
                                 const isBooked = doctorAppointments.some(a => 
                                    a.appointment_date?.split('T')[0] === selectedDate && 
                                    a.start_time?.substring(0,5) === slot.start_time.substring(0,5) &&
                                    !['Dibatalkan', 'Cancelled'].includes(a.status)
                                 );
                                 
                                 let isPassed = false;
                                 if (selectedDate === todayStr) {
                                    const [slotH, slotM] = slot.start_time.split(':').map(Number);
                                    if (slotH < currentH || (slotH === currentH && slotM <= currentM)) {
                                       isPassed = true;
                                    }
                                 }
                                 
                                 const slotData = JSON.stringify({
                                    id: sched.id,
                                    start_time: slot.start_time,
                                    end_time: slot.end_time
                                 });

                                 return (
                                    <option 
                                      key={slot.start_time} 
                                      value={slot.start_time} 
                                      disabled={isBooked || isPassed}
                                      data-slot={slotData}
                                    >
                                      {slot.label} {isBooked ? "(Penuh)" : isPassed ? "(Sudah terlewat)" : ""}
                                    </option>
                                 );
                              });
                           });
                        })()}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Lokasi */}
                  <div>
                    <label className="block text-[13px] font-extrabold text-slate-900 mb-2">Lokasi</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MapPin className="h-[18px] w-[18px] text-slate-500" />
                      </div>
                      <input 
                        type="text"
                        value={selectedLocation}
                        readOnly
                        className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-[14px] text-[13px] font-extrabold text-slate-700 outline-none cursor-default"
                      />
                    </div>
                  </div>

                  {/* Keluhan */}
                  <div>
                    <label className="block text-[13px] font-extrabold text-slate-900 mb-2">Keluhan</label>
                    <textarea 
                      rows={3}
                      value={medicalNotes}
                      onChange={e => setMedicalNotes(e.target.value)}
                      maxLength={200}
                      placeholder="Sakit gigi sebelah kanan sejak 2 hari yang lalu."
                      className="block w-full p-3.5 border border-slate-200 rounded-[14px] text-[13px] font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-[#5E81CC] outline-none transition-all resize-none placeholder:text-slate-400 placeholder:font-semibold"
                    ></textarea>
                    <div className="text-right mt-1.5 text-[10px] font-extrabold text-slate-400">{medicalNotes.length}/200</div>
                  </div>
                </div>

                <button 
                  onClick={handleBookingSubmit}
                  disabled={isSubmitting}
                  className="w-full mt-6 bg-[#5E81CC] hover:bg-indigo-600 text-white font-extrabold text-[13px] py-3.5 rounded-[14px] transition-all shadow-[0_4px_12px_rgba(94,129,204,0.3)] active:scale-[0.98] disabled:opacity-70 flex justify-center items-center"
                >
                  {isSubmitting ? "Memproses..." : "Konfirmasi Booking"}
                </button>
              </div>
            )}

            {bookingStep === 2 && (
              <div className="px-8 py-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#22C55E] rounded-full flex items-center justify-center text-white mb-5">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                
                <h2 className="text-[17px] font-extrabold text-slate-900 mb-1.5">Booking Berhasil!</h2>
                <p className="text-[13px] font-bold text-slate-500 mb-8">Janji temu anda telah berhasil dibuat</p>

                <div className="w-full text-left space-y-4 mb-8">
                  <div className="grid grid-cols-[80px_1fr] gap-4">
                     <span className="text-[13px] font-bold text-slate-500">Dokter</span>
                     <span className="text-[13px] font-extrabold text-slate-900">{selectedDoctor.full_name} - {selectedDoctor.specialization_name || "Spesialis Umum"}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-4">
                     <span className="text-[13px] font-bold text-slate-500">Tanggal</span>
                     <span className="text-[13px] font-extrabold text-slate-900">
                       {new Date(selectedDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                     </span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-4">
                     <span className="text-[13px] font-bold text-slate-500">Jam</span>
                     <span className="text-[13px] font-extrabold text-slate-900">{selectedSchedule?.start_time.substring(0,5).replace(':', '.')} - {selectedSchedule?.end_time.substring(0,5).replace(':', '.')} WIB</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-4">
                     <span className="text-[13px] font-bold text-slate-500">Lokasi</span>
                     <span className="text-[13px] font-extrabold text-slate-900">{selectedLocation}</span>
                  </div>
                  {medicalNotes && (
                    <div className="grid grid-cols-[80px_1fr] gap-4">
                       <span className="text-[13px] font-bold text-slate-500">Keluhan</span>
                       <span className="text-[13px] font-extrabold text-slate-900 leading-relaxed">{medicalNotes}</span>
                    </div>
                  )}
                </div>

                <div className="w-full flex flex-col gap-3">
                  <button onClick={() => { closeBookingModal(); router.push('/patient/appointments'); }} className="w-full bg-[#5E81CC] hover:bg-indigo-600 text-white font-extrabold text-[13px] py-3.5 rounded-[14px] transition-all shadow-sm">
                    Lihat Appointment
                  </button>
                  <button onClick={closeBookingModal} className="w-full bg-white border border-slate-200 text-slate-700 font-extrabold text-[13px] py-3.5 rounded-[14px] hover:bg-slate-50 transition-colors">
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
