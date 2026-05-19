"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const roleConfig = {
  patient: {
    title: "Patient Portal",
    subtitle: "Kelola janji temu dan riwayat kesehatan",
    links: [
      // ✅ JALUR LINK SUDAH DISESUAIKAN DENGAN STRUKTUR FOLDER AKTUAL ANDA
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
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-sm">
        CL
      </span>
      <span className="text-xl font-bold tracking-tight">
        <span className="text-slate-950">Clinica</span>
        <span className="text-indigo-600 font-extrabold">Link</span>
      </span>
    </Link>
  );
}

export default function AppSidebarLayout({ children, role }) {
  const pathname = usePathname();
  const router = useRouter();
  const config = roleConfig[role] ?? roleConfig.patient;

  const handleSignOut = async () => {
    // Gunakan standar resmi signOut Supabase agar sesi cookie bersih total
    await supabase.auth.signOut();
    localStorage.removeItem("clinicalink:user");
    sessionStorage.removeItem("clinicalink:user");
    router.push("/login");
  };

  return (
    // Memastikan background dasar bersih dan layout memakai sistem flex global
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row w-full overflow-x-hidden">

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-slate-200 bg-white px-6 py-6 lg:flex z-40">
        <Brand />

        <div className="mt-8 border-b border-slate-100 pb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {config.title}
          </p>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">{config.subtitle}</p>
        </div>

        <nav className="mt-6 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {config.links.map((link) => {
            // Evaluasi pencocokan rute yang presisi
            const active = pathname === link.href || pathname?.startsWith(link.href + "/");

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${active
                    ? "bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600 pl-3"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent"
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition-all hover:bg-red-50 active:scale-[0.98]"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ================= MOBILE HEADER & RESPONSIVE NAV ================= */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur lg:hidden w-full">
        <div className="flex items-center justify-between gap-4">
          <Brand />
          <button
            type="button"
            onClick={handleSignOut}
            className="shrink-0 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50"
          >
            Sign Out
          </button>
        </div>
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {config.links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all ${active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* ================= CONTAINER KONTEN UTAMA ================= */}
      {/* Perbaikan Kritis: padding-left disamakan dengan lebar pasti desktop sidebar (w-72 = pl-72) */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0 w-full">
        <main className="flex-1 w-full p-5 sm:p-8 lg:p-10">
          {/* Mengeliminasi pembatas max-w-6xl yang mencekik space card di resolusi desktop */}
          <div className="w-full max-w-[1400px] mx-auto animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}