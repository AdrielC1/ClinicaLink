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

const roleConfig = {
  patient: {
    title: "Patient Portal",
    subtitle: "Kelola janji temu dan riwayat kesehatan",
    links: [
      { href: "/patient/dashboard", label: "Dashboard" },
      { href: "/patient/appointments", label: "Janji Temu" },
      { href: "/patient/doctors", label: "Dokter" },
      { href: "/patient/history", label: "Riwayat" },
      { href: "/patient/notifications", label: "Notifikasi" },
      { href: "/patient/profile", label: "Profil" },
    ],
  },
  doctor: {
    title: "Doctor Portal",
    subtitle: "Pantau pasien dan jadwal praktik",
    links: [
      { href: "/doctor/dashboard", label: "Dashboard" },
      { href: "/doctor/patients", label: "Pasien" },
    ],
  },
  admin: {
    title: "Admin Portal",
    subtitle: "Kelola operasional ClinicaLink",
    links: [
      { href: "/admin/dashboard", label: "Dashboard" },
      { href: "/admin/appointments", label: "Janji Temu" },
      { href: "/admin/doctors", label: "Dokter" },
      { href: "/admin/patients", label: "Pasien" },
      { href: "/admin/schedules", label: "Jadwal" },
      { href: "/admin/reports", label: "Laporan" },
    ],
  },
};

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

  // Fungsi untuk memuat user dan memastikan state terupdate
  useEffect(() => {
    const loadUser = () => {
      const user = readStoredUser();
      if (user) {
        setCurrentUser(user);
      }
    };

    loadUser();

    // Tambahkan event listener jika ada perubahan login di tab lain
    window.addEventListener("storage", loadUser);
    return () => window.removeEventListener("storage", loadUser);
  }, []);

  const patientName = getPatientName(currentUser);
  const initial = patientName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-10 text-[#0b0b0f]">
      <div className="mx-auto w-full max-w-[1190px]">
        <header className="flex min-h-[66px] flex-wrap items-center justify-between gap-4 bg-white px-6 py-3 shadow-sm rounded-2xl">
          <PatientBrand />

          <div className="flex flex-1 items-center justify-end gap-5 lg:gap-9">
            {/* ... (input search tetap sama) ... */}

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 overflow-hidden rounded-full bg-[linear-gradient(135deg,#315c35,#e4b64f_48%,#f0dcc2)] p-0.5">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-[#d8c4ad] text-sm font-black text-[#2d3c2d]">
                  {initial}
                </div>
              </div>
              {/* Nama yang sudah dinamis berdasarkan state currentUser */}
              <span className="max-w-[160px] truncate text-base font-extrabold text-slate-800">
                {patientName}
              </span>
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
                    className={`flex h-[41px] items-center gap-4 rounded-[7px] px-3 text-[18px] font-extrabold transition ${active ? "bg-[#e4ebff] text-[#5e81cc]" : "text-black hover:bg-white"
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
  const config = roleConfig[role] ?? roleConfig.patient;

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-slate-200 bg-white px-5 py-6 lg:flex">
        <Brand />
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {config.title}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{config.subtitle}</p>
        </div>
        <nav className="mt-8 space-y-1">
          {config.links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <Brand />
            <button
              type="button"
              onClick={handleSignOut}
              className="shrink-0 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {config.links.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${active
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-slate-100 text-slate-600"
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}