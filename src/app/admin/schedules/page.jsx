"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import ReactDOM from "react-dom";

const DAYS_OF_WEEK = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// Helper: Dapatkan teks info hari berlaku
function getNextMondayLabel() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilNextMonday);
    return nextMonday.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getThisSundayLabel() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + daysUntilSunday);
    return sunday.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatInactiveDate(effectiveUntilStr) {
    if (!effectiveUntilStr) return "";
    const date = new Date(effectiveUntilStr);
    date.setDate(date.getDate() + 1); // Senin
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getNextMondayISO() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilNextMonday);
    return nextMonday.toISOString().split('T')[0];
}

function getTodayISO() {
    return new Date().toISOString().split('T')[0];
}

// ─────────────────────────────────────────────────────────────
// Custom Time Picker — renders via Portal above all modals
// ─────────────────────────────────────────────────────────────
const HOURS = Array.from({ length: 17 }, (_, i) => (i + 6).toString().padStart(2, '0')); // 06–22
const MINUTES = ['00', '30'];

function TimePickerInput({ label, value, onChange, minTime = null, hasError = false }) {
    const [open, setOpen] = useState(false);
    const [tempHour, setTempHour] = useState('08');
    const [tempMinute, setTempMinute] = useState('00');
    const [popupStyle, setPopupStyle] = useState({});
    const triggerRef = useRef(null);
    const popupRef = useRef(null);

    // Sync temp values when value changes externally
    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':');
            setTempHour(h);
            setTempMinute(m);
        }
    }, [value]);

    // When popup opens, calculate its fixed position from button rect
    useEffect(() => {
        if (!open || !triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const popupWidth = 208; // w-52 = 13rem = 208px
        // Center horizontally under the button, clamp to viewport
        let left = rect.left + rect.width / 2 - popupWidth / 2;
        if (left + popupWidth > window.innerWidth - 8) left = window.innerWidth - popupWidth - 8;
        if (left < 8) left = 8;
        // Show above button if there's not enough space below
        const spaceBelow = window.innerHeight - rect.bottom;
        const popupHeight = 290;
        const top = spaceBelow >= popupHeight + 8
            ? rect.bottom + 8   // below
            : rect.top - popupHeight - 8; // above
        setPopupStyle({ position: 'fixed', top, left, width: popupWidth, zIndex: 9999 });
    }, [open]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target) &&
                popupRef.current && !popupRef.current.contains(e.target)
            ) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const availableHours = useMemo(() => {
        if (!minTime) return HOURS;
        const [minH] = minTime.split(':').map(Number);
        return HOURS.filter(h => parseInt(h) > minH);
    }, [minTime]);

    const availableMinutes = useMemo(() => {
        if (!minTime) return MINUTES;
        const [minH, minM] = minTime.split(':').map(Number);
        if (parseInt(tempHour) === minH) return MINUTES.filter(m => parseInt(m) > minM);
        return MINUTES;
    }, [minTime, tempHour]);

    const stepHour = (dir) => {
        const idx = availableHours.indexOf(tempHour);
        if (availableHours.length === 0) return;
        const next = availableHours[(idx + dir + availableHours.length) % availableHours.length];
        setTempHour(next);
        const [minH, minM] = minTime ? minTime.split(':').map(Number) : [0, -1];
        if (parseInt(next) === minH && parseInt(tempMinute) <= minM) setTempMinute('30');
    };

    const stepMinute = (dir) => {
        const mins = availableMinutes;
        if (mins.length === 0) return;
        const idx = mins.indexOf(tempMinute);
        const safeIdx = idx === -1 ? 0 : idx;
        setTempMinute(mins[(safeIdx + dir + mins.length) % mins.length]);
    };

    const handleConfirm = () => {
        const finalMinute = availableMinutes.includes(tempMinute) ? tempMinute : (availableMinutes[0] || '00');
        onChange(`${tempHour}:${finalMinute}`);
        setOpen(false);
    };

    const displayValue = value ? `${value} WIB` : `Pilih ${label}...`;

    const popup = open && (
        <div ref={popupRef} style={popupStyle}
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        >
            {/* Header */}
            <div className="bg-[#5E81CC] px-4 py-3 text-center">
                <p className="text-white/80 text-xs font-medium uppercase tracking-wider">{label}</p>
                <p className="text-white text-2xl font-bold tracking-widest mt-0.5">
                    {tempHour}<span className="animate-pulse mx-0.5">:</span>{tempMinute}
                </p>
            </div>

            {/* Spinners */}
            <div className="flex items-stretch divide-x divide-gray-100 px-2 py-3">
                {/* Hour column */}
                <div className="flex-1 flex flex-col items-center gap-1 pr-3">
                    <p className="text-xs text-gray-400 font-medium mb-1">Jam</p>
                    <button type="button" onClick={() => stepHour(-1)}
                        className="w-10 h-8 flex items-center justify-center rounded-lg text-[#5E81CC] hover:bg-[#5E81CC]/10 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7"/></svg>
                    </button>
                    <div className="w-14 h-12 flex items-center justify-center bg-[#5E81CC]/10 rounded-xl">
                        <span className="text-2xl font-bold text-[#5E81CC]">{tempHour}</span>
                    </div>
                    <button type="button" onClick={() => stepHour(1)}
                        className="w-10 h-8 flex items-center justify-center rounded-lg text-[#5E81CC] hover:bg-[#5E81CC]/10 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
                    </button>
                </div>

                {/* Minute column */}
                <div className="flex-1 flex flex-col items-center gap-1 pl-3">
                    <p className="text-xs text-gray-400 font-medium mb-1">Menit</p>
                    <button type="button" onClick={() => stepMinute(-1)}
                        className="w-10 h-8 flex items-center justify-center rounded-lg text-[#5E81CC] hover:bg-[#5E81CC]/10 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7"/></svg>
                    </button>
                    <div className="w-14 h-12 flex items-center justify-center bg-[#5E81CC]/10 rounded-xl">
                        <span className="text-2xl font-bold text-[#5E81CC]">{tempMinute}</span>
                    </div>
                    <button type="button" onClick={() => stepMinute(1)}
                        className="w-10 h-8 flex items-center justify-center rounded-lg text-[#5E81CC] hover:bg-[#5E81CC]/10 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-3 pb-3">
                <button type="button" onClick={() => setOpen(false)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors">
                    Batal
                </button>
                <button type="button" onClick={handleConfirm}
                    className="flex-1 py-2 rounded-lg text-xs font-bold text-white bg-[#5E81CC] hover:bg-[#4A6BB0] transition-colors shadow-sm">
                    Konfirmasi
                </button>
            </div>
        </div>
    );

    return (
        <div className="relative">
            {/* Trigger button */}
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen(v => !v)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all shadow-sm bg-white text-sm font-semibold
                    ${ hasError ? 'border-red-500 bg-red-50 text-red-600' : open ? 'border-[#5E81CC] ring-2 ring-[#5E81CC]/30' : 'border-gray-200 hover:border-gray-300'}
                    ${ value ? 'text-gray-800' : (hasError ? 'text-red-400' : 'text-gray-400')}`}
            >
                <div className="flex items-center gap-2">
                    <svg className={`w-4 h-4 ${hasError ? 'text-red-500' : 'text-[#5E81CC]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>{displayValue}</span>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                </svg>
            </button>

            {/* Portal: render popup into document.body to escape modal overflow clipping */}
            {typeof document !== 'undefined' && open && ReactDOM.createPortal(popup, document.body)}
        </div>
    );
}

export default function AdminSchedulesPage() {
    // --- State Management ---
    const [schedules, setSchedules] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // UI State
    const [activeTab, setActiveTab] = useState('currentWeek');
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterOpen, setFilterOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formApiError, setFormApiError] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    // Delete confirmation state
    const [scheduleToDelete, setScheduleToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Doctor search for dropdown
    const [doctorSearch, setDoctorSearch] = useState("");
    const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        doctor_id: "",
        selected_days: [1],
        start_time: "08:00",
        end_time: "16:00",
        slot_duration_minutes: 30,
        room_number: ""
    });

    // --- Fetch Data ---
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [schedulesRes, doctorsRes] = await Promise.all([
                fetch('/api/schedules'),
                fetch('/api/doctors?status=active')
            ]);

            const schedulesData = await schedulesRes.json();
            const doctorsData = await doctorsRes.json();

            if (schedulesRes.ok) setSchedules(schedulesData.data || []);
            else setError(schedulesData.message);

            if (doctorsRes.ok) setDoctors(doctorsData.data || []);

        } catch (err) {
            setError("Gagal menghubungi server.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Derived: Dokter yang TIDAK BISA ditambah jadwalnya ---
    // Dokter dianggap "sudah punya jadwal aktif" hanya jika ia punya jadwal yang
    // effective_until IS NULL (tidak akan expire) ATAU effective_until >= Senin minggu depan.
    // Dokter dengan jadwal yang expiring sebelum Senin depan = bisa ditambah jadwal baru.
    const doctorsWithPermanentSchedule = useMemo(() => {
        const nextMondayStr = (() => {
            const now = new Date();
            const dayOfWeek = now.getDay();
            const daysUntil = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
            const d = new Date(now);
            d.setDate(now.getDate() + daysUntil);
            return d.toISOString().split('T')[0];
        })();

        const blocked = new Set();
        schedules.forEach(s => {
            // Hanya block jika jadwal "permanen" (belum di-expire atau expire >= Senin depan)
            if (!s.effective_until || s.effective_until >= nextMondayStr) {
                blocked.add(s.doctor_id);
            }
        });
        return blocked;
    }, [schedules]);

    const availableDoctorsForAdd = useMemo(() => {
        return doctors.filter(d => !doctorsWithPermanentSchedule.has(d.id));
    }, [doctors, doctorsWithPermanentSchedule]);

    const filteredDoctorsForDropdown = useMemo(() => {
        if (!doctorSearch) return availableDoctorsForAdd;
        return availableDoctorsForAdd.filter(d =>
            d.full_name?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
            d.specialization_name?.toLowerCase().includes(doctorSearch.toLowerCase())
        );
    }, [availableDoctorsForAdd, doctorSearch]);

    // --- Handlers ---
    const handleSave = async (e) => {
        e.preventDefault();
        const isEdit = !!editingSchedule;

        let errors = {};
        if (!isEdit && !formData.doctor_id) errors.doctor_id = true;
        if (formData.selected_days.length === 0) errors.selected_days = true;
        if (!formData.start_time) errors.start_time = true;
        if (!formData.end_time) errors.end_time = true;
        if (!formData.slot_duration_minutes) errors.slot_duration_minutes = true;
        if (!formData.room_number) errors.room_number = true;

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            setFormApiError("Harap lengkapi semua data yang ditandai merah.");
            return;
        }

        setFormErrors({});
        setSaving(true);
        setFormApiError(null);
        const url = '/api/schedules';

        try {
            if (editingSchedule) {
                const doctorSchedules = schedules.filter(s => s.doctor_id === formData.doctor_id && !s.effective_until);
                const originalDays = doctorSchedules.map(s => s.day_of_week);

                const daysToKeep = [];
                const daysToAdd = [];
                const daysToDelete = [];

                // Categorize each selected day
                formData.selected_days.forEach(day => {
                    if (originalDays.includes(day)) {
                        const sched = doctorSchedules.find(s => s.day_of_week === day);
                        const timeChanged = sched.start_time.slice(0, 5) !== formData.start_time || 
                                            sched.end_time.slice(0, 5) !== formData.end_time ||
                                            (sched.room_number || "") !== formData.room_number ||
                                            sched.slot_duration_minutes !== Number(formData.slot_duration_minutes);
                        
                        if (timeChanged) {
                            // Time changed: soft-delete the old one, add a new one
                            daysToDelete.push(day);
                            daysToAdd.push(day);
                        } else {
                            // No structural changes, keep it
                            daysToKeep.push(day);
                        }
                    } else {
                        // Completely new day
                        daysToAdd.push(day);
                    }
                });

                // Check for days that were unchecked
                originalDays.forEach(day => {
                    if (!formData.selected_days.includes(day)) {
                        daysToDelete.push(day);
                    }
                });

                const deletePromises = [];
                // Process Deletes First
                daysToDelete.forEach(day => {
                    const sched = doctorSchedules.find(s => s.day_of_week === day);
                    if (sched) {
                        deletePromises.push(
                            fetch(`${url}?id=${sched.id}`, { method: 'DELETE' }).then(async r => {
                                const resData = await r.json();
                                if (!r.ok) throw new Error(`${DAYS_OF_WEEK[day]}: ${resData.message}`);
                                return resData;
                            })
                        );
                    }
                });
                
                // Wait for deletes to finish first to avoid conflict errors on POST
                await Promise.all(deletePromises);

                const savePromises = [];
                // Process Patches (No-op or minor updates)
                daysToKeep.forEach(day => {
                    const sched = doctorSchedules.find(s => s.day_of_week === day);
                    const body = { ...formData, day_of_week: day, id: sched.id };
                    savePromises.push(
                        fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(async r => {
                            const resData = await r.json();
                            if (!r.ok) throw new Error(`${DAYS_OF_WEEK[day]}: ${resData.message}`);
                            return resData;
                        })
                    );
                });

                // Process Adds
                daysToAdd.forEach(day => {
                    const body = { ...formData, day_of_week: day };
                    savePromises.push(
                        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(async r => {
                            const resData = await r.json();
                            if (!r.ok) throw new Error(`${DAYS_OF_WEEK[day]}: ${resData.message}`);
                            return resData;
                        })
                    );
                });

                await Promise.all(savePromises);
            } else {
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
            setFormApiError(err.message || "Terjadi kesalahan saat menyimpan jadwal.");
        } finally {
            setSaving(false);
        }
    };

    const openAddModal = () => {
        setFormData({
            doctor_id: "",
            selected_days: [1],
            start_time: "08:00",
            end_time: "16:00",
            slot_duration_minutes: 30,
            room_number: ""
        });
        setEditingSchedule(null);
        setDoctorSearch("");
        setIsDoctorDropdownOpen(false);
        setFormApiError(null);
        setFormErrors({});
        setIsAddModalOpen(true);
    };

    const openEditModal = (schedule) => {
        setEditingSchedule(schedule);
        const doctorSchedules = schedules.filter(s => s.doctor_id === schedule.doctor_id && !s.effective_until);
        const activeDays = doctorSchedules.map(s => s.day_of_week);
        setFormData({
            doctor_id: schedule.doctor_id,
            selected_days: activeDays,
            start_time: schedule.start_time.slice(0, 5),
            end_time: schedule.end_time.slice(0, 5),
            slot_duration_minutes: schedule.slot_duration_minutes,
            room_number: schedule.room_number || ""
        });
        setFormApiError(null);
        setFormErrors({});
        setIsEditModalOpen(true);
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setEditingSchedule(null);
        setFormApiError(null);
        setFormErrors({});
        setDoctorSearch("");
        setIsDoctorDropdownOpen(false);
    };

    const handleDeleteClick = (schedule) => {
        setScheduleToDelete(schedule);
    };

    const confirmDelete = async () => {
        if (!scheduleToDelete) return;
        setIsDeleting(true);
        try {
            // Hapus SEMUA jadwal aktif dokter ini (semua hari)
            const doctorSchedules = schedules.filter(s => s.doctor_id === scheduleToDelete.doctor_id);
            const deletePromises = doctorSchedules.map(s =>
                fetch(`/api/schedules?id=${s.id}`, { method: 'DELETE' }).then(async r => {
                    const d = await r.json();
                    if (!r.ok) throw new Error(d.message);
                    return d;
                })
            );
            await Promise.all(deletePromises);
            await fetchData();
            setScheduleToDelete(null);
        } catch (err) {
            alert(err.message || "Gagal menonaktifkan jadwal.");
        } finally {
            setIsDeleting(false);
        }
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

    // --- Derived Data: Separation of Time Tabs ---
    const todayStr = getTodayISO();
    const nextMondayStr = getNextMondayISO();

    const currentWeekSchedules = useMemo(() => {
        return schedules.filter(s => {
            const fromValid = !s.effective_from || s.effective_from <= todayStr;
            const untilValid = !s.effective_until || s.effective_until >= todayStr;
            return fromValid && untilValid;
        });
    }, [schedules]);

    const nextWeekSchedules = useMemo(() => {
        return schedules.filter(s => {
            if (s.doctor?.inactive_from && s.doctor.inactive_from <= nextMondayStr) return false;
            return !s.effective_until || s.effective_until >= nextMondayStr;
        });
    }, [schedules]);

    const getGroupedAndFiltered = useCallback((rawSchedules) => {
        const doctorsMap = new Map();
        rawSchedules.forEach(s => {
            if (!doctorsMap.has(s.doctor_id)) {
                doctorsMap.set(s.doctor_id, { ...s, allSchedules: [s] });
            } else {
                doctorsMap.get(s.doctor_id).allSchedules.push(s);
            }
        });

        const grouped = Array.from(doctorsMap.values())
            .map(s => {
                const isFullyDeactivated = s.allSchedules.every(sched => !!sched.effective_until);
                const isFullyNew = s.allSchedules.every(sched => sched.effective_from === nextMondayStr);
                return { ...s, isFullyDeactivated, isFullyNew };
            })
            .sort((a, b) => a.doctor_name.localeCompare(b.doctor_name, 'id'));
            
        return grouped.filter(s => {
            const matchSearch = !searchTerm ||
                s.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
            
            let matchStatus = true;
            if (filterStatus !== "all") {
                const spec = s.specialization || "Umum";
                matchStatus = spec === filterStatus;
            }
            return matchSearch && matchStatus;
        });
    }, [searchTerm, filterStatus]);

    const currentWeekFiltered = useMemo(() => getGroupedAndFiltered(currentWeekSchedules), [currentWeekSchedules, getGroupedAndFiltered]);
    const nextWeekFiltered = useMemo(() => getGroupedAndFiltered(nextWeekSchedules), [nextWeekSchedules, getGroupedAndFiltered]);

    const displayedSchedules = activeTab === 'currentWeek' ? currentWeekFiltered : nextWeekFiltered;

    const specializations = useMemo(() => {
        return [...new Set(doctors.map(d => d.specialization_name || 'Umum'))].sort();
    }, [doctors]);

    // --- Selected doctor label for dropdown ---
    const selectedDoctorLabel = useMemo(() => {
        const doc = doctors.find(d => d.id === formData.doctor_id);
        if (!doc) return null;
        return `${doc.full_name} — ${doc.specialization_name || 'Umum'}`;
    }, [doctors, formData.doctor_id]);

    return (
        <div className="font-sans text-slate-800 pb-6">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row justify-between items-stretch mb-6 gap-6">
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Kelola Jadwal</h1>
                        <p className="text-gray-500 text-sm mb-4">
                            Jadwal baru berlaku mulai Senin minggu depan. Jadwal yang dihapus akan berakhir pada hari Minggu ini.
                        </p>
                    </div>

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
                                <div className="absolute top-12 right-0 md:left-0 bg-white border border-gray-100 rounded-xl shadow-lg z-10 w-48 p-1 max-h-60 overflow-y-auto">
                                    <button
                                        onClick={() => { setFilterStatus("all"); setFilterOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${filterStatus === "all" ? "bg-[#E6EDFF] text-[#5E81CC]" : "text-gray-700 hover:bg-gray-50"}`}
                                    >
                                        Semua Spesialis
                                    </button>
                                    {specializations.map(spec => (
                                        <button
                                            key={spec}
                                            onClick={() => { setFilterStatus(spec); setFilterOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${filterStatus === spec ? "bg-[#E6EDFF] text-[#5E81CC]" : "text-gray-700 hover:bg-gray-50"}`}
                                        >
                                            {spec}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button onClick={openAddModal} className="flex items-center gap-2 px-5 py-2.5 bg-[#5E81CC] text-white font-semibold rounded-lg text-sm shadow-md hover:bg-[#4A6BB0] transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Tambah Jadwal
                        </button>
                    </div>
                </div>
            </div>

            {/* Time Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('currentWeek')}
                    className={`py-3 px-6 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'currentWeek' ? 'border-[#5E81CC] text-[#5E81CC]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Berlaku Minggu Ini
                </button>
                <button
                    onClick={() => setActiveTab('nextWeek')}
                    className={`py-3 px-6 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'nextWeek' ? 'border-[#5E81CC] text-[#5E81CC]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Mulai Senin Depan
                </button>
            </div>

            {/* Info Banner: Weekly Refresh */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div className="text-sm text-blue-700">
                    <span className="font-bold">Pembaruan Jadwal Mingguan:</span>
                    {" "}Jadwal baru yang ditambahkan hari ini akan aktif mulai <b>{getNextMondayLabel()}</b>. 
                    Jadwal yang dihapus akan berakhir pada <b>{getThisSundayLabel()}</b> — pasien tetap dapat melihat jadwal hingga hari tersebut.
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden pb-4">
                <div className="p-6 pb-4 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">{activeTab === 'currentWeek' ? "Jadwal Praktik Minggu Ini" : "Jadwal Praktik Senin Depan"}</h2>
                    <span className="text-sm text-gray-400">{displayedSchedules.length} dokter</span>
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
                            ) : displayedSchedules.length === 0 ? (
                                <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-500 font-medium">Tidak ada jadwal dokter untuk periode ini.</td></tr>
                            ) : (
                                displayedSchedules.map((schedule, index) => {
                                    return (
                                        <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-center font-medium text-gray-600">{index + 1}</td>
                                            <td className="px-6 py-4 font-bold text-gray-900">{schedule.doctor_name}</td>
                                            <td className="px-6 py-4 font-semibold text-gray-700">{schedule.specialization}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1 max-w-[160px]">
                                                    {[...schedule.allSchedules]
                                                        .sort((a, b) => a.day_of_week - b.day_of_week)
                                                        .map(sched => (
                                                        <span key={sched.day_of_week} className={`px-2 py-0.5 rounded-md text-xs border font-medium ${sched.effective_until && activeTab === 'currentWeek' ? 'bg-red-50 text-red-500 border-red-100 line-through' : 'bg-gray-50 text-gray-500 border-gray-100'}`} title={sched.effective_until && activeTab === 'currentWeek' ? 'Berakhir minggu ini' : ''}>
                                                            {DAYS_OF_WEEK[sched.day_of_week].substring(0, 3)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[#5E81CC] font-bold">
                                                {schedule.start_time.slice(0,5)} - {schedule.end_time.slice(0,5)} WIB
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {activeTab === 'currentWeek' ? (
                                                    schedule.isFullyDeactivated ? (
                                                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border bg-red-100 text-red-700 border-red-200">
                                                            Berakhir Minggu Ini
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]">
                                                            Aktif
                                                        </span>
                                                    )
                                                ) : (
                                                    schedule.isFullyNew ? (
                                                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border bg-blue-100 text-blue-700 border-blue-200">
                                                            Jadwal Baru
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]">
                                                            Tetap
                                                        </span>
                                                    )
                                                )}
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
                                                    <button onClick={() => handleDeleteClick(schedule)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Nonaktifkan Jadwal">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
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
                            {/* API Error Banner */}
                            {formApiError && (
                                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium flex items-start gap-2.5">
                                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                    <span>{formApiError}</span>
                                </div>
                            )}

                            {/* Info banner weekly refresh */}
                            {!isEditModalOpen && (
                                <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm font-medium flex items-start gap-2.5">
                                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                    <span>Jadwal baru akan mulai aktif pada <b>{getNextMondayLabel()}</b>.</span>
                                </div>
                            )}

                            <form id="scheduleForm" onSubmit={handleSave} className="space-y-5">

                                {/* Dokter — hanya saat tambah, dengan searchable dropdown */}
                                {!isEditModalOpen && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Pilih Dokter
                                            {availableDoctorsForAdd.length === 0 && (
                                                <span className="ml-2 text-xs text-amber-600 font-normal">— Semua dokter aktif sudah memiliki jadwal</span>
                                            )}
                                        </label>

                                        {/* Searchable Dropdown */}
                                        <div className="relative">
                                            <div
                                                className={`w-full px-4 py-3 rounded-xl border focus-within:ring-2 focus-within:ring-[#5E81CC] focus-within:border-transparent transition-all shadow-sm bg-white cursor-pointer flex items-center justify-between ${formErrors.doctor_id ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                                                onClick={() => setIsDoctorDropdownOpen(v => !v)}
                                            >
                                                <span className={selectedDoctorLabel ? "text-gray-900 text-sm font-medium" : "text-gray-400 text-sm"}>
                                                    {selectedDoctorLabel || "Pilih Dokter..."}
                                                </span>
                                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isDoctorDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                                                </svg>
                                            </div>

                                            {isDoctorDropdownOpen && (
                                                <div className="absolute z-30 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                                                    {/* Search inside dropdown */}
                                                    <div className="p-2 border-b border-gray-100">
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            placeholder="Cari nama dokter..."
                                                            value={doctorSearch}
                                                            onChange={e => setDoctorSearch(e.target.value)}
                                                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5E81CC]"
                                                            onClick={e => e.stopPropagation()}
                                                        />
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto">
                                                        {filteredDoctorsForDropdown.length === 0 ? (
                                                            <div className="px-4 py-3 text-sm text-gray-400 text-center">
                                                                {availableDoctorsForAdd.length === 0
                                                                    ? "Semua dokter sudah memiliki jadwal aktif."
                                                                    : "Tidak ada dokter yang cocok."}
                                                            </div>
                                                        ) : filteredDoctorsForDropdown.map(d => (
                                                            <button
                                                                key={d.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData(f => ({ ...f, doctor_id: d.id }));
                                                                    setIsDoctorDropdownOpen(false);
                                                                    setDoctorSearch("");
                                                                }}
                                                                className="w-full text-left px-4 py-3 text-sm hover:bg-[#5E81CC]/10 transition-colors flex flex-col"
                                                            >
                                                                <span className="font-semibold text-gray-900">{d.full_name}</span>
                                                                <span className="text-xs text-gray-500">{d.specialization_name || 'Umum'}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Hari Praktik */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Hari Praktik <span className="text-gray-400 font-normal ml-1">(Bisa pilih banyak)</span>
                                    </label>
                                    <div className={`flex w-full rounded-xl shadow-sm border overflow-hidden ${formErrors.selected_days ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'}`}>
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

                                {/* Jam — Custom Spinner Time Picker */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Jam Mulai</label>
                                        <TimePickerInput
                                            label="Jam Mulai"
                                            value={formData.start_time}
                                            onChange={val => setFormData(f => ({ ...f, start_time: val, end_time: f.end_time && f.end_time <= val ? '' : f.end_time }))}
                                            hasError={formErrors.start_time}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Jam Selesai</label>
                                        <TimePickerInput
                                            label="Jam Selesai"
                                            value={formData.end_time}
                                            onChange={val => setFormData(f => ({ ...f, end_time: val }))}
                                            minTime={formData.start_time}
                                            hasError={formErrors.end_time}
                                        />
                                    </div>
                                </div>

                                {/* Durasi & Ruangan */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Durasi Slot (menit)</label>
                                        <input type="number" min="5" step="5"
                                            value={formData.slot_duration_minutes}
                                            onChange={e => setFormData({...formData, slot_duration_minutes: parseInt(e.target.value)})}
                                            className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#5E81CC] focus:border-transparent transition-all shadow-sm bg-white ${formErrors.slot_duration_minutes ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nomor Ruangan</label>
                                        <input type="text" placeholder="Contoh: 101"
                                            value={formData.room_number}
                                            onChange={e => setFormData({...formData, room_number: e.target.value})}
                                            className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-[#5E81CC] focus:border-transparent transition-all shadow-sm bg-white ${formErrors.room_number ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} />
                                    </div>
                                </div>

                            </form>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                            <button type="button" onClick={closeModal} disabled={saving}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50">
                                Batal
                            </button>
                            <button type="submit" form="scheduleForm" disabled={saving}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#5E81CC] hover:bg-[#4A6BB0] transition-colors shadow-md disabled:opacity-50 flex items-center gap-2">
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

            {/* Modal Konfirmasi Hapus (Expire) Jadwal */}
            {scheduleToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white px-8 py-9 text-center shadow-xl border border-orange-100">
                        <h2 className="text-xl font-bold text-orange-600">Nonaktifkan Jadwal?</h2>
                        <div className="mx-auto mt-6 h-16 w-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                        <p className="mt-4 text-sm font-medium text-gray-600">
                            Jadwal <b>{scheduleToDelete.doctor_name}</b> akan dinonaktifkan pada akhir minggu ini (<b>{getThisSundayLabel()}</b>).
                            Pasien yang sudah memesan tetap dapat hadir hingga hari Minggu tersebut.
                        </p>
                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setScheduleToDelete(null)} disabled={isDeleting}
                                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50">
                                Batal
                            </button>
                            <button onClick={confirmDelete} disabled={isDeleting}
                                className="flex-1 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 flex items-center justify-center gap-2 disabled:opacity-50">
                                {isDeleting ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Memproses...
                                    </>
                                ) : "Ya, Nonaktifkan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
