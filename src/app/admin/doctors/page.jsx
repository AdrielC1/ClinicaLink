"use client";
import { useState, useEffect, useCallback } from "react";
import { CalendarDays } from "lucide-react";
import CalendarWidget from "@/components/CalendarWidget";
import Link from "next/link";

// Helper: compute status from inactive_from
function getDoctorStatus(doc) {
    if (!doc.inactive_from) return "active";
    const today = new Date().toISOString().split("T")[0];
    return doc.inactive_from <= today ? "inactive" : "scheduled";
}

export default function AdminDoctorsPage() {
    const [allDoctors, setAllDoctors] = useState([]);
    const [deletedDoctors, setDeletedDoctors] = useState([]);
    const [specializations, setSpecializations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [editDoctor, setEditDoctor] = useState(null);
    const [formData, setFormData] = useState({ full_name: "", email: "", password: "", specialization_id: "", phone_number: "" });
    const [formLoading, setFormLoading] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [toast, setToast] = useState(null);

    // ── Inactivation States ──
    const [inactiveFromDate, setInactiveFromDate] = useState("");
    const [cancellationReason, setCancellationReason] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [affectedAppointments, setAffectedAppointments] = useState([]);
    const [loadingAffected, setLoadingAffected] = useState(false);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchDoctors = useCallback(async () => {
        setLoading(true);
        try {
            const [res, resDeleted, resSpec] = await Promise.all([
                fetch("/api/doctors"),
                fetch("/api/doctors?include_deleted=true"),
                fetch("/api/specializations"),
            ]);
            const d = await res.json();
            const dd = await resDeleted.json();
            const ds = await resSpec.json();
            setAllDoctors(d.data || []);
            setDeletedDoctors((dd.data || []).filter(x => x.deleted_at));
            setSpecializations(ds.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

    // ── Fetch affected appointments when inactive_from changes ──
    useEffect(() => {
        if (!editDoctor || !inactiveFromDate) {
            setAffectedAppointments([]);
            return;
        }

        const fetchAffected = async () => {
            setLoadingAffected(true);
            try {
                const res = await fetch(`/api/appointments?doctor_id=${editDoctor.id}&status=Menunggu`);
                if (res.ok) {
                    const data = await res.json();
                    const all = Array.isArray(data.data) ? data.data : [];
                    // Filter: appointment_date >= inactiveFromDate
                    const affected = all.filter(a => {
                        const apptDate = a.appointment_date?.split("T")[0];
                        return apptDate && apptDate >= inactiveFromDate;
                    });
                    setAffectedAppointments(affected);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingAffected(false);
            }
        };
        fetchAffected();
    }, [editDoctor, inactiveFromDate]);

    const filtered = allDoctors.filter(doc => {
        const matchSearch = doc.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.specialization_name.toLowerCase().includes(searchTerm.toLowerCase());
        const status = getDoctorStatus(doc);
        const matchStatus = filterStatus === "all" ? true
            : filterStatus === "active" ? (status === "active" || status === "scheduled")
            : status === "inactive";
        return matchSearch && matchStatus;
    });

    const activeCount = allDoctors.filter(d => getDoctorStatus(d) !== "inactive").length;

    // ── Dokter yang dijadwalkan nonaktif (untuk info panel) ──
    const scheduledDoctors = allDoctors.filter(d => getDoctorStatus(d) === "scheduled");

    const openAdd = () => {
        setEditDoctor(null);
        setFormData({ full_name: "", email: "", password: "", specialization_id: "", phone_number: "" });
        setInactiveFromDate("");
        setCancellationReason("");
        setAffectedAppointments([]);
        setShowModal(true);
    };

    const openEdit = (doc) => {
        setEditDoctor(doc);
        setFormData({ full_name: doc.full_name, email: doc.email, password: "", specialization_id: doc.specialization_id || "", phone_number: doc.phone_number === "-" ? "" : doc.phone_number });
        setInactiveFromDate(doc.inactive_from || "");
        setCancellationReason("");
        setAffectedAppointments([]);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validasi: jika ada appointment terdampak, alasan wajib diisi
        if (affectedAppointments.length > 0 && !cancellationReason.trim()) {
            showToast("Alasan pembatalan wajib diisi jika ada janji temu terdampak!", "error");
            return;
        }

        setFormLoading(true);
        try {
            if (editDoctor) {
                const res = await fetch("/api/doctors", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: editDoctor.id,
                        ...formData,
                        inactive_from: inactiveFromDate || null,
                        cancellation_reason: cancellationReason || null,
                    }),
                });
                const d = await res.json();
                if (!res.ok) { showToast(d.message, "error"); return; }
                showToast(d.message);
            } else {
                const res = await fetch("/api/doctors", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
                const d = await res.json();
                if (!res.ok) { showToast(d.message, "error"); return; }
                showToast("Dokter berhasil ditambahkan.");
            }
            setShowModal(false);
            fetchDoctors();
        } catch (err) {
            showToast("Terjadi kesalahan.", "error");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Yakin ingin menghapus dokter ini?")) return;
        const res = await fetch(`/api/doctors?id=${id}`, { method: "DELETE" });
        const d = await res.json();
        if (res.ok) { showToast("Dokter dihapus."); fetchDoctors(); }
        else showToast(d.message, "error");
    };

    // ── Format date helper ──
    const formatDateID = (dateStr) => {
        if (!dateStr) return "-";
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        const d = new Date(dateStr);
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    return (
        <div className="font-sans text-slate-800 pb-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-semibold text-sm transition-all ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Kelola Dokter</h1>
                <p className="text-gray-500 text-sm">Kelola data dokter yang terdaftar di sistem</p>
            </div>

            {/* Stats Cards + Scheduled Inactivation Info Panel */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
                {/* Left: Stats Cards */}
                <div className="flex gap-4 flex-wrap">
                    {[
                        { label: "Total dokter", value: allDoctors.length },
                        { label: "Dokter aktif", value: activeCount },
                        { label: "Dokter non aktif", value: allDoctors.length - activeCount },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 w-40 flex flex-col items-center justify-center">
                            <span className="text-sm font-bold text-gray-600 mb-2 text-center">{stat.label}</span>
                            <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                        </div>
                    ))}
                </div>

                {/* Right: Scheduled Inactivation Info Panel */}
                {scheduledDoctors.length > 0 && (
                    <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl p-5 min-w-[280px]">
                        <div className="flex items-center gap-2 mb-3">
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="font-bold text-amber-800 text-sm">Dijadwalkan Nonaktif</h3>
                        </div>
                        <div className="space-y-2">
                            {scheduledDoctors.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                                    <div>
                                        <span className="text-sm font-bold text-gray-900">{doc.full_name}</span>
                                        <span className="text-xs text-gray-500 ml-2">({doc.specialization_name})</span>
                                    </div>
                                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                                        Mulai {formatDateID(doc.inactive_from)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Bar: Search + Filter + Tambah + Terhapus */}
            <div className="flex flex-wrap gap-3 items-center mb-6">
                {/* Search */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Cari dokter..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[#5E81CC] focus:border-transparent transition-all shadow-sm"
                    />
                </div>

                {/* Filter Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setFilterOpen(!filterOpen)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#5E81CC] font-semibold rounded-lg text-sm shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filter {filterStatus !== "all" && <span className="w-2 h-2 bg-[#5E81CC] rounded-full ml-1"></span>}
                    </button>
                    {filterOpen && (
                        <div className="absolute top-12 left-0 bg-white border border-gray-100 rounded-xl shadow-lg z-10 w-40 p-1">
                            {[{ val: "all", label: "Semua" }, { val: "active", label: "Aktif" }, { val: "inactive", label: "Non aktif" }].map(opt => (
                                <button
                                    key={opt.val}
                                    onClick={() => { setFilterStatus(opt.val); setFilterOpen(false); }}
                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${filterStatus === opt.val ? "bg-[#E6EDFF] text-[#5E81CC]" : "text-gray-700 hover:bg-gray-50"}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tambah Dokter Button */}
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#5E81CC] text-white font-semibold rounded-lg text-sm shadow-md hover:bg-[#4A6BB0] transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Dokter
                </button>

                {/* Lihat Terhapus Link */}
                <Link
                    href="/admin/doctors/deleted"
                    className="flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-semibold transition-colors shadow-sm bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Daftar Terhapus {deletedDoctors.length > 0 && <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{deletedDoctors.length}</span>}
                </Link>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden pb-4">
                <div className="p-6 pb-4">
                    <h2 className="text-lg font-bold text-gray-900">Daftar Dokter</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F3F6FB] text-gray-700 font-semibold text-xs border-y border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-center w-12">No</th>
                                <th className="px-6 py-4">Nama Dokter</th>
                                <th className="px-6 py-4">Spesialisasi</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">No Telepon</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400">Memuat data...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400">Tidak ada dokter ditemukan</td></tr>
                            ) : filtered.map((doc, idx) => {
                                const status = getDoctorStatus(doc);
                                return (
                                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-center font-medium text-gray-500">{idx + 1}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{doc.full_name}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-700">{doc.specialization_name}</td>
                                        <td className="px-6 py-4 text-gray-600">{doc.email}</td>
                                        <td className="px-6 py-4 text-gray-600">{doc.phone_number}</td>
                                        <td className="px-6 py-4 text-center">
                                            {status === "active" && (
                                                <span className="inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600 border border-green-200">Aktif</span>
                                            )}
                                            {status === "scheduled" && (
                                                <span className="inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">Aktif</span>
                                            )}
                                            {status === "inactive" && (
                                                <span className="inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-bold bg-red-100 text-red-500 border border-red-200">Non aktif</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openEdit(doc)} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* =========================================================== */}
            {/* Modal Tambah/Edit Dokter                                     */}
            {/* =========================================================== */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">{editDoctor ? "Edit Dokter" : "Tambah Dokter Baru"}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Nama Lengkap *</label>
                                    <input required type="text" value={formData.full_name} onChange={e => setFormData(f => ({ ...f, full_name: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5E81CC] focus:bg-white transition-all" placeholder="Dr. Nama Lengkap" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Email *</label>
                                    <input required type="email" value={formData.email} disabled={!!editDoctor} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5E81CC] focus:bg-white transition-all disabled:opacity-60" placeholder="dokter@email.com" />
                                </div>
                                {!editDoctor && (
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Password *</label>
                                        <input required type="password" value={formData.password} onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5E81CC] focus:bg-white transition-all" placeholder="Min. 6 karakter" />
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Spesialisasi *</label>
                                    <select required value={formData.specialization_id} onChange={e => setFormData(f => ({ ...f, specialization_id: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5E81CC] focus:bg-white transition-all">
                                        <option value="">Pilih spesialisasi</option>
                                        {specializations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">No Telepon</label>
                                    <input type="text" value={formData.phone_number} onChange={e => setFormData(f => ({ ...f, phone_number: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5E81CC] focus:bg-white transition-all" placeholder="08xxxxxxxxxx" />
                                </div>
                            </div>

                            {/* ── Scheduled Inactivation Section (Edit Only) ── */}
                            {editDoctor && (
                                <div className="mt-6 border-t border-gray-100 pt-5">
                                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Nonaktifkan Dokter
                                    </h4>

                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 space-y-1.5 relative">
                                            <label className="text-xs font-semibold text-gray-600">Mulai Tanggal</label>
                                            <button
                                                type="button"
                                                onClick={() => setShowDatePicker(!showDatePicker)}
                                                className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm hover:bg-white hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all text-left"
                                            >
                                                <span className={inactiveFromDate ? "text-gray-900 font-bold" : "text-gray-400"}>
                                                    {inactiveFromDate ? new Date(inactiveFromDate).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'}) : "Pilih Tanggal"}
                                                </span>
                                                <CalendarDays className="w-4 h-4 text-gray-400" />
                                            </button>
                                            
                                            {showDatePicker && (
                                                <div className="absolute bottom-full mb-2 left-0 w-[280px] z-50 bg-white rounded-3xl shadow-xl shadow-amber-900/5 border border-amber-100">
                                                    <CalendarWidget 
                                                        currentMonth={calendarMonth}
                                                        onChangeMonth={(delta) => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))}
                                                        selectedDate={inactiveFromDate}
                                                        onSelectDate={(dateStr) => {
                                                            setInactiveFromDate(dateStr);
                                                            setShowDatePicker(false);
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        {inactiveFromDate && (
                                            <button
                                                type="button"
                                                onClick={() => { setInactiveFromDate(""); setCancellationReason(""); setAffectedAppointments([]); }}
                                                className="mt-6 px-3 py-2.5 text-xs font-bold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                                            >
                                                Hapus Tanggal
                                            </button>
                                        )}
                                    </div>

                                    {/* Affected Appointments Preview */}
                                    {inactiveFromDate && (
                                        <div className="mt-4">
                                            {loadingAffected ? (
                                                <p className="text-xs text-gray-400 animate-pulse">Memeriksa janji temu terdampak...</p>
                                            ) : affectedAppointments.length > 0 ? (
                                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                        </svg>
                                                        <span className="text-sm font-bold text-red-700">
                                                            {affectedAppointments.length} janji temu akan otomatis dibatalkan
                                                        </span>
                                                    </div>
                                                    <div className="max-h-32 overflow-y-auto space-y-1.5 mb-3">
                                                        {affectedAppointments.map(a => (
                                                            <div key={a.id} className="text-xs text-red-800 bg-white/60 rounded-lg px-3 py-1.5 flex justify-between">
                                                                <span className="font-bold">{a.patient_name}</span>
                                                                <span>{formatDateID(a.appointment_date?.split("T")[0])} · {a.start_time?.substring(0, 5)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold text-red-700">Alasan Pembatalan *</label>
                                                        <input
                                                            type="text"
                                                            value={cancellationReason}
                                                            onChange={e => setCancellationReason(e.target.value)}
                                                            placeholder="Misal: Dokter sakit / Cuti panjang"
                                                            className="w-full px-3 py-2 bg-white border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-green-600 font-semibold flex items-center gap-1.5">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                    Tidak ada janji temu yang terdampak.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
                                <button type="submit" disabled={formLoading || (inactiveFromDate && new Date(inactiveFromDate) < new Date(new Date().setHours(0,0,0,0)))} className="flex-1 px-4 py-2.5 bg-[#5E81CC] text-white rounded-xl text-sm font-semibold hover:bg-[#4A6BB0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                                    {formLoading ? "Menyimpan..." : editDoctor ? "Simpan Perubahan" : "Tambah Dokter"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
