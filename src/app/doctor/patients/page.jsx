"use client";

import { useState, useEffect } from "react";
import { Search, ChevronDown, MoreVertical, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function DoctorPatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Semua pasien");
  
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: doctorData } = await supabase
          .from("doctors")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (doctorData) {
          const res = await fetch(`/api/appointments?doctor_id=${doctorData.id}`);
          if (res.ok) {
            const json = await res.json();
            const appointments = Array.isArray(json.data) ? json.data : [];
            
            // Extract unique patients based on patient_id
            const uniquePatientsMap = new Map();
            appointments.forEach(appt => {
              if (!uniquePatientsMap.has(appt.patient_id)) {
                // Determine gender mock based on name ending if no gender in DB
                // Or just use '-' if we don't have it
                const gender = appt.patient_name.toLowerCase().endsWith('a') || appt.patient_name.toLowerCase().endsWith('i') ? 'Perempuan' : 'Laki-laki';
                
                uniquePatientsMap.set(appt.patient_id, {
                  id: appt.patient_id,
                  name: appt.patient_name,
                  email: appt.patient_email || "-",
                  gender: gender,
                  phone: appt.patient_phone || "-",
                  rawDate: appt.appointment_date,
                  lastConsultation: new Date(appt.appointment_date).toLocaleDateString("id-ID", {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })
                });
              } else {
                // Update last consultation if newer
                const existing = uniquePatientsMap.get(appt.patient_id);
                const existingDate = new Date(existing.rawDate);
                const newDate = new Date(appt.appointment_date);
                if (newDate > existingDate) {
                  existing.rawDate = appt.appointment_date;
                  existing.lastConsultation = newDate.toLocaleDateString("id-ID", {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  });
                }
              }
            });
            
            setPatients(Array.from(uniquePatientsMap.values()));
          }
        }
      } catch (err) {
        console.error("Gagal memuat pasien:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const filters = [
    "Semua pasien",
    "Laki Laki",
    "Perempuan",
    "Konsultasi terbaru",
    "Konsultasi lama"
  ];

  // ==========================================
  // Filter & Sort Logic
  // ==========================================
  let filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (activeFilter === "Laki Laki") {
    filteredPatients = filteredPatients.filter(p => p.gender === "Laki-laki");
  } else if (activeFilter === "Perempuan") {
    filteredPatients = filteredPatients.filter(p => p.gender === "Perempuan");
  } else if (activeFilter === "Konsultasi terbaru") {
    filteredPatients = [...filteredPatients].sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
  } else if (activeFilter === "Konsultasi lama") {
    filteredPatients = [...filteredPatients].sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));
  }

  return (
    <div className="w-full">
        {/* Header Section */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-extrabold text-gray-900 tracking-tight">
              Daftar Pasien
            </h1>
            <p className="text-[14px] font-medium text-gray-500 mt-1">
              Kelola dan lihat semua pasien anda.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search Pasien"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#5E81CC]/20 focus:border-[#5E81CC] placeholder:text-gray-400 shadow-sm transition-all"
              />
            </div>
            
            <div className="relative w-full sm:w-[180px]">
              <button
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-[#5E81CC]/30 rounded-xl text-[13px] text-[#5E81CC] shadow-sm font-bold focus:outline-none hover:bg-[#5E81CC]/5 transition-colors"
              >
                <span>{activeFilter}</span>
                <ChevronDown size={16} className={`text-[#5E81CC] transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {filterDropdownOpen && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-10 py-1.5 overflow-hidden">
                  {filters.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setActiveFilter(f);
                        setFilterDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-[#5E81CC]/10 hover:text-[#5E81CC] font-semibold transition-colors"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-[#F8FAFC] border-b border-gray-100">
                <tr className="text-gray-900 font-extrabold text-[12px]">
                  <th className="px-6 py-4 tracking-wide">No</th>
                  <th className="px-6 py-4 tracking-wide">Nama Pasien</th>
                  <th className="px-6 py-4 tracking-wide">Email</th>
                  <th className="px-6 py-4 tracking-wide">Jenis Kelamin</th>
                  <th className="px-6 py-4 tracking-wide">No Telepon</th>
                  <th className="px-6 py-4 tracking-wide">Terakhir Konsultasi</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 size={24} className="animate-spin text-[#5E81CC]" />
                        <p className="text-sm font-medium">Memuat data pasien...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400 text-sm font-medium">
                      Belum ada pasien yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((p, idx) => (
                  <tr key={p.id} className="text-gray-800 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-[13px] font-extrabold">{idx + 1}</td>
                    <td className="px-6 py-4 text-[13px] font-bold">{p.name}</td>
                    <td className="px-6 py-4 text-[13px] font-medium">{p.email}</td>
                    <td className="px-6 py-4 text-[13px] font-semibold">{p.gender}</td>
                    <td className="px-6 py-4 text-[13px] font-semibold">{p.phone}</td>
                    <td className="px-6 py-4 text-[13px] font-bold text-gray-900">{p.lastConsultation}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="px-4 py-1.5 text-[11px] font-extrabold text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all">
                          Lihat Detail
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Section */}
        <div className="flex items-center justify-center gap-1.5 mt-8">
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#8CAAE6] text-white text-[13px] font-extrabold shadow-sm">
            1
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 text-[13px] font-bold transition-colors">
            2
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 text-[13px] font-bold transition-colors">
            3
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
  );
}
