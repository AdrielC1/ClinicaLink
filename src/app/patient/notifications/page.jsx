"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, waitForSupabaseUser } from "@/lib/supabase";
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

export default function PatientNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const { data, error: authError } = await waitForSupabaseUser();
        if (authError || !data?.user) {
          setError("Session tidak ditemukan. Silakan login ulang.");
          return;
        }

        const currentUserId = data.user.id;
        setUserId(currentUserId);

        const notificationsRes = await fetch(`/api/notifications?user_id=${currentUserId}`, { cache: "no-store" });

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

const handleNotificationClick = async (item) => {
  if (item.is_read) return;
  try {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', item.id);
    if (!error) {
      // ✅ setNotifications murni — tidak ada side effect di dalam updater
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
      // ✅ dispatchEvent di luar updater, dihitung dari state saat ini
      const newUnread = notifications.filter((n) => !n.is_read && n.id !== item.id).length;
      window.dispatchEvent(new CustomEvent('notifications_updated', { detail: { unreadCount: newUnread } }));
    }
  } catch (err) {
    console.error(err);
  }
};

const handleMarkAllAsRead = async () => {
  if (unreadCount === 0) return;
  try {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    if (!error) {
      // ✅ setNotifications murni
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      // ✅ dispatchEvent di luar updater
      window.dispatchEvent(new CustomEvent('notifications_updated', { detail: { unreadCount: 0 } }));
    }
  } catch (err) {
    console.error(err);
  }
};

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
      title: "Pengingat hari ini",
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
    <>
      {/* Header Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Notifikasi</h1>
        <p className="text-gray-500 text-sm">
          Lihat pengingat dan informasi terbaru terkait appointment Anda.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Main Content Area */}
        <div className="space-y-5 min-w-0 w-full">

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
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Semua Notifikasi</h2>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-bold text-[#5E81CC] hover:text-[#4A6BB0] hover:underline transition-colors"
                >
                  Tandai semua sudah dibaca
                </button>
              )}
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
              <div className="flex flex-col gap-1">
                {notifications.map((item) => {
                  const meta = resolveNotificationMeta(item);
                  const Icon = meta.icon;
                  const createdAt = formatDateLabel(item.created_at);
                  const timeLabel = formatTimeLabel(item.created_at) || "--";

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-colors ${item.is_read ? 'bg-white hover:bg-gray-50' : 'bg-[#EEF3FF] hover:bg-[#E5EEFF]'} first:mt-2 last:mb-2`}
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


      </div>
    </>
  );
}