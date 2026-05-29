"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import detailIcon from "@/app/icons/detail.svg";
import editIcon from "@/app/icons/edit.svg";
import softDeleteIcon from "@/app/icons/softDelete.svg";

const statusStyles = {
  Selesai: "bg-green-100 text-green-600",
  Berlangsung: "bg-blue-100 text-blue-600",
  Menunggu: "bg-orange-100 text-orange-500",
  Dibatalkan: "bg-red-100 text-red-600",
};

const formatDateId = (value) => {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "Long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatTimeLabel = (value) => {
  if (!value) return "-";
  return value.substring(0, 5).replace(":", ".") + " WIB";
};

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
    <div className="min-h-screen bg-[#F4FAFF] p-8 text-slate-900 font-sans">
      {/* Header Info */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Halo, Admin</h1>
        <p className="text-sm text-slate-500 mt-1">Berikut ringkasan data sistem ClinicalLink.</p>
      </div>

      {/* 4 Statistik Utama Berjejer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total dokter", value: doctors.length },
          { label: "Total pasien", value: patients.length },
          { label: "Total appointment", value: appointments.length },
          { label: "Appointment hari ini", value: todayAppointments.length },
        ].map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center h-32">
            <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider">{card.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-3">{loading ? "..." : card.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Layout: Vertikal Stack */}
      <div className="flex flex-col gap-8">
        
        {/* Section Tabel Jadwal Hari Ini */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="mb-4">
            <h2 className="text-md font-bold text-slate-900">Jadwal hari ini</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Memuat data...</div>
          ) : todayAppointments.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">Tidak ada jadwal untuk hari ini.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    <th className="pb-3 pt-2 pl-4 text-center w-12">No</th>
                    <th className="pb-3 pt-2 px-4">Pasien</th>
                    <th className="pb-3 pt-2 px-4">Dokter</th>
                    <th className="pb-3 pt-2 px-4">Tanggal</th>
                    <th className="pb-3 pt-2 px-4">Waktu</th>
                    <th className="pb-3 pt-2 px-4 text-center">Status</th>
                    <th className="pb-3 pt-2 pr-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {todayAppointments.map((appointment, index) => (
                    <tr key={appointment.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 pl-4 text-center text-slate-700 font-medium">{index + 1}</td>
                      <td className="py-4 px-4 text-slate-900 font-medium">{appointment.patient_name}</td>
                      <td className="py-4 px-4 text-slate-700">{appointment.doctor_name}</td>
                      <td className="py-4 px-4 text-slate-700 font-semibold">{formatDateId(appointment.appointment_date)}</td>
                      <td className="py-4 px-4 text-slate-700 font-semibold">{formatTimeLabel(appointment.start_time)}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-md ${statusStyles[appointment.status] ?? "bg-slate-100 text-slate-600"}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button type="button" onClick={() => openDetail(appointment)} className="opacity-80 hover:opacity-100 transition-opacity" title="Lihat Detail">
                            <Image src={detailIcon} alt="View" width={18} height={18} />
                          </button>
                          <button type="button" onClick={() => openEdit(appointment)} className="opacity-80 hover:opacity-100 transition-opacity" title="Ubah Jadwal">
                            <Image src={editIcon} alt="Edit" width={18} height={18} />
                          </button>
                          <button type="button" onClick={() => handleDelete(appointment.id)} className="opacity-80 hover:opacity-100 transition-opacity" title="Hapus">
                            <Image src={softDeleteIcon} alt="Delete" width={18} height={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Tampilan Pagination Sesuai Mockup */}
              <div className="flex items-center justify-center gap-4 mt-6 text-xs font-semibold text-slate-600">
                <button type="button" className="text-slate-400 hover:text-slate-700">&lt;</button>
                <button type="button" className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-500 text-white">1</button>
                <button type="button" className="hover:text-blue-500">2</button>
                <button type="button" className="hover:text-blue-500">3</button>
                <button type="button" className="text-slate-400 hover:text-slate-700">&gt;</button>
              </div>
            </div>
          )}
        </section>

        {/* Section Aktivitas Terbaru Di Bawah */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Aktifitas terbaru</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">Belum ada riwayat aktivitas.</p>
            ) : (
              recentActivities.map((item, index) => (
                <div key={index} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0">
                    {item.type === "success" && (
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
              )}
              {item.type === "cancel" && (
                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
              )}
            {item.type === "edit" && (
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
          )}
            </div>
              <p className="text-xs font-semibold text-slate-800">{item.title}</p>
            </div>

              ))
            )}
          </div>
        </section>
      </div>

      {/* Modals Detail & Edit Tetap Dipertahankan Sesuai Kebutuhan Fungsi */}
      {isDetailOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">Detail Appointment</h3>
            <div className="space-y-2 text-xs text-slate-700">
              <p><span className="font-semibold text-slate-900">Pasien:</span> {selectedAppointment.patient_name}</p>
              <p><span className="font-semibold text-slate-900">Dokter:</span> {selectedAppointment.doctor_name}</p>
              <p><span className="font-semibold text-slate-900">Tanggal:</span> {formatDateId(selectedAppointment.appointment_date)}</p>
              <p><span className="font-semibold text-slate-900">Waktu:</span> {formatTimeLabel(selectedAppointment.start_time)}</p>
              <p><span className="font-semibold text-slate-900">Status:</span> {selectedAppointment.status}</p>
            </div>
            <button type="button" onClick={closeModals} className="mt-6 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors">
              Tutup
            </button>
          </div>
        </div>
      )}

      {isEditOpen && editAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form onSubmit={handleEditSubmit} className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Ubah Jadwal</h3>
            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="block font-semibold mb-1 text-slate-700">Tanggal</span>
                <input type="date" value={editAppointment.appointment_date} onChange={(e) => setEditAppointment({ ...editAppointment, appointment_date: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2" required />
              </label>
              <label className="block">
                <span className="block font-semibold mb-1 text-slate-700">Jam Mulai</span>
                <input type="time" value={editAppointment.start_time} onChange={(e) => setEditAppointment({ ...editAppointment, start_time: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2" required />
              </label>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={closeModals} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700">Batal</button>
              <button type="submit" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-xs font-semibold text-white">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-xs shadow-md">
          {error}
        </div>
      )}
    </div>
  );
}