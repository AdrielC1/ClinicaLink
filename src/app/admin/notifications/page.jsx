"use client";

import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  FileText,
  Stethoscope,
  UserPlus,
  UserRoundCheck,
} from "lucide-react";

const summaryCards = [
  {
    value: "8",
    title: "Peringatan aktif",
    description: "perlu ditinjau",
    icon: AlertTriangle,
    iconClass: "bg-[#FFF0CF] text-[#D99000]",
  },
  {
    value: "2",
    title: "Mendesak",
    description: "butuh tindakan cepat",
    icon: CalendarClock,
    iconClass: "bg-[#FFEDED] text-[#F15959]",
  },
  {
    value: "3",
    title: "Pembaruan hari ini",
    description: "aktivitas terbaru",
    icon: ClipboardList,
    iconClass: "bg-[#E6EDFF] text-[#5E81CC]",
  },
];

const adminAlerts = [
  {
    title: "Janji temu baru masuk",
    message: "Kimmy membuat janji temu dengan Dr. Emily pukul 10.00 WIB.",
    time: "09.10",
    badge: "Baru",
    icon: CalendarCheck,
    iconClass: "bg-[#E6EDFF] text-[#5E81CC]",
    badgeClass: "bg-[#DDE8FF] text-[#5E81CC]",
  },
  {
    title: "Janji temu dibatalkan",
    message: "Sila membatalkan jadwal konsultasi karena berhalangan hadir.",
    time: "09.30",
    badge: "Mendesak",
    icon: AlertTriangle,
    iconClass: "bg-[#FFEDED] text-[#F15959]",
    badgeClass: "bg-[#FFD7D7] text-[#E85656]",
  },
  {
    title: "Jadwal dokter berubah",
    message: "Jadwal Dr. Mike diperbarui untuk slot praktik minggu ini.",
    time: "10.15",
    badge: "Pembaruan",
    icon: CalendarClock,
    iconClass: "bg-[#FFF0CF] text-[#D99000]",
    badgeClass: "bg-[#FFF0CF] text-[#D99000]",
  },
  {
    title: "Pasien baru terdaftar",
    message: "Nina baru bergabung sebagai pasien ClinicaLink.",
    time: "11.00",
    badge: "Pasien",
    icon: UserPlus,
    iconClass: "bg-[#E5FFE6] text-[#05A805]",
    badgeClass: "bg-[#DDFBDA] text-[#05A805]",
  },
  {
    title: "Dokter baru ditambahkan",
    message: "Dr. Riri ditambahkan sebagai dokter baru dan menunggu jadwal praktik.",
    time: "12.20",
    badge: "Dokter",
    icon: Stethoscope,
    iconClass: "bg-[#E6EDFF] text-[#5E81CC]",
    badgeClass: "bg-[#DDE8FF] text-[#5E81CC]",
  },
  {
    title: "Konflik jadwal terdeteksi",
    message: "Ada potensi slot bentrok pada 12 Mei 2030 pukul 10.00 WIB.",
    time: "13.05",
    badge: "Cek",
    icon: AlertTriangle,
    iconClass: "bg-[#FFEDED] text-[#F15959]",
    badgeClass: "bg-[#FFD7D7] text-[#E85656]",
  },
  {
    title: "Pengingat laporan mingguan",
    message: "Laporan operasional mingguan sudah siap ditinjau.",
    time: "14.00",
    badge: "Laporan",
    icon: FileText,
    iconClass: "bg-[#FFF0CF] text-[#D99000]",
    badgeClass: "bg-[#FFF0CF] text-[#D99000]",
  },
  {
    title: "Data perlu verifikasi",
    message: "Ada dokter yang belum aktif dan perlu diverifikasi admin.",
    time: "15.25",
    badge: "Verifikasi",
    icon: UserRoundCheck,
    iconClass: "bg-[#E5FFE6] text-[#05A805]",
    badgeClass: "bg-[#DDFBDA] text-[#05A805]",
  },
];

export default function AdminNotificationsPage() {
  return (
    <div className="font-sans text-slate-800 pb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Notifikasi Admin</h1>
        <p className="text-gray-500 text-sm">Pusat aktivitas yang memerlukan perhatian cepat dari admin.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex items-center gap-4"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.iconClass}`}>
                <Icon className="h-6 w-6" strokeWidth={2.3} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 leading-none">{card.value}</p>
                <p className="text-sm font-bold text-gray-800 mt-2">{card.title}</p>
                <p className="text-xs font-medium text-gray-500">{card.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden pb-4">
        <div className="p-6 pb-2">
          <h2 className="text-lg font-bold text-gray-900">Pusat Aktivitas</h2>
        </div>
        <div className="px-6">
          <div className="divide-y divide-slate-100">
            {adminAlerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <div
                  key={alert.title}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 py-4"
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${alert.iconClass}`}>
                    <Icon className="h-5 w-5" strokeWidth={2.3} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900">{alert.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{alert.message}</p>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <p className="text-xs font-semibold text-gray-500">Hari ini · {alert.time}</p>
                    <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${alert.badgeClass}`}>
                      {alert.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
