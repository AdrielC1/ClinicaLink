"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Plus, Edit3, Eye, ChevronLeft, ChevronRight, X } from "lucide-react";

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Pagination (Frontend)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  // Forms
  const [addForm, setAddForm] = useState({
    patient_id: "",
    doctor_id: "",
    appointment_date: "",
    schedule_id: "",
    notes: "",
  });

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
      const [appRes, patRes, docRes, schRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/patient"),
        fetch("/api/doctors"),
        fetch("/api/doctorSchedules"),
      ]);

      const appData = await appRes.json();
      const patData = await patRes.json();
      const docData = await docRes.json();
      const schData = await schRes.json();

      if (appRes.ok) setAppointments(Array.isArray(appData.data) ? appData.data : [appData.data]);
      if (patRes.ok) setPatients(patData.data || []);
      if (docRes.ok) setDoctors(docData.data || []);
      if (schRes.ok) setAllSchedules(schData.data || []);
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
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setShowStatusDropdown(false);
    setCurrentPage(1);
  };

  const filteredAppointments = appointments.filter((app) => {
    const matchesSearch =
      app.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "Semua" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage) || 1;
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "selesai":
        return "bg-green-100 text-green-700";
      case "berlangsung":
        return "bg-blue-100 text-blue-700";
      case "menunggu":
        return "bg-yellow-100 text-yellow-700";
      case "dijadwalkan":
        return "bg-pink-100 text-pink-700";
      case "dibatalkan":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
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

  // derived schedules for add form based on doctor & date
  const availableSchedules = allSchedules.filter((s) => {
    if (!addForm.doctor_id || !addForm.appointment_date) return false;
    if (s.doctor_id !== addForm.doctor_id) return false;

    // Check day of week (JS: 0=Sun, 1=Mon... DB might be 1=Mon, 7=Sun or 0=Sun. Assuming 1=Mon..7=Sun ISO)
    const date = new Date(addForm.appointment_date);
    const day = date.getDay(); // 0-6
    const isoDay = day === 0 ? 7 : day;

    // For simplicity, just return all schedules for this doctor, or try to match isoDay.
    // Let's filter by day if it matches, or just return all if you want to allow flexibility.
    // I will try to match isoDay or standard day
    return s.day_of_week === isoDay || s.day_of_week === day;
  });


  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: addForm.patient_id,
          schedule_id: addForm.schedule_id,
          appointment_date: addForm.appointment_date,
          notes: addForm.notes,
        }),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setAddForm({ patient_id: "", doctor_id: "", appointment_date: "", schedule_id: "", notes: "" });
        fetchInitialData();
      } else {
        const err = await res.json();
        alert("Gagal menambahkan: " + err.message);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan.");
    }
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
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      {/* Header Area */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Kelola Appointment</h1>
        <p className="text-sm text-slate-500 mt-1">Kelola data appointment yang terdaftar di sistem</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center">
          <h3 className="text-sm font-medium text-slate-600 mb-2">Total appointment</h3>
          <p className="text-3xl font-bold text-slate-900">{appointments.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center">
          <h3 className="text-sm font-medium text-slate-600 mb-2">Appointment hari ini</h3>
          <p className="text-3xl font-bold text-slate-900">{todayAppointments.length}</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-visible">
        {/* Actions Row */}
        <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-slate-900">Daftar Appointment</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search appointment"
                value={searchQuery}
                onChange={handleSearch}
                className="w-full sm:w-64 pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors bg-white"
              >
                <Filter className="w-4 h-4 text-blue-500" />
                Filter
              </button>
              {showStatusDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10">
                  {["Semua", "Dijadwalkan", "Menunggu", "Berlangsung", "Selesai", "Dibatalkan"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusFilter(status)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${statusFilter === status ? "text-blue-600 font-medium bg-blue-50/50" : "text-slate-700"
                        }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#5e81d4] hover:bg-[#4b69b3] text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Appointment baru
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f4f7f8] border-y border-slate-100 text-sm font-semibold text-slate-700">
                <th className="py-3 px-6 text-center w-16">No</th>
                <th className="py-3 px-6">Pasien</th>
                <th className="py-3 px-6">Dokter</th>
                <th className="py-3 px-6 text-center">Tanggal</th>
                <th className="py-3 px-6 text-center">Waktu</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : paginatedAppointments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    Tidak ada data appointment ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedAppointments.map((app, index) => {
                  let timeDisplay = app.schedule_time || "-";
                  if (app.start_time && app.end_time) {
                    timeDisplay = `${formatTime(app.start_time)} - ${formatTime(app.end_time)} WIB`;
                  } else if (timeDisplay !== "-" && timeDisplay.includes("-")) {
                    const parts = timeDisplay.split("-").map(p => formatTime(p.trim()));
                    timeDisplay = `${parts[0]} - ${parts[1]} WIB`;
                  }

                  return (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 text-center font-medium text-slate-500">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="py-4 px-6 font-medium">{app.patient_name}</td>
                      <td className="py-4 px-6">{app.doctor_name}</td>
                      <td className="py-4 px-6 text-center font-medium">{formatDateId(app.appointment_date)}</td>
                      <td className="py-4 px-6 text-center">{timeDisplay}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(app.status)}`}>
                          {app.status || "Unknown"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(app)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDetailModal(app)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
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

        {/* Pagination */}
        {!loading && filteredAppointments.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-md text-sm font-medium flex items-center justify-center transition-colors ${currentPage === page
                    ? "bg-[#5e81d4] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                  }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Add Appointment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Tambah Appointment</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pasien</label>
                    <select
                      required
                      value={addForm.patient_id}
                      onChange={(e) => setAddForm({ ...addForm, patient_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Pilih Pasien</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Dokter</label>
                    <select
                      required
                      value={addForm.doctor_id}
                      onChange={(e) => {
                        setAddForm({ ...addForm, doctor_id: e.target.value, schedule_id: "" });
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Pilih Dokter</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>{d.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={addForm.appointment_date}
                      onChange={(e) => setAddForm({ ...addForm, appointment_date: e.target.value, schedule_id: "" })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Keluhan</label>
                    <input
                      type="text"
                      value={addForm.notes}
                      onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                      placeholder="Keluhan pasien"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Waktu</label>
                    <select
                      required
                      value={addForm.schedule_id}
                      onChange={(e) => setAddForm({ ...addForm, schedule_id: e.target.value })}
                      disabled={!addForm.doctor_id || !addForm.appointment_date}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">Pilih Waktu</option>
                      {availableSchedules.map((s) => (
                        <option key={s.id} value={s.id}>
                          {formatTime(s.start_time)} - {formatTime(s.end_time)} WIB
                        </option>
                      ))}
                    </select>
                    {addForm.doctor_id && addForm.appointment_date && availableSchedules.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">Tidak ada jadwal untuk dokter/tanggal ini.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select
                      disabled
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                    >
                      <option>Menunggu (Default)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
