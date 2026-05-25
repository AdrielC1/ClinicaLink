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
    title: "Alert aktif",
    description: "perlu ditinjau",
    icon: AlertTriangle,
    iconClass: "bg-[#FFF0CF] text-[#D99000]",
  },
  {
    value: "2",
    title: "Urgent",
    description: "butuh tindakan cepat",
    icon: CalendarClock,
    iconClass: "bg-[#FFEDED] text-[#F15959]",
  },
  {
    value: "3",
    title: "Update hari ini",
    description: "aktivitas terbaru",
    icon: ClipboardList,
    iconClass: "bg-[#E6EDFF] text-[#5E81CC]",
  },
];

const adminAlerts = [
  {
    title: "Appointment baru masuk",
    message: "Kimmy membuat appointment dengan Dr. Emily pukul 10.00 WIB.",
    time: "09.10",
    badge: "Baru",
    icon: CalendarCheck,
    iconClass: "bg-[#E6EDFF] text-[#5E81CC]",
    badgeClass: "bg-[#DDE8FF] text-[#5E81CC]",
  },
  {
    title: "Appointment dibatalkan",
    message: "Sila membatalkan jadwal konsultasi karena berhalangan hadir.",
    time: "09.30",
    badge: "Urgent",
    icon: AlertTriangle,
    iconClass: "bg-[#FFEDED] text-[#F15959]",
    badgeClass: "bg-[#FFD7D7] text-[#E85656]",
  },
  {
    title: "Jadwal dokter berubah",
    message: "Jadwal Dr. Mike diperbarui untuk slot praktik minggu ini.",
    time: "10.15",
    badge: "Update",
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
    title: "Reminder laporan mingguan",
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
    <section className="min-h-full border border-[#D8EDF4] bg-[#F0FBFF] px-4 py-6 sm:px-6 lg:px-10 xl:px-[48px]">
      <div className="mx-auto w-full max-w-[980px]">
        <header className="mb-6">
          <h1 className="text-[24px] font-extrabold leading-tight text-black sm:text-[26px]">
            Admin Alerts
          </h1>
          <p className="mt-2 text-[15px] font-bold leading-snug text-[#646464] sm:text-[16px]">
            Pusat aktivitas yang perlu perhatian cepat dari admin.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="grid min-h-[96px] grid-cols-[52px_1fr] items-center gap-4 rounded-[10px] bg-white px-4 shadow-sm"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-[8px] ${card.iconClass}`}>
                  <Icon className="h-6 w-6" strokeWidth={2.3} />
                </div>
                <div className="min-w-0">
                  <p className="text-[24px] font-extrabold leading-none text-black">{card.value}</p>
                  <p className="mt-3 text-[12px] font-extrabold leading-tight text-black">{card.title}</p>
                  <p className="text-[11px] font-semibold leading-tight text-[#8B8B8B]">{card.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-[10px] bg-white px-4 py-4 shadow-sm sm:px-5">
          <h2 className="mb-2 text-[14px] font-extrabold text-black">Pusat Aktivitas</h2>
          <div>
            {adminAlerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <div
                  key={alert.title}
                  className="grid gap-3 border-b border-[#E3E3E3] py-3 last:border-b-0 sm:grid-cols-[52px_minmax(0,1fr)_112px]"
                >
                  <div className="flex sm:justify-center">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-full ${alert.iconClass}`}>
                      <Icon className="h-5 w-5" strokeWidth={2.3} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-extrabold leading-tight text-black">{alert.title}</h3>
                    <p className="mt-1 text-[11px] font-semibold leading-snug text-[#7A7A7A]">
                      {alert.message}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
                    <p className="whitespace-nowrap text-[11px] font-bold text-[#969696]">
                      Hari ini · {alert.time}
                    </p>
                    <span className={`rounded-[5px] px-2 py-1 text-[11px] font-extrabold leading-none ${alert.badgeClass}`}>
                      {alert.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
