"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

import Image from "next/image";
import brandIcon from "@/app/icons/ClinicaLink.svg";

function Logo({ size = "md" }) {
  const s = size === "sm" ? 28 : 36;
  return (
    <div className="flex items-center gap-2 shrink-0">
      <Image src={brandIcon} alt="ClinicaLink" width={s} height={s} priority />
      <span className="text-xl font-bold whitespace-nowrap">
        <span className="text-gray-800">Clinica</span>
        <span className="text-indigo-600">Link</span>
      </span>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-full max-w-lg">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <div className="w-20 h-5 bg-gray-100 rounded-full" />
          <div className="w-5 h-5 rounded-full bg-gray-100" />
          <div className="w-5 h-5 rounded-full bg-gray-200" />
          <span className="text-xs text-gray-500">Akun</span>
        </div>
      </div>
      <div className="flex">
        <div className="w-28 border-r border-gray-100 py-3 px-2 flex flex-col gap-1">
          {[
            { icon: "⊞", label: "Dashboard", active: true },
            { icon: "👤", label: "Profil" },
            { icon: "📅", label: "Janji Temu" },
            { icon: "🩺", label: "Dokter" },
            { icon: "🔔", label: "Notifikasi" },
            { icon: "📋", label: "Riwayat" },
          ].map((item) => (
            <div key={item.label}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${item.active ? "bg-indigo-50 text-indigo-600" : "text-gray-500"
                }`}
            >
              <span className="text-xs">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          ))}
          <div className="mt-4 flex items-center gap-1.5 px-2 py-1.5 text-gray-400">
            <span className="text-xs">↩</span>
            <span className="text-xs">Keluar</span>
          </div>
        </div>
        <div className="flex-1 p-3">
          <p className="text-sm font-bold text-gray-800">Selamat Pagi, User</p>
          <p className="text-xs text-gray-500 mb-2">Berikut ringkasan aktivitas Anda hari ini.</p>
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {[
              { label: "Janji Temu Mendatang", val: "2" },
              { label: "Janji Temu Selesai", val: "12" },
              { label: "Pengingat Hari Ini", val: "1" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-400 leading-tight">{s.label}</p>
                <p className="text-lg font-bold text-gray-800">{s.val}</p>
              </div>
            ))}
          </div>
          <p className="text-xs font-semibold text-gray-700 mb-1">Janji Temu Mendatang</p>
          <div className="bg-gray-50 rounded-lg p-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-xs">🩺</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-800">Dr. Jatmiko</p>
              <p className="text-xs text-gray-400">Spesialis Umum</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">10 Mei 2030</p>
              <p className="text-xs text-gray-500">10.00 – 10.30</p>
            </div>
          </div>
          <div className="flex gap-1.5 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full text-green-700 bg-green-100">Dikonfirmasi</span>
            <button className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: "#6366F1" }}>Batalkan</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section id="beranda" className="max-w-6xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-12">
      <div className="flex-1">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
          Atur Janji Temu Klinik Jadi Lebih Mudah dan Cepat
        </h1>
        <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
          ClinicaLink membantu pasien melakukan reservasi dokter secara online, memudahkan dokter mengelola jadwal konsultan, serta membantu admin memantau seluruh aktivitas klinik secara real-time
        </p>
        <div className="flex gap-4">
          <Link href="/register"
            className="px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg,#6366F1,#3B82F6)" }}
          >Mulai Sekarang</Link>
          <a href="#fitur"
            className="px-6 py-3 rounded-xl text-gray-700 font-semibold text-sm border border-gray-300 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >Pelajari Lebih Lanjut</a>
        </div>
      </div>
      <div className="flex-1 flex justify-center">
        <DashboardMockup />
      </div>
    </section>
  );
}

const fiturList = [
  {
    icon: <svg width="28" height="28" fill="none" stroke="#6366F1" strokeWidth="1.8"><rect x="3" y="4" width="22" height="20" rx="3" /><path d="M3 10h22M9 2v4M19 2v4" strokeLinecap="round" /><path d="M8 16h4M8 20h8" strokeLinecap="round" /></svg>,
    title: "Jadwal Dokter Real-Time",
    desc: "Lihat Jadwal dokter yang tersedia secara langsung dan akurat.",
  },
  {
    icon: <svg width="28" height="28" fill="none" stroke="#6366F1" strokeWidth="1.8"><rect x="3" y="4" width="22" height="20" rx="3" /><path d="M9 14l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    title: "Booking Online",
    desc: "Lakukan reservasi konsultasi tanpa harus datang ke klinik.",
  },
  {
    icon: <svg width="28" height="28" fill="none" stroke="#6366F1" strokeWidth="1.8"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" /><path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" /></svg>,
    title: "Reminder Otomatis",
    desc: "Dapatkan pengingat jadwal konsultasi agar tidak terlewat.",
  },
  {
    icon: <svg width="28" height="28" fill="none" stroke="#6366F1" strokeWidth="1.8"><rect x="3" y="3" width="22" height="22" rx="3" /><path d="M8 17V13M12 17V9M16 17v-4M20 17v-7" strokeLinecap="round" /></svg>,
    title: "Dashboard Klinik",
    desc: "Pantau data reservasi, jadwal dan aktivitas klinik secara mudah.",
  },
];

function Fitur() {
  return (
    <section id="fitur" className="bg-gray-50 py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Fitur Utama ClinicaLink</h2>
          <p className="text-gray-500">Semua kebutuhan reservasi klinik dalam satu sistem terintegrasi</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {fiturList.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">{f.icon}</div>
              <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  { num: 1, icon: "👤", title: "Buat Akun", desc: "Buat akun jika belum memilikinya" },
  { num: 2, icon: "🔍", title: "Pilih Dokter", desc: "Cari dan pilih dokter sesuai kebutuhan dan jadwal" },
  { num: 3, icon: "📅", title: "Tentukan Jadwal", desc: "Pilih tanggal dan jam yang tersedia untuk konsultasi" },
  { num: 4, icon: "🔔", title: "Dapatkan Reminder", desc: "Terima pengingat otomatis sebelum jadwal konsultasi" },
];

function CaraKerja() {
  return (
    <section id="cara-kerja" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-14">Cara Kerja ClinicaLink</h2>
        <div className="flex flex-col md:flex-row items-start justify-center md:gap-4">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center text-center w-56">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 shadow-sm"
                  style={{ background: "linear-gradient(135deg,#EEF2FF,#DBEAFE)" }}>
                  <span>{s.icon}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white text-base font-bold flex items-center justify-center mb-3">
                  {s.num}
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed px-2">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block mx-4 text-gray-300 text-4xl mb-16">→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const doctors = [
  { name: "Dr. Jatmiko", spec: "Spesialis Umum", schedule: "Sen – Jum | 08.00 – 16.00" },
  { name: "Dr. Mike", spec: "Spesialis Anak", schedule: "Sen – Sab | 09.00 – 17.00" },
  { name: "Dr. Emily", spec: "Spesialis Gigi", schedule: "Sen – Jum | 08.00 – 16.00" },
  { name: "Dr. Anna", spec: "Spesialis Kandungan", schedule: "Sen – Jum | 10.00 – 16.00" },
];

function DokterCard({ doc }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="h-44 bg-gradient-to-br from-indigo-50 to-blue-50 relative flex items-center justify-center overflow-hidden">
        {doc.img_url ? (
          <img src={doc.img_url} alt={doc.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center z-10">
            <svg width="48" height="48" fill="none" stroke="#6366F1" strokeWidth="1.5">
              <circle cx="24" cy="16" r="8" />
              <path d="M8 44c0-8.837 7.163-16 16-16s16 7.163 16 16" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 truncate">{doc.name}</h3>
        <p className="text-sm text-gray-500 mb-1 truncate">{doc.spec}</p>
        <p className="text-xs text-gray-400 mb-3">{doc.schedule}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs px-3 py-1 rounded-full bg-green-50 text-green-600 font-medium">Tersedia</span>
          <Link href="/login"
            className="text-xs px-4 py-1.5 rounded-lg text-white font-medium hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#6366F1,#3B82F6)" }}
          >Pesan Sekarang</Link>
        </div>
      </div>
    </div>
  );
}

function DoctorSection() {
  const [dbDoctors, setDbDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRes = await fetch("/api/doctors?is_active=true", { cache: 'no-store' });
        const docData = await docRes.json();
        const schedRes = await fetch("/api/doctorSchedules", { cache: 'no-store' });
        const schedData = await schedRes.json();

        if (docRes.ok && schedRes.ok) {
          const docs = docData.data || [];
          const scheds = schedData.data || [];

          const mapped = docs.map(doc => {
            const docSchedules = scheds.filter(s => s.doctor_id === doc.id);
            const days = docSchedules.map(s => s.day_of_week).sort();
            let scheduleText = "Belum ada jadwal";
            let timeText = "";
            
            if (days.length > 0) {
              const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
              const firstDay = dayNames[days[0]];
              const lastDay = dayNames[days[days.length - 1]];
              scheduleText = days.length > 1 ? `${firstDay} - ${lastDay}` : firstDay;
              
              if (docSchedules[0]?.start_time && docSchedules[0]?.end_time) {
                 const start = docSchedules[0].start_time.substring(0, 5).replace(':', '.');
                 const end = docSchedules[0].end_time.substring(0, 5).replace(':', '.');
                 timeText = `${start} - ${end}`;
              }
            }
            
            return {
              name: doc.full_name,
              spec: doc.specialization_name || "Umum",
              schedule: timeText ? `${scheduleText} | ${timeText}` : scheduleText,
              img_url: doc.img_url
            };
          });
          
          setDbDoctors(mapped.slice(0, 4));
        }
      } catch (e) {
        console.error("Gagal load dokter", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayDoctors = dbDoctors.length > 0 ? dbDoctors : doctors;

  return (
    <section id="doctor" className="bg-gray-50 py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dokter Tersedia</h2>
          <Link href="/login" className="text-sm text-indigo-600 font-medium hover:underline">
            Lihat semua Dokter →
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-pulse flex space-x-4">
              <div className="w-64 h-72 bg-gray-200 rounded-2xl"></div>
              <div className="w-64 h-72 bg-gray-200 rounded-2xl hidden sm:block"></div>
              <div className="w-64 h-72 bg-gray-200 rounded-2xl hidden lg:block"></div>
              <div className="w-64 h-72 bg-gray-200 rounded-2xl hidden lg:block"></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayDoctors.map((d) => <DokterCard key={d.name} doc={d} />)}
          </div>
        )}
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-12 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tentang ClinicaLink</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              ClinicaLink adalah sistem informasi manajemen janji temu klinik berbasis web yang dirancang untuk menggantikan proses pendaftaran dan penjadwalan pasien yang masih dilakukan secara manual.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Sistem ini menghubungkan tiga jenis pengguna utama — pasien, dokter, dan admin klinik — dalam satu ekosistem digital yang saling terintegrasi.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { val: "100+", label: "Pasien Terdaftar" },
                { val: "20+", label: "Dokter Aktif" },
                { val: "95%", label: "Uptime Sistem" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">{s.val}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="w-64 h-64 rounded-3xl bg-white shadow-lg flex flex-col items-center justify-center gap-3">
              <Logo />
              <p className="text-xs text-gray-400 text-center px-4">Smart Clinic Appointment System</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-indigo-50 pt-14 pb-6">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div>
            <Logo />
            <p className="text-sm text-gray-500 mt-3 leading-relaxed max-w-xs">
              Sistem reservasi klinik modern berbasis web yang membantu pasien, dokter, dan admin mengelola janji temu dengan lebih efisien
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Menu</h4>
            <ul className="flex flex-col gap-2">
              {[
                { label: "Beranda", href: "#beranda" },
                { label: "Fitur", href: "#fitur" },
                { label: "Dokter", href: "#doctor" },
                { label: "Cara Kerja", href: "#cara-kerja" },
                { label: "Tentang", href: "#about" },
              ].map((m) => (
                <li key={m.label}><a href={m.href} className="text-sm text-gray-500 hover:text-indigo-600">{m.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Layanan</h4>
            <ul className="flex flex-col gap-2">
              {["Pesan Dokter", "Jadwal", "Reminder", "Riwayat", "Dashboard"].map((l) => (
                <li key={l}><a href="#" className="text-sm text-gray-500 hover:text-indigo-600">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-indigo-100 pt-6 text-center">
          <p className="text-xs text-gray-400">2026 ClinicaLink. Semua hak dilindungi</p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Fitur />
      <CaraKerja />
      <DoctorSection />
      <AboutSection />
      <Footer />
    </div>
  );
}
