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
  { label: "Total janji temu", value: "4" },
  { label: "Janji temu hari ini", value: "3" },
];

const todaySchedules = [
  {
    no: 1,
    patient: "Mila",
    doctor: "Dr. Emily",
    date: "12 Mei 2030",
    time: "09.00 WIB",
    status: "Selesai",
    statusClass: "bg-green-100 text-green-600 border border-green-200",
  },
  {
    no: 2,
    patient: "Kimmy",
    doctor: "Dr. Emily",
    date: "12 Mei 2030",
    time: "10.00 WIB",
    status: "Berlangsung",
    statusClass: "bg-blue-100 text-blue-600 border border-blue-200",
  },
  {
    no: 3,
    patient: "Sila",
    doctor: "Dr. Emily",
    date: "12 Mei 2030",
    time: "11.00 WIB",
    status: "Menunggu",
    statusClass: "bg-yellow-100 text-yellow-600 border border-yellow-200",
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
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [editAppointment, setEditAppointment] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const [doctorRes, patientRes, appointmentRes, todayRes] = await Promise.all([
        fetch("/api/doctors", { cache: "no-store" }),
        fetch("/api/patient", { cache: "no-store" }),
        fetch("/api/appointments", { cache: "no-store" }),
        fetch("/api/appointments?today=true", { cache: "no-store" }),
      ]);

      const [doctorJson, patientJson, appointmentJson, todayJson] = await Promise.all([
        doctorRes.json(),
        patientRes.json(),
        appointmentRes.json(),
        todayRes.json(),
      ]);

      if (!doctorRes.ok || !patientRes.ok || !appointmentRes.ok || !todayRes.ok) {
        throw new Error("Gagal memuat data sistem.");
      }

      setDoctors(Array.isArray(doctorJson.data) ? doctorJson.data : []);
      setPatients(Array.isArray(patientJson.data) ? patientJson.data : []);
      setAppointments(Array.isArray(appointmentJson.data) ? appointmentJson.data : []);
      setTodayAppointments(Array.isArray(todayJson.data) ? todayJson.data : []);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Terjadi kesalahan saat memuat dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const recentActivities = useMemo(() => {
    return appointments.slice(0, 3).map((item) => {
      const patientName = item.patient_name || "Pasien";
      if (item.status === "Dibatalkan") {
        return {
          title: `Appointment ${patientName} telah dibatalkan`,
          type: "cancel",
        };
      }
      if (item.status === "Selesai") {
        return {
          title: `Appointment ${patientName} telah selesai`,
          type: "success",
        };
      }
      return {
        title: `Appointment ${patientName} telah diubah`,
        type: "edit",
      };
    });
  }, [appointments]);

  const openDetail = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailOpen(true);
  };

  const openEdit = (appointment) => {
    setEditAppointment({
      id: appointment.id,
      appointment_date: appointment.appointment_date || "",
      start_time: appointment.start_time || "",
      end_time: appointment.end_time || "",
      patient_name: appointment.patient_name,
      doctor_name: appointment.doctor_name,
    });
    setIsEditOpen(true);
  };

  const closeModals = () => {
    setIsDetailOpen(false);
    setSelectedAppointment(null);
    setIsEditOpen(false);
    setEditAppointment(null);
  };

  const handleDelete = async (appointmentId) => {
    const confirmed = window.confirm("Yakin ingin menghapus/membatalkan appointment ini?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/appointments?id=${appointmentId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus appointment.");
      loadDashboardData();
    } catch (err) {
      window.alert(err?.message || "Terjadi kesalahan.");
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editAppointment) return;

    try {
      const res = await fetch(`/api/appointments?id=${editAppointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_date: editAppointment.appointment_date,
          start_time: editAppointment.start_time,
          end_time: editAppointment.end_time,
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan perubahan.");
      closeModals();
      loadDashboardData();
    } catch (err) {
      window.alert(err?.message || "Terjadi kesalahan.");
    }
  };

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
            <span className="text-sm font-bold text-gray-600 mb-2 text-center">{item.label}</span>
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
            <thead className="bg-[#F3F6FB] text-gray-700 font-semibold text-xs border-y border-gray-100">
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
                  <td className="px-6 py-4 font-bold text-gray-900">{schedule.patient}</td>
                  <td className="px-6 py-4 font-semibold text-gray-700">{schedule.doctor}</td>
                  <td className="px-6 py-4 text-gray-600">{schedule.date}</td>
                  <td className="px-6 py-4 text-[#5E81CC] font-bold">{schedule.time}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-bold ${schedule.statusClass}`}>
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