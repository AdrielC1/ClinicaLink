"use client";

import { useEffect } from "react";
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Headphones,
  Info,
  X,
  XCircle,
} from "lucide-react";

const summaryCards = [
  {
    value: "3",
    title: "Notifikasi baru",
    description: "belum dibaca",
    icon: CalendarCheck,
    iconClass: "bg-[#E7EDFF] text-[#5E81CC]",
  },
  {
    value: "1",
    title: "Reminder hari ini",
    description: "jangan sampai terlewat",
    icon: CheckCircle2,
    iconClass: "bg-[#E8FFE8] text-[#22C55E]",
  },
  {
    value: "1",
    title: "Update jadwal",
    description: "perubahan terbaru",
    icon: XCircle,
    iconClass: "bg-[#FFF0F0] text-[#FF5252]",
  },
];

const notifications = [
  {
    title: "Reminder Konsultasi",
    message: "jangan lupa appointment dengan Dr. Emily besok pukul 10.00 WIB.",
    time: "09.00",
    badge: "H-1",
    icon: Bell,
    iconClass: "bg-[#EEF3FF] text-[#5E81CC]",
    badgeClass: "bg-[#FFE6CE] text-[#FF8A00]",
  },
  {
    title: "Booking Berhasil",
    message: "appointment dengan Dr. Emily berhasil dijadwalkan pada 12 Mei 2030 pukul 10.00 WIB.",
    time: "12.00",
    badge: "Berhasil",
    icon: CalendarCheck,
    iconClass: "bg-[#E9FFE8] text-[#14C914]",
    badgeClass: "bg-[#DDFBDA] text-[#05B705]",
  },
  {
    title: "Perubahan Jadwal",
    message: "jadwal anda dengan Dr. Emily diperbarui menjadi pukul 12.00 WIB.",
    time: "12.00",
    badge: "Update",
    icon: Clock3,
    iconClass: "bg-[#F8DFFF] text-[#C53BFF]",
    badgeClass: "bg-[#F6C8FF] text-[#C33BFF]",
  },
  {
    title: "Appointment dibatalkan",
    message: "appointment anda dengan dr. Mike pada 20 Mei 2030 pukul 10.00 WIB telah dibatalkan.",
    time: "09.00",
    badge: "Dibatalkan",
    icon: X,
    iconClass: "bg-[#FFEDED] text-[#FF5252]",
    badgeClass: "bg-[#FFD9D9] text-[#FF3333]",
  },
  {
    title: "Informasi Klinik",
    message: "jangan lupa appointment dengan Dr. Emily besok pukul 10.00 WIB.",
    time: "09.00",
    badge: "Info",
    icon: Info,
    iconClass: "bg-[#EEF3FF] text-[#5E81CC]",
    badgeClass: "bg-[#DDE7FF] text-[#5E81CC]",
  },
];

export default function PatientNotificationsPage() {
  useEffect(() => {
    localStorage.setItem("notifications_read", "true");
    window.dispatchEvent(new Event("storage"));
  }, []);

  return (
    <section className="min-h-full border border-[#D8EDF4] bg-[#F0FBFF] px-4 py-5 sm:px-6 lg:px-7 xl:px-8">
      <div className="mb-6">
        <h1 className="text-[24px] font-extrabold leading-tight text-black sm:text-[26px]">
          Notification
        </h1>
        <p className="mt-2 text-[14px] font-bold leading-snug text-black sm:text-[15px]">
          Lihat pengingat dan informasi terbaru terkait appointment Anda.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_288px]">
        <div className="min-w-0">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="grid min-h-[92px] grid-cols-[52px_1fr] items-center gap-4 rounded-[10px] bg-white px-4 shadow-sm"
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-[8px] ${card.iconClass}`}>
                    <Icon className="h-6 w-6" strokeWidth={2.4} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-center text-[24px] font-extrabold leading-none text-black">
                      {card.value}
                    </p>
                    <p className="mt-3 text-[11px] font-extrabold leading-tight text-black">
                      {card.title}
                    </p>
                    <p className="text-[11px] font-semibold leading-tight text-[#8B8B8B]">
                      {card.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-[8px] bg-white px-4 py-4 shadow-sm sm:px-5">
            <h2 className="mb-2 text-[12px] font-extrabold text-black">Semua Notifikasi</h2>
            <div>
              {notifications.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="grid gap-3 border-b border-[#E3E3E3] py-3 last:border-b-0 sm:grid-cols-[52px_minmax(0,1fr)_132px]"
                  >
                    <div className="flex sm:justify-center">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-full ${item.iconClass}`}>
                        <Icon className="h-5 w-5" strokeWidth={2.3} />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[12px] font-extrabold leading-tight text-black">{item.title}</h3>
                      <p className="mt-1 text-[11px] font-semibold leading-snug text-[#9A9A9A]">
                        {item.message}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
                      <p className="whitespace-nowrap text-[11px] font-bold text-[#969696]">
                        11 Mei 2030 <span className="px-1.5">·</span> {item.time}
                      </p>
                      <span className={`rounded-[5px] px-2 py-1 text-[11px] font-extrabold leading-none ${item.badgeClass}`}>
                        {item.badge}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="py-6 text-center text-[12px] font-extrabold text-black">
            Tidak ada notifikasi lainnya
          </p>
        </div>

        <aside className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-[10px] bg-[#EAF0FF] px-5 py-6 text-center">
            <h2 className="text-[15px] font-extrabold text-black">Reminder Terdekat</h2>
            <img
              src="https://i.pravatar.cc/180?img=47"
              alt="Dr. Emily"
              className="mx-auto mt-7 h-[136px] w-[136px] rounded-full object-cover"
            />
            <h3 className="mt-8 text-[16px] font-extrabold text-black">Dr. Emily</h3>

            <div className="mx-auto mt-4 max-w-[190px] space-y-5 text-left">
              <div className="grid grid-cols-[28px_1fr] items-center gap-3">
                <CalendarDays className="h-6 w-6 text-black" strokeWidth={2.2} />
                <p className="text-[15px] font-extrabold text-black">12 Mei 2030</p>
              </div>
              <div className="grid grid-cols-[28px_1fr] items-center gap-3">
                <Clock3 className="h-6 w-6 text-black" strokeWidth={2.2} />
                <p className="text-[15px] font-extrabold text-black">10.00 - 10.30 WIB</p>
              </div>
              <div className="grid grid-cols-[42px_1fr] items-center gap-3">
                <p className="text-[12px] font-extrabold text-black">status</p>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-[6px] bg-[#CFF8CE] px-3 py-1 text-[11px] font-semibold text-[#05B705]">
                  <Check className="h-3.5 w-3.5" />
                  Dijadwalkan
                </span>
              </div>
            </div>

            <button className="mt-4 w-full max-w-[162px] rounded-[6px] bg-[#5E81CC] px-4 py-2.5 text-[12px] font-extrabold text-white transition-colors hover:bg-[#4D6FB5]">
              Lihat Appointment
            </button>
          </div>

          <div className="rounded-[8px] bg-[#FFF0CF] px-6 py-4 text-center">
            <h2 className="text-[16px] font-extrabold text-black">Butuh Bantuan?</h2>
            <Headphones className="mx-auto mt-1 h-16 w-16 text-[#FFB83D]" strokeWidth={1.8} />
            <p className="mx-auto mt-1 max-w-[210px] text-[13px] font-semibold leading-snug text-black">
              Hubungi kami jika ada pertanyaan atau kendala
            </p>
            <button className="mt-6 w-full rounded-[6px] border border-[#FF9F1A] bg-white/20 px-4 py-3 text-[12px] font-extrabold text-[#E48900] transition-colors hover:bg-white/60">
              Hubungi Support
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
