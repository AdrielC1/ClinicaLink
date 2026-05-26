"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import appointmentIcon from "@/app/icons/Appointment.svg";
import brandIcon from "@/app/icons/ClinicaLink.svg";
import dashboardIcon from "@/app/icons/Dashboard.svg";
import doctorIcon from "@/app/icons/Doctor.svg";
import historyIcon from "@/app/icons/History.svg";
import notificationIcon from "@/app/icons/Notification.svg";
import profileIcon from "@/app/icons/Profile.svg";

// SVG Icons for Sidebar (Admin & Doctor)
const icons = {
  Dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  "Kelola Dokter": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  "Kelola Pasien": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  "Pasien List": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  "Kelola Appointment": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  "Kelola Jadwal": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  "Laporan": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  "Pengaturan": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/doctors", label: "Kelola Dokter" },
  { href: "/admin/patients", label: "Kelola Pasien" },
  { href: "/admin/appointments", label: "Kelola Appointment" },
  { href: "/admin/schedules", label: "Kelola Jadwal" },
  { href: "/admin/reports", label: "Laporan" },
  { href: "/admin/settings", label: "Pengaturan" },
];

const patientLinks = [
  { href: "/patient/dashboard", label: "Dashboard", customIcon: dashboardIcon },
  { href: "/patient/doctors", label: "Doctor", customIcon: doctorIcon },
  { href: "/patient/appointments", label: "Appointment", customIcon: appointmentIcon },
  { href: "/patient/history", label: "History", customIcon: historyIcon },
  { href: "/patient/notifications", label: "Notification", customIcon: notificationIcon },
  { href: "/patient/profile", label: "Profile", customIcon: profileIcon },
];

const doctorLinks = [
  { href: "/doctor/dashboard", label: "Dashboard" },
  { href: "/doctor/patients", label: "Pasien List" },
];

const ROLE_ROUTES = {
  admin: "/admin",
  doctor: "/doctor",
  patient: "/patient",
};

function readStoredUser() {
  if (typeof window === "undefined") return null;
  const rawUser = localStorage.getItem("clinicalink:user") ?? sessionStorage.getItem("clinicalink:user");
  if (!rawUser) return null;
  try { return JSON.parse(rawUser); } catch { return null; }
}

function getUserName(user, role) {
  if (role === 'admin') return 'Admin';
  const name = user?.full_name || user?.fullName || user?.name || user?.username || (role === 'doctor' ? 'Dokter' : 'Pasien');
  return String(name).trim();
}

export default function AppSidebarLayout({ children, role }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [hasUnread, setHasUnread] = useState(true);

  // Cek role secara SINKRON sebelum render pertama (mencegah flash UI)
  // Lazy initializer useState berjalan saat komponen dibuat, sebelum render apapun
  const [isRoleValid] = useState(() => {
    if (typeof window === "undefined") return true; // SSR: izinkan dulu
    const storedRole = localStorage.getItem("clinicalink:role");
    if (!storedRole) return true; // Belum ada data, biarkan async guard yang handle
    return storedRole === role; // false = role salah, jangan render apapun
  });

  // Jika role tidak sesuai (misal: dokter buka URL /admin), langsung redirect
  useEffect(() => {
    if (!isRoleValid) {
      const correctRole = localStorage.getItem("clinicalink:role");
      if (correctRole && ROLE_ROUTES[correctRole]) {
        window.location.replace(`/${correctRole}/dashboard`);
      } else {
        window.location.replace("/login");
      }
    }
  }, [isRoleValid]);

  useEffect(() => {
    const loadUser = async () => {
      // 1. Coba baca dari localStorage (sistem lama)
      let user = readStoredUser();

      // 2. Ambil dari Supabase (sistem baru)
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (!authUser || error) {
        // Jika tidak ada sesi, paksa ke login (menghindari cache)
        window.location.replace("/login");
        return;
      }

      const { data: userData } = await supabase.from("users").select("role, full_name, username").eq("id", authUser.id).single();
      
      // GUARD: Jika role user tidak sama dengan role layout ini (efek klik Back di browser),
      // lemparkan mereka ke dashboard yang seharusnya!
      if (userData?.role && userData.role !== role) {
        window.location.replace(`/${userData.role}/dashboard`);
        return;
      }

      // Update role di local storage untuk sinkronisasi cache berikutnya
      if (userData?.role) {
        localStorage.setItem("clinicalink:role", userData.role);
      }

      user = {
        ...user,
        ...authUser,
        full_name: userData?.full_name || authUser.user_metadata?.full_name || user?.full_name,
        username: userData?.username || user?.username
      };

      if (user) setCurrentUser(user);
    };

    loadUser();

    // Penjaga Cache Ganda (BFCache Browser & Next.js Router Cache)
    // Berjalan saat pengguna menggunakan tombol Back/Forward di browser
    const handleHistoryNavigation = () => {
      const currentRole = localStorage.getItem("clinicalink:role");
      if (currentRole && currentRole !== role) {
        // Cache Next.js / Browser mencoba menampilkan halaman yang role-nya tidak cocok
        // Paksa reload penuh agar server (middleware.js) yang mengambil alih
        window.location.href = `/${currentRole}/dashboard`;
      } else if (!currentRole) {
        window.location.href = "/login";
      }
    };

    // Dengarkan event 'pageshow' (untuk BFCache) dan 'popstate' (untuk Next.js Client Cache)
    window.addEventListener("pageshow", handleHistoryNavigation);
    window.addEventListener("popstate", handleHistoryNavigation);

    const handleStorage = () => {
      const u = readStoredUser();
      if (u) setCurrentUser(prev => ({ ...prev, ...u }));
      
      const read = localStorage.getItem("notifications_read");
      setHasUnread(read !== "true");
    };
    window.addEventListener("storage", handleStorage);
    
    // Check notification initially
    setHasUnread(localStorage.getItem("notifications_read") !== "true");
    
    return () => {
      window.removeEventListener("pageshow", handleHistoryNavigation);
      window.removeEventListener("popstate", handleHistoryNavigation);
      window.removeEventListener("storage", handleStorage);
    };
  }, [role]);

  const links = role === 'admin' ? adminLinks : role === 'doctor' ? doctorLinks : patientLinks;

  const handleSignOut = async () => {
    try {
      localStorage.removeItem("clinicalink:user");
      localStorage.removeItem("clinicalink:role");
      sessionStorage.removeItem("clinicalink:user");
      document.cookie = "clinicalink_role=; path=/; max-age=0";
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      window.location.href = "/landing";
    }
  };

  // Jangan render apapun jika role salah (mencegah flash UI admin bagi akun dokter)
  if (!isRoleValid) return null;

  const displayUserName = getUserName(currentUser, role);
  const avatarUrl = role === 'admin'
    ? "https://ui-avatars.com/api/?name=Admin&background=5E81CC&color=fff&rounded=true"
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayUserName)}&background=5E81CC&color=fff&rounded=true`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#2D3748] font-sans p-6 md:p-10 flex flex-col w-full">
      {/* Top Navbar */}
      <header className="w-full bg-white rounded-2xl shadow-sm px-6 md:px-8 py-4 flex items-center justify-between mb-8 z-20 relative">
        {/* Left: Logo */}
        <Link href="/landing" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Image src={brandIcon} alt="ClinicaLink" width={35} height={35} priority />
          <span className="text-2xl font-extrabold tracking-tight">
            <span className="text-[#2D3748]">Clinica</span>
            <span className="text-[#5E81CC]">Link</span>
          </span>
        </Link>

        {/* Center: Search (dihapus per permintaan) */}
        <div className="hidden md:flex relative flex-1 max-w-lg mx-8"></div>

        {/* Right: Bell & Profile */}
        <div className="flex items-center gap-6 shrink-0">
          <button 
            onClick={() => {
              if (role === 'patient') router.push('/patient/notifications');
            }}
            className="text-gray-600 hover:text-[#5E81CC] transition-colors relative p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {hasUnread && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
          </button>
          <div 
            onClick={() => {
              if (role === 'patient') router.push('/patient/profile');
              else if (role === 'admin') router.push('/admin/settings');
            }}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img src={avatarUrl} alt="Profile" className="w-10 h-10 rounded-full border border-gray-100" />
            <span className="font-bold text-[#2D3748] hidden sm:block">{displayUserName}</span>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        {/* Transparent Left Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-col justify-between bg-white/60 backdrop-blur-sm border border-gray-100 shadow-sm rounded-2xl p-4 self-start lg:sticky lg:top-10 lg:h-[calc(100vh-180px)]">
          <nav className="space-y-1.5 flex-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl text-[15px] font-bold transition-all duration-200 ${active ? "bg-[#E6EDFF] text-[#5E81CC] shadow-sm" : "text-gray-700 hover:bg-white hover:shadow-sm"}`}
                >
                  {link.customIcon ? (
                    <span
                      aria-hidden="true"
                      className={`h-5 w-5 ${active ? "bg-[#5E81CC]" : "bg-gray-600"}`}
                      style={{
                        WebkitMaskImage: `url(${link.customIcon.src})`, maskImage: `url(${link.customIcon.src})`,
                        WebkitMaskPosition: "center", maskPosition: "center",
                        WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
                        WebkitMaskSize: "contain", maskSize: "contain",
                      }}
                    />
                  ) : (
                    <span className={`${active ? "text-[#5E81CC]" : "text-gray-600"}`}>
                      {icons[link.label] || icons["Dashboard"]}
                    </span>
                  )}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Logout Area */}
          <div className="mt-8">
            <hr className="border-gray-200 border-[1.5px] mb-6 mx-2" />
            <a
              href="/api/logout"
              onClick={() => {
                // Bersihkan data lokal sebelum redirect (bonus, bukan wajib)
                try {
                  localStorage.removeItem("clinicalink:user");
                  localStorage.removeItem("clinicalink:role");
                  sessionStorage.removeItem("clinicalink:user");
                  document.cookie = "clinicalink_role=; path=/; max-age=0";
                } catch(e) {}
              }}
              className="flex items-center gap-4 px-5 py-3.5 w-full rounded-xl text-[15px] font-bold text-gray-800 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log out
            </a>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}