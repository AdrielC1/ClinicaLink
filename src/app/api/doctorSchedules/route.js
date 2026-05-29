import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ===================================================================
// 1. GET: Ambil Semua Jadwal / Jadwal Per Dokter / Jadwal Spesifik by ID
// ===================================================================
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const doctorId = searchParams.get('doctor_id');

        // Base query dengan Join ke tabel users lewat doctors untuk mengambil nama dokter
        let query = supabase
            .from('doctor_schedules')
            .select(`
                id,
                day_of_week,
                start_time,
                end_time,
                slot_duration_minutes,
                room_number,
                doctor_id,
                doctor:doctors (
                    user:users (
                        full_name
                    )
                ),
                effective_from,
                effective_until
            `)
            .is('deleted_at', null); // Hanya ambil yang belum di-soft delete

        // Fitur A: Get Detail Jadwal Spesifik (?id=1) untuk Form Edit
        if (id) {
            const { data, error } = await query.eq('id', id).maybeSingle();

            if (error) return NextResponse.json({ message: error.message }, { status: 500 });
            if (!data) return NextResponse.json({ message: "Jadwal tidak ditemukan." }, { status: 404 });

            const formatted = {
                id: data.id,
                doctor_id: data.doctor_id,
                doctor_name: data.doctor?.user?.full_name || "No Name",
                day_of_week: data.day_of_week,
                start_time: data.start_time,
                end_time: data.end_time,
                slot_duration_minutes: data.slot_duration_minutes,
                room_number: data.room_number,
                effective_from: data.effective_from,
                effective_until: data.effective_until
            };

            return NextResponse.json({ message: "Berhasil mengambil detail jadwal.", data: formatted }, { status: 200 });
        }

        // Fitur B: Get Semua Jadwal milik 1 Dokter Spesifik (?doctor_id=uuid)
        if (doctorId) {
            const { data, error } = await query.eq('doctor_id', doctorId).order('day_of_week', { ascending: true });

            if (error) return NextResponse.json({ message: error.message }, { status: 500 });

            const formatted = data.map(item => ({
                id: item.id,
                doctor_id: item.doctor_id,
                doctor_name: item.doctor?.user?.full_name || "No Name",
                day_of_week: item.day_of_week,
                start_time: item.start_time,
                end_time: item.end_time,
                slot_duration_minutes: item.slot_duration_minutes,
                room_number: item.room_number,
                effective_from: item.effective_from,
                effective_until: item.effective_until
            }));

            return NextResponse.json({ message: "Berhasil mengambil jadwal dokter.", data: formatted }, { status: 200 });
        }

        // Fitur C: Default Admin (Ambil semua jadwal yang ada di klinik untuk master table)
        const { data, error } = await query.order('id', { ascending: true });

        if (error) return NextResponse.json({ message: error.message }, { status: 500 });

        const formattedAll = data.map(item => ({
            id: item.id,
            doctor_id: item.doctor_id,
            doctor_name: item.doctor?.user?.full_name || "No Name",
            day_of_week: item.day_of_week,
            start_time: item.start_time,
            end_time: item.end_time,
            slot_duration_minutes: item.slot_duration_minutes,
            room_number: item.room_number,
            effective_from: item.effective_from,
            effective_until: item.effective_until
        }));

        return NextResponse.json({ message: "Berhasil mengambil semua jadwal.", data: formattedAll }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Internal server error: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// 2. POST: Tambah Jadwal Praktik Baru (Mendukung Single & Bulk Insert)
// ===================================================================
export async function POST(request) {
    try {
        const body = await request.json();

        // Memastikan payload diubah menjadi array jika yang masuk berupa single object
        const isBulk = Array.isArray(body);
        const schedulesArray = isBulk ? body : [body];

        // Validasi awal untuk setiap data di dalam array
        for (const schedule of schedulesArray) {
            const { doctor_id, day_of_week, start_time, end_time, slot_duration_minutes } = schedule;
            if (!doctor_id || !day_of_week || !start_time || !end_time || !slot_duration_minutes) {
                return NextResponse.json(
                    { message: "Ada data yang tidak lengkap! Kolom doctor_id, day_of_week, start_time, end_time, dan slot_duration_minutes wajib diisi." },
                    { status: 400 }
                );
            }
        }

        // Siapkan data untuk dikirim ke Supabase
        const dataToInsert = schedulesArray.map(item => ({
            doctor_id: item.doctor_id,
            day_of_week: Number(item.day_of_week),
            start_time: item.start_time,
            end_time: item.end_time,
            slot_duration_minutes: Number(item.slot_duration_minutes),
            room_number: item.room_number || null
        }));

        // Lakukan insert bulk ke Supabase
        const { data, error } = await supabase
            .from('doctor_schedules')
            .insert(dataToInsert)
            .select();

        if (error) {
            return NextResponse.json({ message: "Gagal menyimpan jadwal bulk: " + error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: `${data.length} jadwal praktik dokter berhasil ditambahkan!`,
            data
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ message: "Internal server error: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// 3. PUT: Update Jadwal Praktik Berdasarkan Parameter ID (?id=1)
// ===================================================================
export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: "Query parameter 'id' jadwal wajib disertakan! Contoh: ?id=1" }, { status: 400 });
        }

        const body = await request.json();
        const updateData = {};

        // Mapping field dinamis jika dikirim di body request Postman/Frontend
        if (body.day_of_week !== undefined) updateData.day_of_week = Number(body.day_of_week);
        if (body.start_time !== undefined) updateData.start_time = body.start_time;
        if (body.end_time !== undefined) updateData.end_time = body.end_time;
        if (body.slot_duration_minutes !== undefined) updateData.slot_duration_minutes = Number(body.slot_duration_minutes);
        if (body.room_number !== undefined) updateData.room_number = body.room_number;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: "Tidak ada data perubahan yang dikirim." }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('doctor_schedules')
            .update(updateData)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) return NextResponse.json({ message: error.message }, { status: 500 });
        if (!data) return NextResponse.json({ message: "Gagal memperbarui. Jadwal tidak ditemukan." }, { status: 404 });

        return NextResponse.json({ message: "Jadwal praktik berhasil diperbarui!", data }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Internal server error: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// 4. DELETE: Hapus Jadwal Praktik Berdasarkan Parameter ID (?id=1)
// ===================================================================
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: "Query parameter 'id' jadwal wajib disertakan! Contoh: ?id=1" }, { status: 400 });
        }

        // Pilihan MVP: Menggunakan Soft Delete agar data appointment lama tidak rusak
        const { data, error } = await supabase
            .from('doctor_schedules')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .maybeSingle();

        /* Catatan: Jika Anda ingin Hard Delete (hapus permanen dari table), ganti blok kode di atas dengan:
        const { data, error } = await supabase.from('doctor_schedules').delete().eq('id', id).select().maybeSingle();
        */

        if (error) return NextResponse.json({ message: error.message }, { status: 500 });
        if (!data) return NextResponse.json({ message: "Gagal menghapus. Jadwal tidak ditemukan." }, { status: 404 });

        return NextResponse.json({ message: `Jadwal dengan ID ${id} berhasil dinonaktifkan/dihapus.`, deletedData: data }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Internal server error: " + error.message }, { status: 500 });
    }
}