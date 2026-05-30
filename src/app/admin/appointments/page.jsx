"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Edit3, Eye, X } from "lucide-react";

function computeVirtualStatus(appt) {
  if (appt.status === "Sedang Berlangsung") {
    return "Berlangsung";
  }
  return appt.status;
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  // Forms
  const [editForm, setEditForm] = useState({
    id: "",
    patient_name: "",
    doctor_name: "",
    appointment_date: "",
    waktu: "",
    status: "",
    notes: "",
  });

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [appRes, patRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/patient"),
      ]);

      const appData = await appRes.json();
      const patData = await patRes.json();

      if (appRes.ok) {
        const apps = Array.isArray(appData.data) ? appData.data : [appData.data];
        const enrichedApps = apps.map(app => ({
          ...app,
          status: computeVirtualStatus(app)
        }));
        setAppointments(enrichedApps);
      }
      if (patRes.ok) setPatients(patData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setShowStatusDropdown(false);
  };

  const filteredAppointments = appointments.filter((app) => {
    const matchesSearch =
      app.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "Semua" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "selesai":
        return "bg-green-100 text-green-600 border-green-200";
      case "berlangsung":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "menunggu":
        return "bg-yellow-100 text-yellow-600 border-yellow-200";
      case "dijadwalkan":
        return "bg-pink-100 text-pink-600 border-pink-200";
      case "dibatalkan":
        return "bg-red-100 text-red-500 border-red-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const formatDateId = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString.substring(0, 5); // 08:00:00 -> 08:00
  };

  const openEditModal = (app) => {
    let waktu = app.schedule_time || "-";
    if (app.start_time && app.end_time) {
      waktu = `${formatTime(app.start_time)} - ${formatTime(app.end_time)} WIB`;
    } else if (waktu !== "-" && waktu.includes("-")) {
      const parts = waktu.split("-").map(p => formatTime(p.trim()));
      waktu = `${parts[0]} - ${parts[1]} WIB`;
    }
    
    setEditForm({
      id: app.id,
      patient_name: app.patient_name,
      doctor_name: app.doctor_name,
      appointment_date: app.appointment_date,
      waktu,
      status: app.status || "Menunggu",
      notes: app.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/appointments?id=${editForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_date: editForm.appointment_date,
          status: editForm.status,
          notes: editForm.notes,
        }),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchInitialData();
      } else {
        const err = await res.json();
        alert("Gagal memperbarui: " + err.message);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan.");
    }
  };

  const openDetailModal = (app) => {
    const patientInfo = patients.find((p) => p.id === app.patient_id);
    let timeDisplay = app.schedule_time || "-";
    if (app.start_time && app.end_time) {
      timeDisplay = `${formatTime(app.start_time)} - ${formatTime(app.end_time)} WIB`;
    } else if (timeDisplay !== "-" && timeDisplay.includes("-")) {
      const parts = timeDisplay.split("-").map(p => formatTime(p.trim()));
      timeDisplay = `${parts[0]} - ${parts[1]} WIB`;
    }

    setSelectedDetail({
      ...app,
      patient_phone: patientInfo?.phone_number || "Tidak ada nomor kontak",
      formatted_time: timeDisplay,
    });
    setIsDetailModalOpen(true);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((app) => app.appointment_date === todayStr);

  return (
    <div className="font-sans text-slate-800 pb-6">
      {/* Header Area */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Kelola Janji Temu</h1>
        <p className="text-gray-500 text-sm">Kelola data janji temu yang terdaftar di sistem</p>
      </div>

      {/* Summary Cards */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 w-40 flex-grow sm:flex-grow-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-gray-600 mb-2 text-center">Total janji temu</span>
          <span className="text-2xl font-bold text-gray-900">{appointments.length}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 w-40 flex-grow sm:flex-grow-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-gray-600 mb-2 text-center">Hari ini</span>
          <span className="text-2xl font-bold text-gray-900">{todayAppointments.length}</span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari janji temu..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[#5E81CC] focus:border-transparent transition-all shadow-sm"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#5E81CC] font-semibold rounded-lg text-sm shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filter {statusFilter !== "Semua" && <span className="text-xs ml-1 bg-[#5E81CC] text-white px-1.5 py-0.5 rounded-full">{statusFilter}</span>}
          </button>
          
          {showStatusDropdown && (
            <div className="absolute top-12 left-0 bg-white border border-gray-100 rounded-xl shadow-lg z-20 w-48 p-1">
              {["Semua", "Dijadwalkan", "Menunggu", "Berlangsung", "Selesai", "Dibatalkan"].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusFilter(status)}
                  className={`block w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors rounded-lg ${statusFilter === status ? "bg-[#E6EDFF] text-[#5E81CC]" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden pb-4 mb-6">
        <div className="p-6 pb-4">
          <h2 className="text-lg font-bold text-gray-900">Daftar Janji Temu</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F3F6FB] text-gray-700 font-semibold text-xs border-y border-gray-100">
              <tr>
                <th className="px-6 py-4 text-center w-12">No</th>
                <th className="px-6 py-4">Pasien</th>
                <th className="px-6 py-4">Dokter</th>
                <th className="px-6 py-4 text-center">Tanggal</th>
                <th className="px-6 py-4 text-center">Waktu</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    Tidak ada data janji temu ditemukan.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app, index) => {
                  let timeDisplay = app.schedule_time || "-";
                  if (app.start_time && app.end_time) {
                    timeDisplay = `${formatTime(app.start_time)} - ${formatTime(app.end_time)} WIB`;
                  } else if (timeDisplay !== "-" && timeDisplay.includes("-")) {
                    const parts = timeDisplay.split("-").map(p => formatTime(p.trim()));
                    timeDisplay = `${parts[0]} - ${parts[1]} WIB`;
                  }

                  return (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-center font-medium text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">{app.patient_name}</td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{app.doctor_name}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{formatDateId(app.appointment_date)}</td>
                      <td className="px-6 py-4 text-center text-[#5E81CC] font-bold">{timeDisplay}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-bold border ${getStatusBadge(app.status)}`}>
                          {app.status || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(app)}
                            className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDetailModal(app)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Appointment Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Edit Appointment</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pasien</label>
                <input
                  type="text"
                  disabled
                  value={editForm.patient_name}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Dokter</label>
                <input
                  type="text"
                  disabled
                  value={editForm.doctor_name}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Appointment</label>
                <input
                  type="date"
                  required
                  value={editForm.appointment_date}
                  onChange={(e) => setEditForm({ ...editForm, appointment_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Waktu</label>
                <input
                  type="text"
                  disabled
                  value={editForm.waktu}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Dijadwalkan">Dijadwalkan</option>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Berlangsung">Berlangsung</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keluhan</label>
                <input
                  type="text"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2 border border-blue-500 text-blue-500 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#5e81d4] text-white rounded-lg text-sm font-medium hover:bg-[#4b69b3] transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Appointment Modal */}
      {isDetailModalOpen && selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Detail Pasien</h2>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                <span className="text-sm font-medium text-slate-700">Nama Pasien</span>
                <span className="text-sm font-semibold text-slate-900">{selectedDetail.patient_name}</span>
              </div>
              <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                <span className="text-sm font-medium text-slate-700">Nama Dokter</span>
                <span className="text-sm font-semibold text-slate-900">{selectedDetail.doctor_name}</span>
              </div>
              <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                <span className="text-sm font-medium text-slate-700">Tanggal</span>
                <span className="text-sm font-semibold text-slate-900">
                  {formatDateId(selectedDetail.appointment_date)}
                </span>
              </div>
              <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                <span className="text-sm font-medium text-slate-700">Jam</span>
                <span className="text-sm font-semibold text-slate-900">{selectedDetail.formatted_time}</span>
              </div>
              <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                <span className="text-sm font-medium text-slate-700">Status</span>
                <span className={`text-sm font-semibold text-slate-900 ${
                  selectedDetail.status?.toLowerCase() === "selesai" ? "text-green-700" : 
                  selectedDetail.status?.toLowerCase() === "dijadwalkan" ? "text-pink-700" : ""
                }`}>
                  {selectedDetail.status || "-"}
                </span>
              </div>
              <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                <span className="text-sm font-medium text-slate-700">Keluhan</span>
                <span className="text-sm font-semibold text-slate-900">{selectedDetail.notes || "-"}</span>
              </div>
              <div className="grid grid-cols-[140px_1fr] items-start gap-4 pb-4 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-700">Kontak pasien</span>
                <span className="text-sm font-semibold text-slate-900">{selectedDetail.patient_phone}</span>
              </div>
              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-8 py-2 bg-[#5e81d4] text-white rounded-lg text-sm font-medium hover:bg-[#4b69b3] transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}