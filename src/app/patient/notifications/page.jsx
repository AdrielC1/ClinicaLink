"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Info,
  X,
  XCircle,
} from "lucide-react";

// Konfigurasi varian badge & icon disesuaikan dengan Mock-up
const badgeVariants = [
  {
    matcher: /reminder|pengingat/i,
    label: "H-1",
    icon: Bell,
    iconClass: "bg-[#EEF3FF] text-[#5E81CC]",
    badgeClass: "bg-[#FFE6CE] text-[#FF8A00]",
  },
  {
    matcher: /berhasil|booking|sukses/i,
    label: "Berhasil",
    icon: CalendarCheck,
    iconClass: "bg-[#E9FFE8] text-[#14C914]",
    badgeClass: "bg-[#DDFBDA] text-[#05B705]",
  },
  {
    matcher: /update|perubahan|jadwal/i,
    label: "Update",
    icon: Clock3,
    iconClass: "bg-[#F8DFFF] text-[#C53BFF]",
    badgeClass: "bg-[#F6C8FF] text-[#C33BFF]",
  },
  {
    matcher: /batal|dibatalkan|cancel/i,
    label: "Dibatalkan",
    icon: X,
    iconClass: "bg-[#FFEDED] text-[#FF5252]",
    badgeClass: "bg-[#FFD9D9] text-[#FF3333]",
  },
  {
    matcher: /info|informasi/i,
    label: "Info",
    icon: Info,
    iconClass: "bg-[#EEF3FF] text-[#5E81CC]",
    badgeClass: "bg-[#DDE7FF] text-[#5E81CC]",
  },
];

function resolveNotificationMeta(notification) {
  const text = `${notification.title} ${notification.message}`;
  const variant = badgeVariants.find((item) => item.matcher.test(text));
  return variant || badgeVariants[4];
}

function formatDateLabel(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimeLabel(timeValue) {
  if (!timeValue) return "-";
  return timeValue.substring(0, 5);
}

function sortNotificationsByDate(items) {
  return [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function getNearestAppointment(appointments) {
  const upcoming = appointments
    .filter((item) => item.appointment_date && item.start_time)
    .sort((a, b) => {
      const dateA = new Date(`${a.appointment_date}T${a.start_time}`);
      const dateB = new Date(`${b.appointment_date}T${b.start_time}`);
      return dateA - dateB;
    });
  return upcoming[0] || null;
}

export default function PatientNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData?.user) {
          setError("Session tidak ditemukan. Silakan login ulang.");
          return;
        }

        const currentUserId = authData.user.id;
        setUserId(currentUserId);

        const [notificationsRes, appointmentsRes] = await Promise.all([
          fetch(`/api/notifications?user_id=${currentUserId}`, { cache: "no-store" }),
          fetch(`/api/appointments?patient_id=${currentUserId}&status=Menunggu`, { cache: "no-store" }),
        ]);

        if (!notificationsRes.ok) {
          const body = await notificationsRes.json().catch(() => ({}));
          throw new Error(body.message || "Gagal memuat notifikasi.");
        }

        const notificationsBody = await notificationsRes.json();
        const rawNotifications = Array.isArray(notificationsBody.notifications)
          ? notificationsBody.notifications
          : [];

        const normalizedNotifications = sortNotificationsByDate(rawNotifications).map((item) => ({
          ...item,
          is_read: item.is_read === true,
        }));

        if (mounted) setNotifications(normalizedNotifications);

        if (!appointmentsRes.ok) {
          const body = await appointmentsRes.json().catch(() => ({}));
          throw new Error(body.message || "Gagal memuat appointment.");
        }

        const appointmentsBody = await appointmentsRes.json();
        const rawAppointments = Array.isArray(appointmentsBody.data)
          ? appointmentsBody.data
          : appointmentsBody.data
            ? [appointmentsBody.data]
            : [];

        if (mounted) setAppointments(rawAppointments);
      } catch (loadError) {
        console.error(loadError);
        if (mounted) setError(loadError.message || "Terjadi kesalahan saat memuat halaman.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const nearestAppointment = useMemo(() => getNearestAppointment(appointments), [appointments]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications]
  );

  const reminderCount = useMemo(() => {
    return notifications.filter((item) => /reminder|pengingat/i.test(`${item.title} ${item.message}`)).length;
  }, [notifications]);

  const updateCount = useMemo(
    () => notifications.filter((item) => /update|perubahan|jadwal/i.test(`${item.title} ${item.message}`)).length,
    [notifications]
  );

  const summaryCards = [
    {
      value: String(unreadCount),
      title: "Notifikasi baru",
      description: "belum dibaca",
      icon: CalendarDays,
      iconClass: "border border-blue-100 text-blue-600 bg-blue-50/50",
    },
    {
      value: String(reminderCount),
      title: "Reminder hari ini",
      description: "jangan sampai terlewat",
      icon: CheckCircle2,
      iconClass: "border border-green-100 text-green-600 bg-green-50/50",
    },
    {
      value: String(updateCount),
      title: "Update jadwal",
      description: "perubahan terbaru",
      icon: XCircle,
      iconClass: "border border-red-100 text-red-500 bg-red-50/50",
    },
  ];

  return (
    <section className="min-h-screen bg-[#F4F7F9] px-6 py-6 lg:px-8">
      {/* Header Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
        <p className="mt-1 text-sm font-medium text-gray-800">
          Lihat pengingat dan informasi terbaru terkait appointment Anda.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main Content Area */}
        <div className="space-y-5 min-w-0">

          {/* Summary Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100/50"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.iconClass}`}>
                    <Icon className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-gray-900 leading-none">
                      {card.value}
                    </span>
                    <span className="mt-1 text-xs font-bold text-gray-900">
                      {card.title}
                    </span>
                    <span className="text-[11px] font-medium text-gray-400">
                      {card.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notifications Container */}
          <div className="rounded-xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100/50">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-gray-900">Semua Notifikasi</h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className="h-16 animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600">
                {error}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-sm font-semibold text-gray-500">
                Tidak ada notifikasi lainnya
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((item) => {
                  const meta = resolveNotificationMeta(item);
                  const Icon = meta.icon;
                  const createdAt = formatDateLabel(item.created_at);
                  const timeLabel = formatTimeLabel(item.created_at) || "--";

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 py-4.5 first:pt-2 last:pb-2"
                    >
                      {/* Icon Container */}
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.iconClass}`}>
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </div>

                      {/* Content Wrapper */}
                      <div className="flex flex-1 flex-col sm:flex-row sm:items-start sm:justify-between gap-2 min-w-0">
                        <div className="space-y-0.5">
                          <h3 className="text-sm font-bold text-gray-900 leading-snug">
                            {item.title}
                          </h3>
                          <p className="text-xs font-medium text-gray-500 leading-relaxed">
                            {item.message}
                          </p>
                        </div>

                        {/* Date and Badge Meta */}
                        <div className="flex flex-row-reverse sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                          <span className="text-[11px] font-medium text-gray-400">
                            {createdAt} <span className="mx-1">•</span> {timeLabel}
                          </span>
                          <span className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold leading-5 ${meta.badgeClass}`}>
                            {meta.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Area */}
        <aside className="space-y-5 h-fit">

          {/* Nearest Reminder Card */}
          <div className="rounded-2xl bg-[#EEF2FF] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-blue-50/50 text-center">
            <h2 className="text-sm font-bold text-gray-900">Reminder Terdekat</h2>

            {/* Avatar Doctor */}
            <div className="mx-auto mt-5 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-sm">
              {nearestAppointment && nearestAppointment.doctor_img ? (
                <img src={nearestAppointment.doctor_img} alt={nearestAppointment.doctor_name} className="h-full w-full object-cover" />
              ) : nearestAppointment ? (
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(nearestAppointment.doctor_name || "Doctor")}&background=cbd5e1&color=fff&size=256`} alt="Doctor" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-2xl font-bold text-gray-300">-</div>
              )}
            </div>

            <h3 className="mt-4 text-base font-bold text-gray-900">
              {nearestAppointment ? `Dr. ${nearestAppointment.doctor_name}` : "Belum ada reminder"}
            </h3>

            {/* Info Items */}
            <div className="mt-5 space-y-4 text-left border-t border-gray-200/60 pt-4 max-w-[220px] mx-auto">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-gray-900" strokeWidth={2} />
                <p className="text-sm font-bold text-gray-900">
                  {nearestAppointment ? formatDateLabel(nearestAppointment.appointment_date) : "12 Mei 2030"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Clock3 className="h-5 w-5 text-gray-900" strokeWidth={2} />
                <p className="text-sm font-bold text-gray-900">
                  {nearestAppointment
                    ? `${formatTimeLabel(nearestAppointment.start_time)} - ${formatTimeLabel(nearestAppointment.end_time)} WIB`
                    : "10.00 - 10.30 WIB"
                  }
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 w-10">status</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E6FAD7] px-2.5 py-0.5 text-xs font-semibold text-[#14C914]">
                  <Check className="h-3 w-3" strokeWidth={3} />
                  {nearestAppointment?.status || "Dijadwalkan"}
                </span>
              </div>
            </div>

            {/* Button */}
            <button
              type="button"
              onClick={() => window.location.assign("/patient/appointments")}
              className="mt-6 w-full rounded-lg bg-[#5E81CC] py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#4D6FB5]"
            >
              Lihat Appointment
            </button>
          </div>

          {/* Need Help Card */}
          <div className="rounded-xl bg-[#FFF4E4] p-5 border border-amber-100/70">
            <div className="flex items-center gap-4 text-left">
              {/* Custom SVG/Emoji representation of the cute helper illustration */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-3.536 4.978 4.978 0 011.414-3.536m0 0l2.829 2.829m-2.829-2.829L3 3m7.071 7.071L12 12" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Butuh Bantuan?</h2>
                <p className="mt-0.5 text-xs font-medium text-gray-700 leading-snug">
                  Hubungi kami jika ada pertanyaan atau kendala
                </p>
              </div>
            </div>
            <button className="mt-4 w-full rounded-lg border border-amber-200 bg-white py-2.5 text-xs font-bold text-[#FF8A00] shadow-sm transition hover:bg-amber-50/50">
              Hubungi Support
            </button>
          </div>

        </aside>
      </div>
    </section>
  );
}