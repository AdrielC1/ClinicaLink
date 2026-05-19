"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import doctorIcon from "@/app/icons/Doctor.svg";
import calendarGreenIcon from "@/app/icons/Kalender hijau.svg";
import calendarYellowIcon from "@/app/icons/Kalender kuning.svg";
import reminderCalendarIcon from "@/app/icons/Kalender reminder.svg";

const dummyUsers = [
  { id: "usr-doctor-001", full_name: "Dr. Emily", role: "doctor" },
  { id: "usr-doctor-002", full_name: "Dr. Emily", role: "doctor" },
  { id: "usr-doctor-003", full_name: "Dr. Emily", role: "doctor" },
  { id: "usr-doctor-004", full_name: "Dr. Emily", role: "doctor" },
  { id: "usr-doctor-005", full_name: "Dr. Mike", role: "doctor" },
  { id: "usr-doctor-006", full_name: "Dr. Jatmiko", role: "doctor" },
];

const dummySpecializations = [
  { id: 1, name: "Spesialis Gigi" },
  { id: 2, name: "Spesialis Umum" },
  { id: 3, name: "Spesialis Penyakit Dalam" },
];

const dummyDoctors = [
  { id: "usr-doctor-001", specialization_id: 1, is_active: true },
  { id: "usr-doctor-002", specialization_id: 1, is_active: true },
  { id: "usr-doctor-003", specialization_id: 1, is_active: true },
  { id: "usr-doctor-004", specialization_id: 1, is_active: true },
  { id: "usr-doctor-005", specialization_id: 2, is_active: true },
  { id: "usr-doctor-006", specialization_id: 3, is_active: true },
];

const dummyDoctorSchedules = [
  { doctor_id: "usr-doctor-001", day_of_week: 2, start_time: "09.00", end_time: "12.00" },
  { doctor_id: "usr-doctor-002", day_of_week: 2, start_time: "10.00", end_time: "13.00" },
  { doctor_id: "usr-doctor-003", day_of_week: 2, start_time: "13.00", end_time: "16.00" },
  { doctor_id: "usr-doctor-004", day_of_week: 2, start_time: "16.00", end_time: "19.00" },
];

const availableDoctors = dummyDoctors
  .filter((doctor) => doctor.is_active)
  .slice(0, 4)
  .map((doctor) => {
    const user = dummyUsers.find((item) => item.id === doctor.id);
    const specialization = dummySpecializations.find(
      (item) => item.id === doctor.specialization_id,
    );
    const schedule = dummyDoctorSchedules.find((item) => item.doctor_id === doctor.id);

    return {
      id: doctor.id,
      name: user?.full_name ?? "Dr. Emily",
      specialty: specialization?.name ?? "Spesialis Gigi",
      schedule: schedule ? `${schedule.start_time} - ${schedule.end_time}` : "09.00 - 12.00",
    };
  });

const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

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

function getJakartaDateParts() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function buildCalendarDays(year, month) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const previousMonthDays = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
  const mondayBasedStart = (firstDay.getUTCDay() + 6) % 7;
  const days = [];

  for (let index = mondayBasedStart - 1; index >= 0; index -= 1) {
    days.push({ day: previousMonthDays - index, muted: true });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    days.push({ day, muted: false });
  }

  const nextMonthFill = (7 - (days.length % 7)) % 7;
  for (let day = 1; day <= nextMonthFill; day += 1) {
    days.push({ day, muted: true });
  }

  return days;
}

function CalendarLineIcon({ tone }) {
  const color = tone === "green" ? "#45C57B" : "#F2B900";

  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      viewBox="0 0 24 24"
      stroke={color}
      strokeWidth="2.1"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 3v4m10-4v4M5 9h14M7 5h10a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm3 9 2 2 4-5"
      />
    </svg>
  );
}

function BellLineIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      viewBox="0 0 24 24"
      stroke="#FF4B1A"
      strokeWidth="2.1"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0"
      />
    </svg>
  );
}

function StatIcon({ background, backgroundClass = "", children }) {
  return (
    <div className="relative flex h-[47px] w-[54px] shrink-0 items-center justify-center">
      {background ? (
        <Image src={background} alt="" fill sizes="54px" className="object-contain" />
      ) : (
        <span className={`absolute inset-0 rounded-[15px] ${backgroundClass}`} />
      )}
      <span className="relative z-10">{children}</span>
    </div>
  );
}

function DoctorAvatar({ size = "large" }) {
  const dimensions = size === "small" ? "h-11 w-11" : "h-14 w-14";
  const imageSize = size === "small" ? 32 : 42;

  return (
    <div
      className={`flex ${dimensions} shrink-0 items-end justify-center overflow-hidden rounded-full bg-[#d8d1c7] ring-4 ring-white`}
    >
      <Image src={doctorIcon} alt="" width={imageSize} height={imageSize} />
    </div>
  );
}

export default function PatientDashboardPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const patientName = getPatientName(currentUser);
  const today = useMemo(() => getJakartaDateParts(), []);
  const calendarDays = useMemo(() => buildCalendarDays(today.year, today.month), [today]);
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      }).format(new Date(Date.UTC(today.year, today.month - 1, today.day))),
    [today],
  );
  const appointmentDate = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      }).format(new Date(Date.UTC(today.year, today.month - 1, today.day))),
    [today],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => setCurrentUser(readStoredUser()));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="min-h-[770px] border border-[#d8eef4] bg-[#f4fcff] px-5 py-5">
      <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0">
          <h1 className="text-[23px] font-extrabold tracking-[-0.01em]">Daftar Dokter</h1>

          <section className="mt-[14px] rounded-[8px] bg-gradient-to-br from-[#d6e6ff] via-[#abc4fa] to-[#7fa2f2] px-7 py-[26px] shadow-[0_3px_8px_rgba(94,129,201,0.28)]">
            <h2 className="text-[28px] font-extrabold leading-tight tracking-[-0.01em]">
              Selamat Pagi, {patientName}
            </h2>
            <p className="mt-2 text-[15px] font-bold">
              Kelola janji temu klinik anda dengan mudah hari ini
            </p>
            <button
              type="button"
              className="mt-7 h-[27px] rounded-[5px] bg-[#5e81cc] px-5 text-[11px] font-extrabold text-white"
            >
              Booking Sekarang
            </button>
          </section>

          <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-8">
            {[
              {
                label: "Janji Temu mendatang",
                value: "2",
                icon: <CalendarLineIcon tone="yellow" />,
                background: calendarYellowIcon,
              },
              {
                label: "Janji Temu Selesai",
                value: "12",
                icon: <CalendarLineIcon tone="green" />,
                background: calendarGreenIcon,
              },
              {
                label: "Pengingat Hari ini",
                value: "1",
                icon: <BellLineIcon />,
                background: null,
                backgroundClass: "bg-[#ffe2e2]",
              },
            ].map((item) => (
              <article
                key={item.label}
                className="grid min-h-[130px] grid-cols-[54px_minmax(0,1fr)] items-start gap-4 rounded-[8px] border border-[#dedede] bg-white px-4 py-5 shadow-sm"
              >
                <StatIcon background={item.background} backgroundClass={item.backgroundClass}>
                  {item.icon}
                </StatIcon>
                <div className="min-w-0 pt-1">
                  <p className="text-[12px] font-extrabold leading-[15px]">{item.label}</p>
                  <p className="mt-[20px] text-center text-[25px] font-extrabold leading-none">
                    {item.value}
                  </p>
                </div>
              </article>
            ))}
          </section>

          <section className="mt-[10px] rounded-[8px] bg-white px-5 py-4 shadow-sm">
            <h2 className="text-[16px] font-extrabold">Janji Temu Mendatang</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-[170px_minmax(130px,1fr)_190px] md:items-center">
              <div className="flex min-w-0 items-center gap-4">
                <DoctorAvatar />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-extrabold">Dr. Mike</p>
                  <p className="mt-1 text-[10px] font-semibold leading-4 text-[#6b7280]">
                    Spesialis Umum
                  </p>
                </div>
              </div>

              <div className="border-[#edf0f2] text-[11px] font-extrabold md:border-l md:pl-7">
                <p className="whitespace-nowrap">{appointmentDate}</p>
                <p className="mt-3 whitespace-nowrap">10.00 - 10.30</p>
              </div>

              <div className="flex min-w-0 flex-col gap-4 md:items-end">
                <span className="inline-flex h-[23px] w-[122px] items-center justify-center rounded-full bg-[#bff4c3] text-[9px] font-extrabold text-[#16922d]">
                  Dijadwalkan
                </span>
                <div className="flex w-full flex-wrap gap-3 md:justify-end">
                  <button
                    type="button"
                    className="h-[24px] min-w-[88px] rounded-full bg-[#5e81cc] px-4 text-[10px] font-extrabold text-white"
                  >
                    Lihat Detail
                  </button>
                  <button
                    type="button"
                    className="h-[24px] min-w-[88px] rounded-full border border-[#ff3f3f] px-4 text-[10px] font-extrabold text-[#ff3f3f]"
                  >
                    Batalkan
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-[15px] rounded-[8px] border border-[#dedede] bg-white px-4 py-4 shadow-sm">
            <h2 className="text-[17px] font-extrabold">Dokter Tersedia</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {availableDoctors.map((doctor) => (
                <article
                  key={doctor.id}
                  className="min-h-[132px] rounded-[8px] border border-[#dedede] bg-white px-3 py-5"
                >
                  <div className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3">
                    <DoctorAvatar size="small" />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-extrabold">{doctor.name}</p>
                      <p className="mt-1 text-[10px] font-bold leading-4 text-[#6b7280]">
                        {doctor.specialty}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-center">
                    <span className="rounded-full bg-[#bdf6c3] px-3 py-[2px] text-[9px] font-extrabold text-[#24a942]">
                      Tersedia
                    </span>
                  </div>
                  <div className="mt-3 flex justify-center">
                    <button
                      type="button"
                      className="h-[22px] min-w-[73px] rounded-[4px] bg-[#5e81cc] px-4 text-[9px] font-extrabold text-white"
                      title={doctor.schedule}
                    >
                      Booking
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>

        <aside className="space-y-[13px] xl:pt-[39px]">
          <section className="bg-white px-6 py-7 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <button type="button" aria-label="Bulan sebelumnya" className="shrink-0 p-1">
                <svg
                  aria-hidden="true"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" />
                </svg>
              </button>
              <p className="min-w-0 truncate text-[11px] font-extrabold capitalize">
                {monthLabel}
              </p>
              <button type="button" aria-label="Bulan berikutnya" className="shrink-0 p-1">
                <svg
                  aria-hidden="true"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="mt-7 grid grid-cols-7 gap-y-4 text-center text-[8px] font-extrabold">
              {weekdays.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-7 gap-y-4 text-center text-[9px] font-extrabold">
              {calendarDays.map((date, index) => {
                const isToday = !date.muted && date.day === today.day;

                return (
                  <span
                    key={`${date.day}-${index}`}
                    className={`mx-auto flex h-[22px] w-[22px] items-center justify-center rounded-full ${
                      isToday
                        ? "bg-[#dce6ff] text-[#5e81cc]"
                        : date.muted
                          ? "text-[#b9bec7]"
                          : "text-black"
                    }`}
                  >
                    {date.day}
                  </span>
                );
              })}
            </div>

            <div className="mt-6 border-t border-[#d8d8d8] pt-5">
              <h3 className="text-[12px] font-extrabold">Jadwal Hari ini</h3>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 text-[12px] font-extrabold">
                <p className="whitespace-nowrap">10.00 - 10.30</p>
                <p className="whitespace-nowrap">Dr. Jatmiko</p>
              </div>
              <button
                type="button"
                className="mt-5 inline-flex whitespace-nowrap text-[11px] font-extrabold text-[#5e81cc]"
              >
                Lihat Semua
              </button>
            </div>
          </section>

          <section className="bg-white px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center text-[#5e81cc]">
                  <svg
                    aria-hidden="true"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0"
                    />
                  </svg>
                </span>
                <h3 className="text-[12px] font-extrabold">Reminder</h3>
              </div>
              <span className="shrink-0 rounded-[4px] bg-[#ffe3e3] px-3 py-1 text-[10px] font-extrabold text-[#ff6262]">
                H-1
              </span>
            </div>
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_70px] items-end gap-4">
              <p className="text-[12px] font-semibold leading-[18px] text-[#344054]">
                Jangan lupa appointment dengan <span className="font-extrabold">DR. Jatmiko</span>{" "}
                besok pukul <span className="font-extrabold">10.00 WIB.</span>
              </p>
              <div className="flex justify-end">
                <Image src={reminderCalendarIcon} alt="" width={58} height={58} />
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
