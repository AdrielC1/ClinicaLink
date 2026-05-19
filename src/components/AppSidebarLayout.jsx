"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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

function Brand() {
  return (
    <Link href="/landing" className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5E81CC] text-lg font-bold text-white shadow-sm">
        CL
      </span>
      <span className="text-xl font-bold tracking-tight">
        <span className="text-[#2D3748]">Clinica</span>
        <span className="text-[#5E81CC]">Link</span>
      </span>
    </Link>
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#2D3748] font-sans">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-gray-200 bg-white px-6 py-8 lg:flex shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
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
                className={`flex rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-[#F3F6FB] text-[#5E81CC]"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
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
            className="flex w-full items-center justify-center rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 hover:border-red-200"
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
              className="shrink-0 rounded-lg bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
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
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    active
                      ? "bg-[#5E81CC] text-white shadow-md shadow-blue-500/20"
                      : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto min-h-screen w-full max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  );
}
