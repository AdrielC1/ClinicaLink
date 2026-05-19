import React from "react";

export default function AdminSettingsPage() {
    return (
        <div className="font-sans text-slate-800 pb-10">
            {/* Header Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Pengaturan</h1>
                <p className="text-gray-500 text-sm">Kelola pengaturan sistem, preferensi aplikasi, dan keamanan</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Sidebar Menu (Internal Settings) */}
                <div className="col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-6">
                        <nav className="space-y-1">
                            <a href="#" className="flex items-center gap-3 px-4 py-3 bg-[#E6EDFF] text-[#5E81CC] rounded-xl font-bold text-sm transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Profil Klinik
                            </a>
                            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-semibold text-sm transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                Notifikasi
                            </a>
                            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-semibold text-sm transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Keamanan & Sandi
                            </a>
                        </nav>
                    </div>
                </div>

                {/* Right Form Area */}
                <div className="col-span-1 lg:col-span-2 space-y-6">
                    
                    {/* Klinik Profile Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Informasi Klinik</h2>
                            <p className="text-sm text-gray-500 mt-1">Perbarui logo, nama, dan alamat klinik Anda di sini.</p>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Logo Upload Dummy */}
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-[#F3F6FB] rounded-2xl border-2 border-dashed border-[#5E81CC] flex items-center justify-center text-[#5E81CC]">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <button className="px-4 py-2 bg-white border border-gray-200 text-sm font-semibold text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm mb-2">
                                        Ubah Logo
                                    </button>
                                    <p className="text-xs text-gray-500">Maks. ukuran file 2MB. Format: JPG, PNG.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Nama Klinik</label>
                                    <input type="text" defaultValue="ClinicaLink Utama" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5E81CC] focus:bg-white transition-all text-gray-900" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Nomor Telepon</label>
                                    <input type="text" defaultValue="021-88899900" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5E81CC] focus:bg-white transition-all text-gray-900" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-semibold text-gray-700">Alamat Lengkap</label>
                                    <textarea rows="3" defaultValue="Jl. Sudirman No. 45, Jakarta Selatan" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5E81CC] focus:bg-white transition-all text-gray-900"></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button className="px-6 py-2.5 bg-[#5E81CC] text-white font-semibold rounded-lg text-sm shadow-md hover:bg-[#4A6BB0] transition-colors">
                                Simpan Perubahan
                            </button>
                        </div>
                    </div>

                    {/* Operational Hours Dummy */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Jam Operasional</h2>
                                <p className="text-sm text-gray-500 mt-1">Atur jam buka standar untuk klinik.</p>
                            </div>
                            {/* Toggle Switch */}
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5E81CC]"></div>
                            </label>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl mb-3 hover:bg-gray-50 transition-colors">
                                <span className="font-semibold text-sm text-gray-700">Senin - Jumat</span>
                                <span className="text-sm font-medium bg-[#E6EDFF] text-[#5E81CC] px-3 py-1 rounded-md">08:00 - 20:00</span>
                            </div>
                            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                <span className="font-semibold text-sm text-gray-700">Sabtu - Minggu</span>
                                <span className="text-sm font-medium bg-[#E6EDFF] text-[#5E81CC] px-3 py-1 rounded-md">09:00 - 15:00</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
