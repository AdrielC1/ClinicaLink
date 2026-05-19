"use client";
import { useState, useEffect, useCallback } from "react";

const ITEMS_PER_PAGE = 10;

export default function AdminDoctorsPage() {
    const [allDoctors, setAllDoctors] = useState([]);
    const [deletedDoctors, setDeletedDoctors] = useState([]);
    const [specializations, setSpecializations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [showDeleted, setShowDeleted] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editDoctor, setEditDoctor] = useState(null);
    const [formData, setFormData] = useState({ full_name: "", email: "", password: "", specialization_id: "", phone_number: "", is_active: true });
    const [formLoading, setFormLoading] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [toast, setToast] = useState(null);

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

    const filtered = allDoctors.filter(doc => {
        const matchSearch = doc.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.specialization_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === "all" ? true : filterStatus === "active" ? doc.is_active : !doc.is_active;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const activeCount = allDoctors.filter(d => d.is_active).length;

    const openAdd = () => {
        setEditDoctor(null);
        setFormData({ full_name: "", email: "", password: "", specialization_id: "", phone_number: "", is_active: true });
        setShowModal(true);
    };

    const openEdit = (doc) => {
        setEditDoctor(doc);
        setFormData({ full_name: doc.full_name, email: doc.email, password: "", specialization_id: doc.specialization_id || "", phone_number: doc.phone_number === "-" ? "" : doc.phone_number, is_active: doc.is_active });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            if (editDoctor) {
                const res = await fetch("/api/doctors", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: editDoctor.id, ...formData }),
                });
                const d = await res.json();
                if (!res.ok) { showToast(d.message, "error"); return; }
                showToast("Data dokter berhasil diperbarui.");
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

    return (
        <div className="font-sans text-slate-800 pb-10 p-6 md:p-0">
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

            {/* Stats Cards */}
            <div className="flex gap-4 mb-6 flex-wrap">
                {[
                    { label: "Total dokter", value: allDoctors.length },
                    { label: "Dokter aktif", value: activeCount },
                    { label: "Dokter non aktif", value: allDoctors.length - activeCount },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 w-40 flex flex-col items-center justify-center">
                        <span className="text-xs font-semibold text-gray-600 mb-2 text-center">{stat.label}</span>
                        <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Action Bar: Search + Filter + Tambah */}
            <div className="flex flex-wrap gap-3 items-center mb-6 justify-between">
                <div className="flex gap-3 items-center flex-wrap">
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
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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
                                        onClick={() => { setFilterStatus(opt.val); setFilterOpen(false); setCurrentPage(1); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${filterStatus === opt.val ? "bg-[#E6EDFF] text-[#5E81CC]" : "text-gray-700 hover:bg-gray-50"}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Lihat Terhapus Toggle */}
                    <button
                        onClick={() => setShowDeleted(!showDeleted)}
                        className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-semibold transition-colors shadow-sm ${showDeleted ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Daftar Terhapus {deletedDoctors.length > 0 && <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{deletedDoctors.length}</span>}
                    </button>
                </div>

                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#5E81CC] text-white font-semibold rounded-lg text-sm shadow-md hover:bg-[#4A6BB0] transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Dokter
                </button>
            </div>

            {/* Deleted Doctors Panel */}
            {showDeleted && (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mb-6">
                    <h3 className="font-bold text-orange-700 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Daftar Dokter Terhapus ({deletedDoctors.length})
                    </h3>
                    {deletedDoctors.length === 0 ? (
                        <p className="text-orange-600 text-sm">Tidak ada dokter yang dihapus.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs font-semibold text-orange-600">
                                    <tr>
                                        <th className="px-4 py-2">Nama</th>
                                        <th className="px-4 py-2">Spesialisasi</th>
                                        <th className="px-4 py-2">Email</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-orange-100">
                                    {deletedDoctors.map(doc => (
                                        <tr key={doc.id}>
                                            <td className="px-4 py-3 font-semibold text-gray-800">{doc.full_name}</td>
                                            <td className="px-4 py-3 text-gray-600">{doc.specialization_name}</td>
                                            <td className="px-4 py-3 text-gray-600">{doc.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

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
                            ) : paginated.length === 0 ? (
                                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400">Tidak ada dokter ditemukan</td></tr>
                            ) : paginated.map((doc, idx) => (
                                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-center font-medium text-gray-500">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                                    <td className="px-6 py-4 font-semibold text-gray-900">{doc.full_name}</td>
                                    <td className="px-6 py-4 text-gray-700">{doc.specialization_name}</td>
                                    <td className="px-6 py-4 text-gray-600">{doc.email}</td>
                                    <td className="px-6 py-4 text-gray-600 font-mono">{doc.phone_number}</td>
                                    <td className="px-6 py-4 text-center">
                                        {doc.is_active
                                            ? <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-600">Aktif</span>
                                            : <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-500">Non aktif</span>
                                        }
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
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-2 mt-6 mb-2">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1.5 text-gray-400 hover:text-[#5E81CC] disabled:opacity-30 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setCurrentPage(p)}
                            className={`w-8 h-8 flex items-center justify-center rounded-full font-semibold text-sm transition-colors ${currentPage === p ? "bg-[#5E81CC] text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                            {p}
                        </button>
                    ))}
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1.5 text-gray-400 hover:text-[#5E81CC] disabled:opacity-30 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>

            {/* Modal Tambah/Edit Dokter */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
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
                                <div className="col-span-2 flex items-center gap-3">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={formData.is_active} onChange={e => setFormData(f => ({ ...f, is_active: e.target.checked }))} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5E81CC]"></div>
                                    </label>
                                    <span className="text-sm font-semibold text-gray-700">Status Aktif</span>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
                                <button type="submit" disabled={formLoading} className="flex-1 px-4 py-2.5 bg-[#5E81CC] text-white rounded-xl text-sm font-semibold hover:bg-[#4A6BB0] transition-colors disabled:opacity-60">
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
