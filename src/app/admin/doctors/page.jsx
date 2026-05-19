"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function AdminDoctorsPage() {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await fetch('/api/doctors');
                const data = await response.json();
                if (response.ok) {
                    setDoctors(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch doctors:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors();
    }, []);

    const filteredDoctors = doctors.filter(doc =>
        doc.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialization_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = doctors.filter(doc => doc.is_active).length;
    const inactiveCount = doctors.length - activeCount;

    return (
        <div className="font-sans text-slate-800">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">Kelola Dokter</h1>
                    <p className="text-gray-500 text-sm">Kelola data dokter yang terdaftar di sistem</p>
                </div>
                
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search dokter"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#5E81CC] focus:border-transparent transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Stats Cards & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div className="flex gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-40 flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-gray-800 mb-3">Total dokter</span>
                        <span className="text-2xl font-bold text-gray-900">{doctors.length}</span>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-40 flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-gray-800 mb-3">Dokter aktif</span>
                        <span className="text-2xl font-bold text-gray-900">{activeCount}</span>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-40 flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-gray-800 mb-3 uppercase">dokter non aktif</span>
                        <span className="text-2xl font-bold text-gray-900">{inactiveCount}</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-[#5E81CC] font-semibold rounded-lg text-sm shadow-sm hover:bg-gray-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filter
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-[#5E81CC] text-white font-semibold rounded-lg text-sm shadow-md hover:bg-[#4A6BB0] transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Dokter
                    </button>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden pb-6">
                <div className="p-6 pb-4">
                    <h2 className="text-lg font-bold text-gray-900">Daftar Dokter</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F3F6FB] text-gray-700 font-semibold text-xs border-y border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-center w-16">No</th>
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
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">Memuat data...</td>
                                </tr>
                            ) : filteredDoctors.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">Tidak ada dokter ditemukan</td>
                                </tr>
                            ) : (
                                filteredDoctors.map((doc, index) => (
                                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-center font-medium">{index + 1}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">{doc.full_name}</td>
                                        <td className="px-6 py-4 font-medium text-gray-800">{doc.specialization_name}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{doc.email}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium font-mono">08xxxxxxxxx</td>
                                        <td className="px-6 py-4 text-center">
                                            {doc.is_active ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-600">
                                                    aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-500">
                                                    Non aktif
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <button className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-2 mt-8 mb-4">
                    <button className="p-1 text-gray-400 hover:text-[#5E81CC] transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#5E81CC] text-white font-semibold text-sm">
                        1
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 font-semibold text-sm transition-colors">
                        2
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 font-semibold text-sm transition-colors">
                        3
                    </button>
                    <button className="p-1 text-gray-400 hover:text-[#5E81CC] transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
