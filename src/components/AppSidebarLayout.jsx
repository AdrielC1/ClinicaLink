"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import appointmentIcon from "@/app/icons/Appointment.svg";
import brandIcon from "@/app/icons/ClinicaLink.svg";
import dashboardIcon from "@/app/icons/Dashboard.svg";
import doctorIcon from "@/app/icons/Doctor.svg";
import historyIcon from "@/app/icons/Notif.svg";
import notificationIcon from "@/app/icons/Notification.svg";
import profileIcon from "@/app/icons/Profile.svg";

// SVG Icons for Sidebar
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
  { href: "/patient/dashboard", label: "Dashboard", icon: dashboardIcon },
  { href: "/patient/doctors", label: "Doctor", icon: doctorIcon },
  { href: "/patient/appointments", label: "Appointment", icon: appointmentIcon },
  { href: "/patient/history", label: "History", icon: notificationIcon },
  { href: "/patient/notifications", label: "Notification", icon: historyIcon },
  { href: "/patient/profile", label: "Profile", icon: profileIcon },
];

function readStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser =
    localStorage.getItem("clinicalink:user") ?? sessionStorage.getItem("clinicalink:user");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

function getPatientName(user) {
  const name = user?.full_name || user?.fullName || user?.name || "Kimmy";
  return String(name).trim() || "Kimmy";
}

function Brand() {
  return (
    <Link href="/landing" className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
        CL
      </span>
      <span className="text-xl font-bold">
        <span className="text-slate-900">Clinica</span>
        <span className="text-indigo-600">Link</span>
      </span>
    </Link>
  );
}

function PatientBrand() {
  return (
    <Link href="/landing" className="flex items-center gap-2">
      <Image src={brandIcon} alt="ClinicaLink" width={35} height={35} priority />
      <span className="text-2xl font-extrabold tracking-tight">
        <span className="text-[#1d2939]">Clinica</span>
        <span className="text-[#5e81cc]">Link</span>
      </span>
    </Link>
  );
}

function PatientLayout({ children, pathname, onSignOut }) {
  const [currentUser, setCurrentUser] = useState(null);
  const patientName = getPatientName(currentUser);
  const initial = patientName.charAt(0).toUpperCase();

  useEffect(() => {
    const frame = requestAnimationFrame(() => setCurrentUser(readStoredUser()));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-10 text-[#0b0b0f]">
      <div className="mx-auto w-full max-w-[1190px]">
        <header className="flex min-h-[66px] flex-wrap items-center justify-between gap-4 bg-white px-6 py-3 shadow-sm">
          <PatientBrand />

          <div className="flex flex-1 items-center justify-end gap-5 lg:gap-9">
            <label className="relative hidden lg:block">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa1ad]">
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-4.3-4.3m1.3-5.2a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                  />
                </svg>
              </span>
              <input
                type="search"
                placeholder="Search..."
                className="h-11 w-[350px] max-w-[35vw] rounded-[8px] border-0 bg-[#f4f4f4] pl-12 pr-4 text-[13px] font-medium outline-none placeholder:text-[#8d8d8d]"
              />
            </label>

            <button
              type="button"
              aria-label="Notifikasi"
              className="flex h-10 w-10 items-center justify-center text-black"
            >
              <svg
                aria-hidden="true"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0"
                />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 overflow-hidden rounded-full bg-[linear-gradient(135deg,#315c35,#e4b64f_48%,#f0dcc2)] p-0.5">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-[#d8c4ad] text-sm font-black text-[#2d3c2d]">
                  {initial}
                </div>
              </div>
              <span className="max-w-[160px] truncate text-base font-extrabold">{patientName}</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-7 pt-7 lg:grid-cols-[186px_minmax(0,1fr)]">
          <aside className="hidden min-h-[730px] flex-col bg-transparent lg:flex">
            <nav className="space-y-[9px]">
              {patientLinks.map((link) => {
                const active = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex h-[41px] items-center gap-4 rounded-[7px] px-3 text-[18px] font-extrabold transition ${
                      active ? "bg-[#e4ebff] text-[#5e81cc]" : "text-black hover:bg-white"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="h-[22px] w-[22px] bg-current"
                      style={{
                        WebkitMaskImage: `url(${link.icon.src})`,
                        maskImage: `url(${link.icon.src})`,
                        WebkitMaskPosition: "center",
                        maskPosition: "center",
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskSize: "contain",
                        maskSize: "contain",
                      }}
                    />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-[#a7abb3] pt-7">
              <button
                type="button"
                onClick={onSignOut}
                className="flex items-center gap-5 px-3 text-[18px] font-extrabold text-black"
              >
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.5 8.5V6a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2.5M10 12h9m0 0-3-3m3 3-3 3"
                  />
                </svg>
                <span>Log out</span>
              </button>
            </div>
          </aside>

          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function AppSidebarLayout({ children, role }) {
  const pathname = usePathname();
  const router = useRouter();

  // For MVP, we'll hardcode the links based on the requested Admin layout.
  // In a real app with multiple roles, you'd switch this based on `role`.
  const links = role === 'admin' ? adminLinks : adminLinks;

  const handleSignOut = () => {
    localStorage.removeItem("clinicalink:user");
    sessionStorage.removeItem("clinicalink:user");
    router.push("/login");
  };

  if (role === "patient") {
    return (
      <PatientLayout pathname={pathname} onSignOut={handleSignOut}>
        {children}
      </PatientLayout>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#2D3748] font-sans p-6 md:p-10 flex flex-col w-full">
      
      {/* Top Navbar */}
      <header className="w-full bg-white rounded-2xl shadow-sm px-6 md:px-8 py-4 flex items-center justify-between mb-8 z-20 relative">
        
        {/* Left: Logo */}
        <Link href="/landing" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          {/* Heart Pulse Icon */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl text-[#5E81CC]">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35zm-2.8-11.85l-1.7 1.7L6 9.7l2.5-2.5 3.5 3.5 2.5-2.5 2.5 2.5-1.5 1.5-3.5-3.5-2.8 2.8z"/>
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-[#2D3748]">Clinica</span>
            <span className="text-[#5E81CC]">Link</span>
          </span>
        </Link>

        {/* Center: Empty spacing */}
        <div className="hidden md:flex relative flex-1 max-w-lg mx-8">
        </div>

        {/* Right: Bell & Profile */}
        <div className="flex items-center gap-6 shrink-0">
          <button className="text-gray-600 hover:text-[#5E81CC] transition-colors relative p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <img src="https://ui-avatars.com/api/?name=Admin&background=5E81CC&color=fff&rounded=true" alt="Admin Profile" className="w-10 h-10 rounded-full border border-gray-100" />
            <span className="font-bold text-[#2D3748] hidden sm:block">Admin</span>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        
        {/* Transparent Left Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-col justify-between bg-white/60 backdrop-blur-sm border border-gray-100 shadow-sm rounded-2xl p-4">
          <nav className="space-y-1.5 flex-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl text-[15px] font-bold transition-all duration-200 ${
                    active
                      ? "bg-[#E6EDFF] text-[#5E81CC] shadow-sm"
                      : "text-gray-700 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <span className={`${active ? "text-[#5E81CC]" : "text-gray-600"}`}>
                    {icons[link.label] || icons["Dashboard"]}
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Logout Area */}
          <div className="mt-8">
            <hr className="border-gray-200 border-[1.5px] mb-6 mx-2" />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-4 px-5 py-3.5 w-full rounded-xl text-[15px] font-bold text-gray-800 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log out
            </button>
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
