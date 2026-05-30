"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, AlertTriangle, Eye, X } from "lucide-react";

function computeVirtualStatus(appt) {
  if (appt.status === "Sedang Berlangsung") {
    return "Berlangsung";
  }
  return appt.status;
}

const INDONESIAN_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Modals
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  // Cancel form state
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelSaving, setCancelSaving] = useState(false);
  const [cancelErr, setCancelErr] = useState("");

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
        const enrichedApps = apps.map((app) => ({
          ...app,
          status: computeVirtualStatus(app),
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

  const handleSearch = (e) => setSearchQuery(e.target.value);

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setShowStatusDropdown(false);
  };

  const filteredAppointments = appointments.filter((app) => {
    const matchesSearch =
      app.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "Semua" || app.status === statusFilter;
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
    return `${date.getDate()} ${INDONESIAN_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString.substring(0, 5);
  };

  const resolveTimeDisplay = (app) => {
    if (app.start_time && app.end_time) {
      return `${formatTime(app.start_time)} - ${formatTime(app.end_time)} WIB`;
    }
    const t = app.schedule_time || "-";
    if (t !== "-" && t.includes("-")) {
      const parts = t.split("-").map((p) => formatTime(p.trim()));
      return `${parts[0]} - ${parts[1]} WIB`;
    }
    return t;
  };

  // ── Cancel modal ─────────────────────────────────────────────────────────────
  const openCancelModal = (app) => {
    setCancelTarget(app);
    setCancellationReason("");
    setCancelErr("");
    setIsCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setIsCancelModalOpen(false);
    setCancelTarget(null);
    setCancellationReason("");
    setCancelErr("");
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancellationReason.trim()) {
      setCancelErr("Alasan pembatalan wajib diisi.");
      return;
    }
    setCancelSaving(true);
    setCancelErr("");
    try {
      const res = await fetch(`/api/appointments?id=${cancelTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Dibatalkan",
          cancellation_reason: cancellationReason.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal membatalkan janji temu.");
      }
      closeCancelModal();
      fetchInitialData();
    } catch (error) {
      setCancelErr(error.message);
    } finally {
      setCancelSaving(false);
    }
  };

  // ── Detail modal ──────────────────────────────────────────────────────────────
  const openDetailModal = (app) => {
    const patientInfo = patients.find((p) => p.id === app.patient_id);
    setSelectedDetail({
      ...app,
      patient_phone: patientInfo?.phone_number || "Tidak ada nomor kontak",
      formatted_time: resolveTimeDisplay(app),
    });
    setIsDetailModalOpen(true);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter(
    (app) => app.appointment_date === todayStr
  );

  const isAlreadyCancelled = cancelTarget?.status === "Dibatalkan";

  return (
    <div className="font-sans text-slate-800 pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Kelola Janji Temu</h1>
        <p className="text-gray-500 text-sm">
          Kelola data janji temu yang terdaftar di sistem
        </p>
      </div>

      {/* Summary Cards */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 w-40 flex-grow sm:flex-grow-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-gray-600 mb-2 text-center">
            Total janji temu
          </span>
          <span className="text-2xl font-bold text-gray-900">
            {appointments.length}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 w-40 flex-grow sm:flex-grow-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-gray-600 mb-2 text-center">
            Hari ini
          </span>
          <span className="text-2xl font-bold text-gray-900">
            {todayAppointments.length}
          </span>
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
            Filter{" "}
            {statusFilter !== "Semua" && (
              <span className="text-xs ml-1 bg-[#5E81CC] text-white px-1.5 py-0.5 rounded-full">
                {statusFilter}
              </span>
            )}
          </button>

          {showStatusDropdown && (
            <div className="absolute top-12 left-0 bg-white border border-gray-100 rounded-xl shadow-lg z-20 w-48 p-1">
              {[
                "Semua",
                "Dijadwalkan",
                "Menunggu",
                "Berlangsung",
                "Selesai",
                "Dibatalkan",
              ].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusFilter(status)}
                  className={`block w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors rounded-lg ${
                    statusFilter === status
                      ? "bg-[#E6EDFF] text-[#5E81CC]"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
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
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    Tidak ada data janji temu ditemukan.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app, index) => {
                  const timeDisplay = resolveTimeDisplay(app);
                  const isCancelled = app.status === "Dibatalkan";

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-center font-medium text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {app.patient_name}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">
                        {app.doctor_name}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {formatDateId(app.appointment_date)}
                      </td>
                      <td className="px-6 py-4 text-center text-[#5E81CC] font-bold">
                        {timeDisplay}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-bold border ${getStatusBadge(app.status)}`}
                        >
                          {app.status || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Cancel button */}
                          <button
                            onClick={() => openCancelModal(app)}
                            disabled={isCancelled}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={
                              isCancelled ? "Sudah dibatalkan" : "Batalkan"
                            }
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                          {/* Detail button */}
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

      {/* ── Cancel Modal ─────────────────────────────────────────────────────── */}
      {isCancelModalOpen && cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Batalkan Janji Temu
                </h2>
              </div>
              <button
                onClick={closeCancelModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="p-6 space-y-4">
              {/* Appointment summary */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex gap-3">
                  <span className="w-24 text-gray-500 flex-shrink-0">Pasien</span>
                  <span className="font-semibold text-gray-800">
                    {cancelTarget.patient_name}
                  </span>
                </div>
                <div className="flex gap-3">
                  <span className="w-24 text-gray-500 flex-shrink-0">Dokter</span>
                  <span className="font-semibold text-gray-800">
                    {cancelTarget.doctor_name}
                  </span>
                </div>
                <div className="flex gap-3">
                  <span className="w-24 text-gray-500 flex-shrink-0">Tanggal</span>
                  <span className="font-semibold text-gray-800">
                    {formatDateId(cancelTarget.appointment_date)}
                  </span>
                </div>
                <div className="flex gap-3">
                  <span className="w-24 text-gray-500 flex-shrink-0">Waktu</span>
                  <span className="font-semibold text-gray-800">
                    {resolveTimeDisplay(cancelTarget)}
                  </span>
                </div>
                <div className="flex gap-3 items-center">
                  <span className="w-24 text-gray-500 flex-shrink-0">
                    Status
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(cancelTarget.status)}`}
                  >
                    {cancelTarget.status}
                  </span>
                </div>
              </div>

              {/* Guard: already cancelled */}
              {isAlreadyCancelled ? (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  Janji temu ini sudah berstatus{" "}
                  <strong>Dibatalkan</strong> dan tidak dapat dibatalkan ulang.
                </div>
              ) : (
                <>
                  {/* Reason textarea */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Alasan Pembatalan{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={cancellationReason}
                      onChange={(e) => {
                        setCancellationReason(e.target.value);
                        if (cancelErr) setCancelErr("");
                      }}
                      placeholder="Tulis alasan pembatalan janji temu ini..."
                      className={`w-full border rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 transition-colors ${
                        cancelErr
                          ? "border-red-300 focus:ring-red-200"
                          : "border-slate-200 focus:ring-[#5E81CC]/30"
                      }`}
                    />
                    {cancelErr && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {cancelErr}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">
                      {cancellationReason.trim().length} karakter
                    </p>
                  </div>

                  {/* Warning note */}
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                    Tindakan ini akan mengubah status menjadi{" "}
                    <strong>Dibatalkan</strong> dan mengirim notifikasi ke
                    pasien.
                  </p>
                </>
              )}

              {/* Footer buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCancelModal}
                  className="px-5 py-2 border border-slate-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Kembali
                </button>
                {!isAlreadyCancelled && (
                  <button
                    type="submit"
                    disabled={cancelSaving || !cancellationReason.trim()}
                    className="px-5 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelSaving ? "Membatalkan..." : "Ya, Batalkan"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Detail Modal ──────────────────────────────────────────────────────── */}
      {isDetailModalOpen && selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">
                Detail Pasien
              </h2>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                ["Nama Pasien", selectedDetail.patient_name],
                ["Nama Dokter", selectedDetail.doctor_name],
                ["Tanggal", formatDateId(selectedDetail.appointment_date)],
                ["Jam", selectedDetail.formatted_time],
                ["Status", selectedDetail.status || "-"],
                ["Keluhan", selectedDetail.complaints || selectedDetail.notes || "-"],
                ["Catatan Medis", selectedDetail.medical_notes || "-"],
                [
                  "Alasan Batal",
                  selectedDetail.cancellation_reason || "-",
                ],
                ["Kontak Pasien", selectedDetail.patient_phone],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[160px_1fr] items-start gap-4"
                >
                  <span className="text-sm font-medium text-slate-700">
                    {label}
                  </span>
                  <span
                    className={`text-sm font-semibold text-slate-900 ${
                      label === "Status" &&
                      selectedDetail.status?.toLowerCase() === "dibatalkan"
                        ? "text-red-600"
                        : label === "Status" &&
                          selectedDetail.status?.toLowerCase() === "selesai"
                        ? "text-green-700"
                        : ""
                    }`}
                  >
                    {value}
                  </span>
                </div>
              ))}

              <div className="pt-4 border-t border-slate-100 flex justify-center">
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