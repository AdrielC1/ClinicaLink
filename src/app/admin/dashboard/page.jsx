import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react";

const stats = [
  { label: "Total dokter", value: "4" },
  { label: "Total pasien", value: "3" },
  { label: "Total appointment", value: "4" },
  { label: "Appointment hari ini", value: "3" },
];

const todaySchedules = [
  {
    no: 1,
    patient: "Mila",
    doctor: "Dr. Emily",
    date: "12 Mei 2030",
    time: "09.00 WIB",
    status: "Selesai",
    statusClass: "bg-[#DDFBDA] text-[#05B705]",
  },
  {
    no: 2,
    patient: "Kimmy",
    doctor: "Dr. Emily",
    date: "12 Mei 2030",
    time: "10.00 WIB",
    status: "Berlangsung",
    statusClass: "bg-[#E1E9FF] text-[#5E81CC]",
  },
  {
    no: 3,
    patient: "Sila",
    doctor: "Dr. Emily",
    date: "12 Mei 2030",
    time: "11.00 WIB",
    status: "Menunggu",
    statusClass: "bg-[#FFF0CF] text-[#FFB83D]",
  },
];

const activities = [
  {
    text: "Dr. Riri ditambahkan sebagai dokter baru",
    icon: UserRound,
    color: "text-[#5E81CC]",
  },
  {
    text: "Appointment Mila telah selesai",
    icon: CalendarCheck,
    color: "text-[#05B705]",
  },
  {
    text: "Appointment Kimmy telah diubah",
    icon: CalendarCheck,
    color: "text-[#FFB83D]",
  },
];

export default function AdminDashboardPage() {
  return (
    <section className="min-h-full border border-[#D8EDF4] bg-[#F0FBFF] px-4 py-6 sm:px-6 lg:px-10 xl:px-[60px]">
      <div className="mx-auto w-full max-w-[980px]">
        <header className="mb-7">
          <h1 className="text-[24px] font-extrabold leading-tight text-black sm:text-[26px]">
            Halo, Admin
          </h1>
          <p className="mt-1 text-[15px] font-bold leading-snug text-[#646464] sm:text-[16px]">
            Berikut ringkasan data sistem ClinicaLink.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-11">
          {stats.map((item) => (
            <div
              key={item.label}
              className="flex min-h-[100px] flex-col items-center justify-center rounded-[6px] bg-[#F7FDFF] px-4 text-center shadow-[0_4px_10px_rgba(15,23,42,0.14)]"
            >
              <p className="text-[12px] font-extrabold leading-tight text-black">{item.label}</p>
              <p className="mt-4 text-[20px] font-extrabold leading-none text-black">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-[10px] bg-white">
          <div className="px-5 py-5">
            <h2 className="text-[17px] font-extrabold leading-none text-black">Jadwal hari ini</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="bg-[#EEF3FB] text-[12px] font-extrabold text-black">
                  <th className="w-[70px] px-6 py-3 text-center">No</th>
                  <th className="px-4 py-3">Pasien</th>
                  <th className="px-4 py-3">Dokter</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {todaySchedules.map((schedule) => (
                  <tr
                    key={schedule.no}
                    className="border-b border-[#E4E4E4] text-[12px] font-extrabold text-black last:border-b"
                  >
                    <td className="px-6 py-3 text-center">{schedule.no}</td>
                    <td className="px-4 py-3">{schedule.patient}</td>
                    <td className="px-4 py-3">{schedule.doctor}</td>
                    <td className="px-4 py-3">{schedule.date}</td>
                    <td className="px-4 py-3">{schedule.time}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-[6px] px-4 py-1 text-[12px] font-extrabold leading-none ${schedule.statusClass}`}>
                        {schedule.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3">
                        <button className="rounded-[6px] bg-[#F3F4F6] p-1.5 text-black transition-colors hover:bg-[#E5E7EB]" aria-label="Lihat appointment">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="rounded-[6px] bg-[#F3F4F6] p-1.5 text-[#5E81CC] transition-colors hover:bg-[#E5E7EB]" aria-label="Edit appointment">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button className="rounded-[6px] bg-[#F3F4F6] p-1.5 text-[#FF5252] transition-colors hover:bg-[#E5E7EB]" aria-label="Hapus appointment">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-center gap-7 py-8">
            <button className="text-[#8A8A8A]" aria-label="Halaman sebelumnya">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-[#7EA1EF] text-[12px] font-extrabold leading-none text-white">
              1
            </button>
            <button className="text-[12px] font-extrabold text-black">2</button>
            <button className="text-[12px] font-extrabold text-black">3</button>
            <button className="text-[#8A8A8A]" aria-label="Halaman berikutnya">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <section className="mt-7 max-w-[560px] rounded-[8px] bg-white px-5 py-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-[17px] font-extrabold text-black">Aktifitas terbaru</h2>
            <button className="text-[12px] font-extrabold text-[#5E81CC] hover:underline">
              Lihat semua
            </button>
          </div>

          <div className="px-1">
            {activities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div
                  key={activity.text}
                  className="grid grid-cols-[42px_1fr] items-center border-b border-[#E4E4E4] py-3 last:border-b"
                >
                  <Icon className={`h-5 w-5 ${activity.color}`} strokeWidth={2.2} />
                  <p className="text-[12px] font-extrabold leading-snug text-black">{activity.text}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}
