"use client";

import { useState, useEffect } from "react";

const DAYS_OF_WEEK = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export default function AdminSchedulesPage() {
    // --- State Management ---
    const [schedules, setSchedules] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // UI State
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        doctor_id: "",
        selected_days: [1],
        start_time: "08:00",
        end_time: "16:00",
        slot_duration_minutes: 30,
        room_number: ""
    });

    // Calendar State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // --- Fetch Data ---
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [schedulesRes, doctorsRes] = await Promise.all([
                fetch('/api/schedules'),
                fetch('/api/doctors?is_active=true')
            ]);
            
            const schedulesData = await schedulesRes.json();
            const doctorsData = await doctorsRes.json();

            if (schedulesRes.ok) setSchedules(schedulesData.data);
            else setError(schedulesData.message);

            if (doctorsRes.ok) setDoctors(doctorsData.data);
            
        } catch (err) {
            setError("Gagal menghubungi server.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Handlers ---
    const handleSave = async (e) => {
        e.preventDefault();
        const isEdit = !!editingSchedule;
        
        if (formData.selected_days.length === 0 && !isEdit) {
            alert("Pilih minimal satu hari praktik untuk jadwal baru.");
            return;
        }

        setSaving(true);
        const url = '/api/schedules';

        try {
            if (isEdit) {
                // Mode Edit: Sync jadwal (Tambah, Update, Hapus sesuai pilihan)
                const doctorSchedules = schedules.filter(s => s.doctor_id === editingSchedule.doctor_id);
                const existingDays = doctorSchedules.map(s => s.day_of_week);

                const daysToAdd = formData.selected_days.filter(d => !existingDays.includes(d));
                const daysToUpdate = formData.selected_days.filter(d => existingDays.includes(d));
                const daysToDelete = existingDays.filter(d => !formData.selected_days.includes(d));

                const promises = [];

                daysToUpdate.forEach(day => {
                    const sched = doctorSchedules.find(s => s.day_of_week === day);
                    const body = { ...formData, day_of_week: day, id: sched.id };
                    promises.push(
                        fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(async r => {
                            const resData = await r.json();
                            if (!r.ok) throw new Error(`${DAYS_OF_WEEK[day]}: ${resData.message}`);
                            return resData;
                        })
                    );
                });

                daysToAdd.forEach(day => {
                    const body = { ...formData, day_of_week: day };
                    promises.push(
                        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(async r => {
                            const resData = await r.json();
                            if (!r.ok) throw new Error(`${DAYS_OF_WEEK[day]}: ${resData.message}`);
                            return resData;
                        })
                    );
                });

                daysToDelete.forEach(day => {
                    const sched = doctorSchedules.find(s => s.day_of_week === day);
                    promises.push(
                        fetch(`${url}?id=${sched.id}`, { method: 'DELETE' }).then(async r => {
                            const resData = await r.json();
                            if (!r.ok) throw new Error(`${DAYS_OF_WEEK[day]}: ${resData.message}`);
                            return resData;
                        })
                    );
                });

                await Promise.all(promises);
            } else {
                // Add can post multiple days concurrently
                const promises = formData.selected_days.map(day => {
                    const body = { ...formData, day_of_week: day };
                    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
                           .then(async r => {
                               const resData = await r.json();
                               if (!r.ok) throw new Error(`${DAYS_OF_WEEK[day]}: ${resData.message}`);
                               return resData;
                           });
                });
                await Promise.all(promises);
            }
            await fetchData();
            closeModal();
        } catch (err) {
            alert(err.message || "Terjadi kesalahan saat menyimpan jadwal.");
        } finally {
            setSaving(false);
        }
    };

    const openAddModal = () => {
        setFormData({
            doctor_id: doctors.length > 0 ? doctors[0].id : "",
            selected_days: [selectedDate.getDay()],
            start_time: "08:00",
            end_time: "16:00",
            slot_duration_minutes: 30,
            room_number: ""
        });
        setIsAddModalOpen(true);
    };

    const openEditModal = (schedule) => {
        setEditingSchedule(schedule);
        
        // Ambil semua hari aktif dokter ini untuk di pre-select
        const doctorSchedules = schedules.filter(s => s.doctor_id === schedule.doctor_id);
        const activeDays = doctorSchedules.map(s => s.day_of_week);

        setFormData({
            doctor_id: schedule.doctor_id,
            selected_days: activeDays,
            start_time: schedule.start_time.slice(0, 5), // Format HH:MM
            end_time: schedule.end_time.slice(0, 5),
            slot_duration_minutes: schedule.slot_duration_minutes,
            room_number: schedule.room_number || ""
        });
        setIsEditModalOpen(true);
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setEditingSchedule(null);
    };

    // --- Interactive Days UI Logic ---
    const UI_DAYS = [
        { value: 1, label: "Sen" },
        { value: 2, label: "Sel" },
        { value: 3, label: "Rab" },
        { value: 4, label: "Kam" },
        { value: 5, label: "Jum" },
        { value: 6, label: "Sab" },
        { value: 0, label: "Min" }
    ];

    const toggleDay = (val) => {
        const current = formData.selected_days;
        if (current.includes(val)) {
            setFormData({ ...formData, selected_days: current.filter(d => d !== val) });
        } else {
            setFormData({ ...formData, selected_days: [...current, val] });
        }
    };

    // --- Calendar Logic ---
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => {
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // 0 (Sun) becomes 6, 1 (Mon) becomes 0
    };

    const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const renderCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        
        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="text-transparent">0</div>);
        }
        
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const isSelected = date.toDateString() === selectedDate.toDateString();
            
            days.push(
                <button 
                    key={i} 
                    onClick={() => setSelectedDate(date)}
                    className={`w-7 h-7 flex items-center justify-center mx-auto rounded-full text-xs font-semibold transition-colors
                        ${isSelected ? "bg-[#5E81CC] text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}
                >
                    {i}
                </button>
            );
        }
        return days;
    };

    // --- Derived Data ---
    const selectedDayOfWeek = selectedDate.getDay();
    const filteredSchedules = schedules.filter(s => {
        const matchDay = s.day_of_week === selectedDayOfWeek;
        const matchSearch = s.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchDay && matchSearch;
    });

    return (
        <div className="font-sans text-slate-800 pb-10">
            {/* Header Section & Calendar */}
            <div className="flex flex-col xl:flex-row justify-between items-stretch mb-4 gap-6">
                
                {/* Kiri: Title di atas */}
                <div className="flex-1 flex flex-col justify-between mt-2">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kelola Jadwal</h1>
                        <p className="text-gray-500 text-sm mb-4">
                            Menampilkan jadwal praktik dokter untuk hari <strong className="text-[#5E81CC]">{DAYS_OF_WEEK[selectedDayOfWeek]}</strong>, {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari dokter/spesialis..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#5E81CC] focus:border-transparent transition-all shadow-sm"
                            />
                        </div>

                        <button onClick={openAddModal} className="flex items-center gap-2 px-5 py-2.5 bg-[#5E81CC] text-white font-semibold rounded-lg text-sm shadow-md hover:bg-[#4A6BB0] transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Tambah Jadwal
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
                <div className="p-6 pb-4 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Daftar Jadwal Praktik ({DAYS_OF_WEEK[selectedDayOfWeek]})</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F3F6FB] text-gray-700 font-semibold text-xs border-y border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-center w-16">No</th>
                                <th className="px-6 py-4">Dokter</th>
                                <th className="px-6 py-4">Spesialis</th>
                                <th className="px-6 py-4">Hari Praktik</th>
                                <th className="px-6 py-4">Jam Praktik</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4">Ruangan</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-500 font-medium">Memuat data jadwal...</td></tr>
                            ) : filteredSchedules.length === 0 ? (
                                <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-500 font-medium">Tidak ada jadwal dokter di hari ini.</td></tr>
                            ) : (
                                filteredSchedules.map((schedule, index) => {
                                    // Hitung semua hari aktif dokter ini (mengambil dari state schedules)
                                    const doctorSchedules = schedules.filter(s => s.doctor_id === schedule.doctor_id);
                                    const activeDaysArray = [...new Set(doctorSchedules.map(s => s.day_of_week))].sort();

                                    return (
                                        <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-center font-medium text-gray-600">{index + 1}</td>
                                            <td className="px-6 py-4 font-bold text-gray-900">{schedule.doctor_name}</td>
                                            <td className="px-6 py-4 font-semibold text-gray-700">{schedule.specialization}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1 max-w-[160px]">
                                                    {activeDaysArray.map(d => (
                                                        <span key={d} className={`px-2 py-0.5 rounded-md text-xs border ${d === selectedDayOfWeek ? "bg-blue-100 text-[#5E81CC] border-blue-200 font-bold shadow-sm" : "bg-gray-50 text-gray-500 border-gray-100 font-medium"}`}>
                                                            {DAYS_OF_WEEK[d].substring(0, 3)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[#5E81CC] font-bold">
                                                {schedule.start_time.slice(0,5)} - {schedule.end_time.slice(0,5)} WIB
                                            </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-bold border bg-green-100 text-green-600 border-green-200">
                                                Tersedia
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700">
                                            {schedule.room_number || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <button onClick={() => openEditModal(schedule)} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
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
                                )})
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Tambah/Edit */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-900">
                                {isEditModalOpen ? "Edit Jadwal Dokter" : "Tambah Jadwal Dokter"}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <form id="scheduleForm" onSubmit={handleSave} className="space-y-5">
                                
                                {/* Dokter (hanya pas tambah) */}
                                {!isEditModalOpen && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Dokter</label>
                                        <select
                                            required
                                            value={formData.doctor_id}
                                            onChange={e => setFormData({...formData, doctor_id: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5E81CC] focus:border-transparent transition-all shadow-sm bg-white"
                                        >
                                            <option value="" disabled>Pilih Dokter...</option>
                                            {doctors.map(d => (
                                                <option key={d.id} value={d.id}>{d.full_name} - {d.specialization_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Hari */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Hari Praktik <span className="text-gray-400 font-normal ml-1">(Bisa pilih banyak)</span>
                                    </label>
                                    <div className="flex w-full rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        {UI_DAYS.map((day, idx) => {
                                            const isSelected = formData.selected_days.includes(day.value);
                                            const isLast = idx === UI_DAYS.length - 1;

                                            return (
                                                <button
                                                    key={day.value}
                                                    type="button"
                                                    onClick={() => toggleDay(day.value)}
                                                    className={`flex-1 py-3 text-xs font-bold transition-all border-y-0
                                                        ${isLast ? "" : "border-r"}
                                                        ${isSelected 
                                                            ? "bg-[#5E81CC] text-white border-[#5E81CC] z-10 relative" 
                                                            : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 z-0"}
                                                    `}
                                                >
                                                    {day.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Jam Mulai & Selesai */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Jam Mulai</label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.start_time}
                                            onChange={e => setFormData({...formData, start_time: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5E81CC] focus:border-transparent transition-all shadow-sm bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Jam Selesai</label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.end_time}
                                            onChange={e => setFormData({...formData, end_time: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5E81CC] focus:border-transparent transition-all shadow-sm bg-white"
                                        />
                                    </div>
                                </div>

                                {/* Durasi & Ruangan */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Durasi Slot (menit)</label>
                                        <input
                                            type="number"
                                            required
                                            min="5"
                                            step="5"
                                            value={formData.slot_duration_minutes}
                                            onChange={e => setFormData({...formData, slot_duration_minutes: parseInt(e.target.value)})}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5E81CC] focus:border-transparent transition-all shadow-sm bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nomor Ruangan</label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: 101"
                                            value={formData.room_number}
                                            onChange={e => setFormData({...formData, room_number: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5E81CC] focus:border-transparent transition-all shadow-sm bg-white"
                                        />
                                    </div>
                                </div>

                            </form>
                        </div>
                        
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                form="scheduleForm"
                                disabled={saving}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#5E81CC] hover:bg-[#4A6BB0] transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Menyimpan...
                                    </>
                                ) : "Simpan Jadwal"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
