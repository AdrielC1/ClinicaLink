"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function DeletedDoctorsPage() {
    const [deletedDoctors, setDeletedDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchDeletedDoctors = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/doctors?include_deleted=true");
            const d = await res.json();
            if (res.ok) {
                const list = (d.data || []).filter(x => x.deleted_at);
                setDeletedDoctors(list);
            }
        } catch (e) {
            console.error("Gagal mengambil data dokter terhapus:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeletedDoctors();
    }, []);

    // Format date helper
    const formatDateID = (dateStr) => {
        if (!dateStr) return "-";
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        const d = new Date(dateStr);
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    // Filter berdasarkan pencarian nama/spesialisasi
    const filtered = deletedDoctors.filter(doc =>
        doc.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialization_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="font-sans text-slate-800 pb-6">
            {/* Header dengan Tombol Kembali */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Link href="/admin/doctors" className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-gray-600 transition-colors shadow-sm" title="Kembali ke Kelola Dokter">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Dokter Terhapus</h1>
                    </div>
                    <p className="text-gray-500 text-sm ml-11">Daftar dokter yang telah dinonaktifkan secara permanen (soft-delete)</p>
                </div>
            </div>

            {/* Action Bar & Search */}
            <div className="flex flex-wrap gap-3 items-center mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Cari dokter terhapus..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Main Panel dengan UI Premium Tema Orange/Amber */}
            <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-orange-700 mb-4 flex items-center gap-2 text-lg">
                    <Trash2 className="w-5 h-5 text-orange-600" />
                    Daftar Dokter Terhapus ({filtered.length})
                </h3>

                {loading ? (
                    <div className="py-12 text-center text-orange-600 font-semibold animate-pulse">Memuat data dokter terhapus...</div>
                ) : filtered.length === 0 ? (
                    <div className="py-12 text-center text-orange-500 font-semibold bg-white rounded-xl border border-orange-100 shadow-inner">
                        Tidak ada data dokter terhapus yang ditemukan.
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-orange-100 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-orange-50 text-orange-700 font-semibold text-xs border-b border-orange-100">
                                    <tr>
                                        <th className="px-6 py-4 text-center w-12">No</th>
                                        <th className="px-6 py-4">Nama Dokter</th>
                                        <th className="px-6 py-4">Spesialisasi</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">No Telepon</th>
                                        <th className="px-6 py-4 text-center">Tanggal Dihapus</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-orange-100">
                                    {filtered.map((doc, idx) => (
                                        <tr key={doc.id} className="hover:bg-orange-50/20 transition-colors">
                                            <td className="px-6 py-4 text-center font-medium text-gray-500">{idx + 1}</td>
                                            <td className="px-6 py-4 font-bold text-gray-900">{doc.full_name}</td>
                                            <td className="px-6 py-4 font-semibold text-gray-700">{doc.specialization_name}</td>
                                            <td className="px-6 py-4 text-gray-600">{doc.email}</td>
                                            <td className="px-6 py-4 text-gray-600">{doc.phone_number}</td>
                                            <td className="px-6 py-4 text-center font-bold text-orange-600 bg-orange-50/10">
                                                {formatDateID(doc.deleted_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
