import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ── Helper: Dapatkan tanggal Minggu akhir minggu ini (23:59:59 UTC) ──
function getThisSundayEnd() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Minggu
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + daysUntilSunday);
    sunday.setHours(23, 59, 59, 999);
    return sunday.toISOString().split('T')[0]; // Return date string YYYY-MM-DD
}

// ── Helper: Dapatkan tanggal Senin minggu depan ──
function getNextMonday() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Minggu, 1 = Senin, ...
    const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilNextMonday);
    return nextMonday.toISOString().split('T')[0]; // Return YYYY-MM-DD
}

// ── Helper: Format jadwal untuk respons ──
const formatSchedule = (s) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const inactiveFrom = s.doctor?.inactive_from || null;

    // Status dokter: 'active' | 'scheduled' | 'inactive'
    // - active: tidak ada inactive_from
    // - scheduled: inactive_from ada dan > hari ini (masih aktif tapi akan nonaktif)
    // - inactive: inactive_from <= hari ini
    let doctor_status = 'active';
    if (inactiveFrom) {
        if (inactiveFrom <= todayStr) {
            doctor_status = 'inactive';
        } else {
            doctor_status = 'scheduled'; // Akan nonaktif di masa depan
        }
    }

    return {
        id: s.id,
        doctor_id: s.doctor_id,
        doctor_name: s.doctor?.user?.full_name || "Unknown",
        specialization: s.doctor?.specialization?.name || "Unknown",
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        slot_duration_minutes: s.slot_duration_minutes,
        room_number: s.room_number,
        effective_from: s.effective_from,
        effective_until: s.effective_until,
        inactive_from: inactiveFrom,
        doctor_status, // 'active' | 'scheduled' | 'inactive'
    };
};

// ===================================================================
// GET: Ambil semua jadwal aktif (effective_until IS NULL or > today)
// ===================================================================
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const dayOfWeek = searchParams.get('day_of_week');
        const doctorId = searchParams.get('doctor_id');
        const todayStr = new Date().toISOString().split('T')[0];

        let query = supabase
            .from('doctor_schedules')
            .select(`
                id, day_of_week, start_time, end_time, slot_duration_minutes, room_number, doctor_id,
                effective_from, effective_until,
                doctor:doctors!inner (
                    id,
                    inactive_from,
                    deleted_at,
                    user:users!inner ( full_name ),
                    specialization:specializations ( name )
                )
            `)
            // Hanya dari dokter yang belum di-soft-delete
            .is('doctor.deleted_at', null);

        if (dayOfWeek !== null && dayOfWeek !== undefined) {
            query = query.eq('day_of_week', parseInt(dayOfWeek));
        }
        if (doctorId) {
            query = query.eq('doctor_id', doctorId);
        }

        const { data, error } = await query.order('doctor_id', { ascending: true });

        if (error) {
            console.error("Supabase Error:", error);
            return NextResponse.json({ message: "Gagal mengambil jadwal: " + error.message }, { status: 500 });
        }

        // Sort berdasarkan nama dokter secara alphabetical (A-Z)
        const formattedData = data
            .map(formatSchedule)
            .sort((a, b) => a.doctor_name.localeCompare(b.doctor_name, 'id'));

        return NextResponse.json({ message: "OK", data: formattedData }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Kesalahan server: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// POST: Tambah jadwal baru — effective_from = Senin minggu depan
// ===================================================================
export async function POST(request) {
    try {
        const body = await request.json();
        const { doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, room_number } = body;

        if (!doctor_id || day_of_week === undefined || !start_time || !end_time) {
            return NextResponse.json({ message: "Kolom dokter, hari, jam mulai, dan jam selesai wajib diisi." }, { status: 400 });
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const nextMonday = getNextMonday();

        // Cek konflik: jadwal aktif yang bentrok di hari dan jam yang sama
        const { data: existingSchedules, error: checkError } = await supabase
            .from('doctor_schedules')
            .select('id, start_time, end_time, effective_until')
            .eq('doctor_id', doctor_id)
            .eq('day_of_week', day_of_week)
            .or(`effective_until.is.null,effective_until.gte.${todayStr}`);

        if (checkError) return NextResponse.json({ message: "Gagal memverifikasi konflik jadwal: " + checkError.message }, { status: 500 });

        // Cek konflik jam DAN rentang tanggal:
        // Jika jadwal lama sudah akan expire (effective_until < nextMonday = Senin minggu depan),
        // berarti tidak ada tumpang-tindih nyata — jadwal lama berakhir Minggu, baru mulai Senin.
        const isConflict = existingSchedules.some(schedule => {
            // Cek apakah rentang tanggal tumpang-tindih:
            // Jadwal baru mulai nextMonday. Jika jadwal lama berakhir sebelum nextMonday, tidak konflik.
            const existingEnd = schedule.effective_until;
            if (existingEnd && existingEnd < nextMonday) return false; // Sudah expire sebelum jadwal baru aktif

            // Cek konflik jam
            return (start_time >= schedule.start_time && start_time < schedule.end_time) ||
                   (end_time > schedule.start_time && end_time <= schedule.end_time) ||
                   (start_time <= schedule.start_time && end_time >= schedule.end_time);
        });

        if (isConflict) {
            return NextResponse.json({ message: "Dokter sudah memiliki jadwal aktif yang bentrok di waktu tersebut." }, { status: 400 });
        }

        // Insert dengan effective_from = Senin minggu depan, effective_until = NULL
        const { data, error } = await supabase.from('doctor_schedules').insert({
            doctor_id,
            day_of_week,
            start_time,
            end_time,
            slot_duration_minutes: slot_duration_minutes || 30,
            room_number: room_number || null,
            effective_from: nextMonday,
            effective_until: null,
        }).select().single();

        if (error) return NextResponse.json({ message: "Gagal menyimpan jadwal: " + error.message }, { status: 500 });

        return NextResponse.json({
            message: `Jadwal berhasil ditambahkan. Akan aktif mulai Senin, ${nextMonday}.`,
            data
        }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Kesalahan server: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// PATCH: Edit data jadwal (jam, durasi, ruangan)
// ===================================================================
export async function PATCH(request) {
    try {
        const body = await request.json();
        const { id, day_of_week, start_time, end_time, slot_duration_minutes, room_number, doctor_id } = body;

        if (!id) {
            return NextResponse.json({ message: "ID jadwal diperlukan." }, { status: 400 });
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const checkDoctorId = doctor_id || (await supabase.from('doctor_schedules').select('doctor_id').eq('id', id).single()).data?.doctor_id;

        if (checkDoctorId && day_of_week !== undefined && start_time && end_time) {
            const nextMonday = getNextMonday();
            const { data: existingSchedules, error: checkError } = await supabase
                .from('doctor_schedules')
                .select('id, start_time, end_time, effective_until')
                .eq('doctor_id', checkDoctorId)
                .eq('day_of_week', day_of_week)
                .or(`effective_until.is.null,effective_until.gte.${todayStr}`)
                .neq('id', id);

            if (checkError) return NextResponse.json({ message: "Gagal memverifikasi konflik jadwal: " + checkError.message }, { status: 500 });

            const isConflict = existingSchedules.some(schedule => {
                const existingEnd = schedule.effective_until;
                if (existingEnd && existingEnd < nextMonday) return false;

                return (start_time >= schedule.start_time && start_time < schedule.end_time) ||
                       (end_time > schedule.start_time && end_time <= schedule.end_time) ||
                       (start_time <= schedule.start_time && end_time >= schedule.end_time);
            });

            if (isConflict) {
                return NextResponse.json({ message: "Dokter sudah memiliki jadwal yang bentrok di waktu tersebut." }, { status: 400 });
            }
        }

        const { data, error } = await supabase.from('doctor_schedules').update({
            ...(day_of_week !== undefined && { day_of_week }),
            ...(start_time && { start_time }),
            ...(end_time && { end_time }),
            ...(slot_duration_minutes && { slot_duration_minutes }),
            ...(room_number !== undefined && { room_number }),
        }).eq('id', id).select().maybeSingle();

        if (error) return NextResponse.json({ message: "Gagal memperbarui jadwal: " + error.message }, { status: 500 });
        if (!data) return NextResponse.json({ message: "Gagal memperbarui. Jadwal tidak ditemukan." }, { status: 404 });

        return NextResponse.json({ message: "Jadwal berhasil diperbarui.", data }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Kesalahan server: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// DELETE: Expire jadwal — set effective_until = hari Minggu minggu ini
// Jadwal TIDAK langsung terhapus, tetap aktif hingga hari Minggu.
// ===================================================================
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ message: "ID jadwal diperlukan." }, { status: 400 });

        const thisSunday = getThisSundayEnd();

        // Update effective_until = akhir Minggu minggu ini
        const { data, error } = await supabase
            .from('doctor_schedules')
            .update({ effective_until: thisSunday })
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) {
            return NextResponse.json({ message: "Gagal menonaktifkan jadwal: " + error.message }, { status: 500 });
        }
        if (!data) {
            return NextResponse.json({ message: "Gagal menonaktifkan. Jadwal tidak ditemukan." }, { status: 404 });
        }

        return NextResponse.json({
            message: `Jadwal dinonaktifkan. Akan berhenti pada akhir hari Minggu ini (${thisSunday}).`
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Kesalahan server: " + error.message }, { status: 500 });
    }
}
