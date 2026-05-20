import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper function to format schedule data
const formatSchedule = (s) => ({
    id: s.id,
    doctor_id: s.doctor_id,
    doctor_name: s.doctor?.user?.full_name || "Unknown",
    specialization: s.doctor?.specialization?.name || "Unknown",
    day_of_week: s.day_of_week,
    start_time: s.start_time,
    end_time: s.end_time,
    slot_duration_minutes: s.slot_duration_minutes,
    room_number: s.room_number,
    is_active: s.doctor?.is_active
});

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const dayOfWeek = searchParams.get('day_of_week'); // 0-6
        const doctorId = searchParams.get('doctor_id');

        let query = supabase
            .from('doctor_schedules')
            .select(`
                id, day_of_week, start_time, end_time, slot_duration_minutes, room_number, doctor_id,
                doctor:doctors!inner (
                    id,
                    is_active,
                    user:users!inner ( full_name ),
                    specialization:specializations ( name )
                )
            `)
            .is('deleted_at', null); // Filter out soft-deleted schedules

        if (dayOfWeek !== null && dayOfWeek !== undefined) {
            query = query.eq('day_of_week', parseInt(dayOfWeek));
        }

        if (doctorId) {
            query = query.eq('doctor_id', doctorId);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Supabase Error:", error);
            return NextResponse.json({ message: "Gagal mengambil jadwal: " + error.message }, { status: 500 });
        }

        const formattedData = data.map(formatSchedule);

        return NextResponse.json({ message: "OK", data: formattedData }, { status: 200 });
    } catch (error) {
        console.error("Server Error:", error);
        return NextResponse.json({ message: "Kesalahan server: " + error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, room_number } = body;

        if (!doctor_id || day_of_week === undefined || !start_time || !end_time) {
            return NextResponse.json({ message: "Kolom dokter, hari, jam mulai, dan jam selesai wajib diisi." }, { status: 400 });
        }

        // Cek konflik: apakah dokter sudah punya jadwal di hari yang sama dengan irisan jam yang sama (yang aktif)
        const { data: existingSchedules, error: checkError } = await supabase
            .from('doctor_schedules')
            .select('id, start_time, end_time')
            .eq('doctor_id', doctor_id)
            .eq('day_of_week', day_of_week)
            .is('deleted_at', null);
            
        if (checkError) return NextResponse.json({ message: "Gagal memverifikasi konflik jadwal: " + checkError.message }, { status: 500 });

        const isConflict = existingSchedules.some(schedule => {
            return (start_time >= schedule.start_time && start_time < schedule.end_time) ||
                   (end_time > schedule.start_time && end_time <= schedule.end_time) ||
                   (start_time <= schedule.start_time && end_time >= schedule.end_time);
        });

        if (isConflict) {
            return NextResponse.json({ message: "Dokter sudah memiliki jadwal yang bentrok di waktu tersebut." }, { status: 400 });
        }

        const { data, error } = await supabase.from('doctor_schedules').insert({
            doctor_id,
            day_of_week,
            start_time,
            end_time,
            slot_duration_minutes: slot_duration_minutes || 30,
            room_number: room_number || null,
        }).select().single();

        if (error) return NextResponse.json({ message: "Gagal menyimpan jadwal: " + error.message }, { status: 500 });

        return NextResponse.json({ message: "Jadwal berhasil ditambahkan.", data }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Kesalahan server: " + error.message }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const body = await request.json();
        const { id, day_of_week, start_time, end_time, slot_duration_minutes, room_number, doctor_id } = body;

        if (!id) {
            return NextResponse.json({ message: "ID jadwal diperlukan." }, { status: 400 });
        }

        // Cek konflik jika mengubah waktu atau hari
        const checkDoctorId = doctor_id || (await supabase.from('doctor_schedules').select('doctor_id').eq('id', id).single()).data?.doctor_id;
        
        if (checkDoctorId && day_of_week !== undefined && start_time && end_time) {
            const { data: existingSchedules, error: checkError } = await supabase
                .from('doctor_schedules')
                .select('id, start_time, end_time')
                .eq('doctor_id', checkDoctorId)
                .eq('day_of_week', day_of_week)
                .is('deleted_at', null)
                .neq('id', id); // exclude current row
                
            if (checkError) return NextResponse.json({ message: "Gagal memverifikasi konflik jadwal: " + checkError.message }, { status: 500 });

            const isConflict = existingSchedules.some(schedule => {
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
        if (!data) return NextResponse.json({ message: "Gagal memperbarui. Jadwal mungkin sudah terhapus." }, { status: 404 });

        return NextResponse.json({ message: "Jadwal berhasil diperbarui.", data }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Kesalahan server: " + error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ message: "ID jadwal diperlukan." }, { status: 400 });

        // Menggunakan Soft Delete agar reservasi pasien yang lama tidak rusak/terhapus
        const { data, error } = await supabase
            .from('doctor_schedules')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) {
            return NextResponse.json({ message: "Gagal menghapus jadwal: " + error.message }, { status: 500 });
        }
        if (!data) {
            return NextResponse.json({ message: "Gagal menghapus. Jadwal tidak ditemukan." }, { status: 404 });
        }

        return NextResponse.json({ message: "Jadwal berhasil dinonaktifkan." }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Kesalahan server: " + error.message }, { status: 500 });
    }
}
