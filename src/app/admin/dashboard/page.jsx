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
    statusClass: "bg-green-100 text-green-600",
  },
  {
    no: 2,
    patient: "Kimmy",
    doctor: "Dr. Emily",
    date: "12 Mei 2030",
    time: "10.00 WIB",
    status: "Berlangsung",
    statusClass: "bg-blue-100 text-blue-600",
  },
  {
    no: 3,
    patient: "Sila",
    doctor: "Dr. Emily",
    date: "12 Mei 2030",
    time: "11.00 WIB",
    status: "Menunggu",
    statusClass: "bg-yellow-100 text-yellow-600",
  },
];

const activities = [
  {
    text: "Dr. Riri ditambahkan sebagai dokter baru",
    icon: UserRound,
    color: "text-blue-500",
  },
  {
    text: "Appointment Mila telah selesai",
    icon: CalendarCheck,
    color: "text-green-500",
  },
  {
    text: "Appointment Kimmy telah diubah",
    icon: CalendarCheck,
    color: "text-yellow-500",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="font-sans text-slate-800 pb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Halo, Admin</h1>
        <p className="text-gray-500 text-sm">Berikut ringkasan data sistem ClinicaLink.</p>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        {stats.map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 w-40 flex-grow sm:flex-grow-0 flex flex-col items-center justify-center"
          >
            <span className="text-xs font-semibold text-gray-600 mb-2 text-center">{item.label}</span>
            <span className="text-2xl font-bold text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden pb-4 mb-6">
        <div className="p-6 pb-4">
          <h2 className="text-lg font-bold text-gray-900">Jadwal hari ini</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-y border-slate-200">
              <tr>
                <th className="px-6 py-4 text-center w-12">No</th>
                <th className="px-6 py-4">Pasien</th>
                <th className="px-6 py-4">Dokter</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {todaySchedules.map((schedule) => (
                <tr
                  key={schedule.no}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-center font-medium text-gray-500">{schedule.no}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{schedule.patient}</td>
                  <td className="px-6 py-4 text-gray-700">{schedule.doctor}</td>
                  <td className="px-6 py-4 text-gray-600">{schedule.date}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono">{schedule.time}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold ${schedule.statusClass}`}>
                      {schedule.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Lihat">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 mb-2">
          <button className="p-1.5 text-gray-400 hover:text-[#5E81CC] transition-colors" title="Halaman sebelumnya">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full font-semibold text-sm transition-colors bg-[#5E81CC] text-white">
            1
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full font-semibold text-sm transition-colors text-gray-600 hover:bg-gray-100">
            2
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full font-semibold text-sm transition-colors text-gray-600 hover:bg-gray-100">
            3
          </button>
          <button className="p-1.5 text-gray-400 hover:text-[#5E81CC] transition-colors" title="Halaman berikutnya">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Aktifitas terbaru</h2>
          <button className="text-sm font-semibold text-[#5E81CC] hover:text-[#4A6BB0] transition-colors hover:underline">
            Lihat semua
          </button>
        </div>

        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.text}
                className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
              >
                <div className={`p-2.5 rounded-xl bg-gray-50 ${activity.color}`}>
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <p className="text-sm font-medium text-gray-700">{activity.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
