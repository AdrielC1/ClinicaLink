"use client";

import { useState } from "react";

// Data dummy untuk tampilan UI
const MOCK_SCHEDULES = [
    {
        id: 1,
        doctor: "Dr. Emily",
        specialist: "Spesialis Gigi",
        day: "Senin",
        time: "08.00 - 16.00 WIB",
        status: "Tersedia"
    },
    {
        id: 2,
        doctor: "Dr. Jatmiko",
        specialist: "Spesialis Umum",
        day: "Senin",
        time: "09.00 - 17.00 WIB",
        status: "Tersedia"
    },
    {
        id: 3,
        doctor: "dr. Mike",
        specialist: "Dokter Umum",
        day: "Senin",
        time: "08.00 - 17.00 WIB",
        status: "sebagian"
    },
    {
        id: 4,
        doctor: "Dr. Riri",
        specialist: "Dokter Kandungan",
        day: "Senin",
        time: "08.00 - 16.00 WIB",
        status: "penuh"
    }
];

export default function AdminSchedulesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    
    // Calendar State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Helper: Get days in month
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    // Helper: Get first day of month (0 = Sunday, 1 = Monday, etc. Adjusting to start on Monday for UI)
    const getFirstDayOfMonth = (year, month) => {
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // 0 (Sun) becomes 6, 1 (Mon) becomes 0
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const renderCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        
        const days = [];
        // Empty slots before the 1st
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="text-transparent">0</div>);
        }
        
        // Actual days
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const isSelected = date.toDateString() === selectedDate.toDateString();
            
            days.push(
                <button 
                    key={i} 
                    onClick={() => setSelectedDate(date)}
                    className={`w-7 h-7 flex items-center justify-center mx-auto rounded-full text-xs font-semibold transition-colors
                        ${isSelected ? "bg-[#E6EDFF] text-[#5E81CC] font-bold" : "text-gray-600 hover:bg-gray-100"}`}
                >
                    {i}
                </button>
            );
        }
        return days;
    };

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    // Status color mapping based on the design
    const getStatusStyle = (status) => {
        switch(status.toLowerCase()) {
            case 'tersedia':
                return "bg-green-100 text-green-600 border-green-200";
            case 'sebagian':
                return "bg-blue-100 text-blue-500 border-blue-200";
            case 'penuh':
                return "bg-orange-100 text-orange-500 border-orange-200";
            default:
                return "bg-gray-100 text-gray-600 border-gray-200";
        }
    };

    return (
        <div className="font-sans text-slate-800 pb-10">
            {/* Header Section & Calendar */}
            <div className="flex flex-col xl:flex-row justify-between items-stretch mb-4 gap-6">
                
                {/* Kiri: Title di atas, action buttons di bawah (mepet ke kalender) */}
                <div className="flex-1 flex flex-col justify-between mt-2">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kelola Jadwal</h1>
                        <p className="text-gray-500 text-sm">Kelola data jadwal praktik dokter yang terdaftar di sistem</p>
                    </div>

                    {/* Action buttons — terdorong ke bawah sejajar dengan bagian bawah kalender */}
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search jadwal"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#5E81CC] focus:border-transparent transition-all shadow-sm"
                            />
                        </div>

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
                            Tambah Jadwal
                        </button>

                        <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-semibold rounded-lg text-sm shadow-sm hover:bg-gray-50 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Daftar Terhapus
                        </button>
                    </div>
                </div>

                {/* Calendar Widget */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 w-[300px] shrink-0">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <button onClick={handlePrevMonth} className="text-gray-400 hover:text-[#5E81CC] transition-colors p-1">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="font-bold text-sm text-gray-900">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                        <button onClick={handleNextMonth} className="text-gray-400 hover:text-[#5E81CC] transition-colors p-1">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[11px] mb-2 font-bold text-gray-800">
                        <div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div><div>Min</div>
                    </div>
                    <div className="grid grid-cols-7 gap-y-2 text-center">
                        {renderCalendarDays()}
                    </div>
                </div>

            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden pb-4">
                <div className="p-6 pb-4">
                    <h2 className="text-lg font-bold text-gray-900">Daftar Jadwal Dokter</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F3F6FB] text-gray-700 font-semibold text-xs border-y border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-center w-16">No</th>
                                <th className="px-6 py-4">Dokter</th>
                                <th className="px-6 py-4">Spesialis</th>
                                <th className="px-6 py-4">Hari</th>
                                <th className="px-6 py-4">Jam Praktik</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {MOCK_SCHEDULES.map((schedule, index) => (
                                <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-center font-medium text-gray-600">{index + 1}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900">{schedule.doctor}</td>
                                    <td className="px-6 py-4 font-semibold text-gray-700">{schedule.specialist}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800">{schedule.day}</td>
                                    <td className="px-6 py-4 text-gray-600 font-bold">{schedule.time}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-bold border ${getStatusStyle(schedule.status)}`}>
                                            {schedule.status}
                                        </span>
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
                            ))}
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
