import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const INDONESIAN_MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function formatDateLabel(rawDate) {
    if (!rawDate) return "-";
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return rawDate;
    return `${date.getDate()} ${INDONESIAN_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function formatTimeLabel(timeValue) {
    if (!timeValue) return "-";
    return timeValue.substring(0, 5).replace(":", ".");
}

async function createNotification(userId, title, message) {
    if (!userId || !title || !message) return null;

    const { data, error } = await supabase
        .from('notifications')
        .insert([{ user_id: userId, title, message, is_read: false }])
        .select()
        .single();

    if (error) {
        console.error("Gagal membuat notifikasi:", error.message || error);
        return null;
    }

    return data;
}

function normalizeDateFilter(dateValue) {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
}

// ===================================================================
// 1. GET: Ambil Semua Janji Temu / Filter by Patient / Filter by Schedule / ID
// ===================================================================
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const patientId = searchParams.get('patient_id');
        const scheduleId = searchParams.get('schedule_id');
        const doctorId = searchParams.get('doctor_id');
        const status = searchParams.get('status'); // Filter opsional: 'scheduled', 'completed', 'cancelled'
        const dateParam = searchParams.get('date');
        const todayParam = searchParams.get('today');

        // Base Query: Mengambil data janji temu beserta relasi mendalam ke profil Pasien dan Dokter
        let query = supabase
            .from('appointments')
            .select(`
                id,
                appointment_date,
                start_time,
                end_time,
                status,
                medical_notes,
                patient_complaints,
                patient_id,
                patient:patients (
                    phone_number,
                    date_of_birth,
                    user:users ( full_name, email )
                ),
                schedule_id,
                doctor_id,
                schedule:doctor_schedules (
                    day_of_week,
                    start_time,
                    end_time,
                    room_number,
                    doctor:doctors (
                        user:users ( full_name, img_url )
                    )
                )
            `);

        // Filter A: Berdasarkan ID Spesifik (Untuk modal detail)
        if (id) {
            query = query.eq('id', id).maybeSingle();
        }
        // Filter B: Berdasarkan ID Pasien (Untuk Dashboard Pasien)
        else if (patientId) {
            query = query.eq('patient_id', patientId).order('appointment_date', { ascending: false });
        }
        // Filter C: Berdasarkan ID Jadwal Dokter (Untuk Dashboard Dokter melihat antrian)
        else if (scheduleId) {
            query = query.eq('schedule_id', scheduleId).order('appointment_date', { ascending: true });
        }
        // Filter D: Berdasarkan ID Dokter (Untuk cek ketersediaan jadwal)
        else if (doctorId) {
            query = query.eq('doctor_id', doctorId).order('appointment_date', { ascending: false });
        }
        // Filter Default: Semua (Untuk Admin)
        else {
            query = query.order('appointment_date', { ascending: false });
        }

        // Tambahan Filter Status jika dikirimkan (misal: ?status=Menunggu)
        if (status) {
            query = query.eq('status', status);
        }

        const normalizedDate = todayParam === 'true'
            ? new Date().toISOString().slice(0, 10)
            : normalizeDateFilter(dateParam);

        if (normalizedDate) {
            query = query.eq('appointment_date', normalizedDate);
        }

        const { data, error } = await query;

        if (error) return NextResponse.json({ message: error.message }, { status: 500 });
        if (!data) return NextResponse.json({ message: "Data janji temu tidak ditemukan." }, { status: 404 });

        // Helper untuk merapikan (flatten) struktur data JSON balasan agar frontend mudah me-render UI
        const formatData = (item) => ({
            id: item.id,
            appointment_date: item.appointment_date,
            status: item.status,
            notes: item.medical_notes || "",
            complaints: item.patient_complaints || "",
            cancellation_reason: item.cancellation_reason || "",
            patient_id: item.patient_id,
            patient_name: item.patient?.user?.full_name || "Unknown Patient",
            patient_email: item.patient?.user?.email || "-",
            patient_phone: item.patient?.phone_number || "-",
            patient_dob: item.patient?.date_of_birth || "",
            schedule_id: item.schedule_id,
            doctor_id: item.doctor_id,
            doctor_name: item.schedule?.doctor?.user?.full_name || "Unknown Doctor",
            doctor_img: item.schedule?.doctor?.user?.img_url || null,
            room_number: item.schedule?.room_number || "-",
            start_time: item.start_time,
            end_time: item.end_time,
            schedule_time: item.start_time
                ? `${item.start_time.substring(0, 5)} - ${item.end_time?.substring(0, 5) || ""}`
                : `${item.schedule?.start_time?.substring(0, 5) || ""} - ${item.schedule?.end_time?.substring(0, 5) || ""}`
        });

        const formattedData = Array.isArray(data) ? data.map(formatData) : formatData(data);

        return NextResponse.json({ message: "Berhasil mengambil data janji temu.", data: formattedData }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Internal server error: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// 2. POST: Membuat Janji Temu Baru (Mencari doctor_id & Jam Otomatis)
// ===================================================================
export async function POST(request) {
    try {
        const { patient_id, schedule_id, appointment_date, complaints, start_time, end_time } = await request.json();

        // 1. Validasi kolom wajib dari request JSON
        if (!patient_id || !schedule_id || !appointment_date) {
            return NextResponse.json(
                { message: "patient_id, schedule_id, dan appointment_date wajib diisi!" },
                { status: 400 }
            );
        }

        // 2. Query ke doctor_schedules untuk ambil doctor_id, start_time, end_time, dan data dokter (termasuk inactive_from)
        const { data: scheduleData, error: scheduleError } = await supabase
            .from('doctor_schedules')
            .select(`doctor_id, start_time, end_time, room_number, doctor:doctors ( inactive_from, user:users ( full_name ) )`)
            .eq('id', schedule_id)
            .maybeSingle();

        if (scheduleError || !scheduleData) {
            return NextResponse.json(
                { message: "Gagal memproses janji temu: ID Jadwal (schedule_id) tidak valid atau tidak ditemukan." },
                { status: 400 }
            );
        }

        // 2.5 Validasi terhadap tanggal nonaktif (inactive_from)
        if (scheduleData.doctor?.inactive_from) {
            const inactiveDateStr = new Date(scheduleData.doctor.inactive_from).toISOString().split('T')[0];
            const appointmentDateStr = appointment_date.split('T')[0];
            if (appointmentDateStr >= inactiveDateStr) {
                return NextResponse.json(
                    { message: `Dokter tidak tersedia mulai tanggal ${new Date(inactiveDateStr).toLocaleDateString('id-ID')}` },
                    { status: 400 }
                );
            }
        }

        // Ekstrak data otomatis dari jadwal dokter (gunakan waktu slot spesifik jika ada, kalau tidak fallback ke jadwal)
        const autoDoctorId = scheduleData.doctor_id;
        const autoStartTime = start_time || scheduleData.start_time;
        const autoEndTime = end_time || scheduleData.end_time;

        // 3. Lakukan insert ke tabel appointments dengan parameter lengkap sesuai not-null constraint database
        const { data, error } = await supabase
            .from('appointments')
            .insert([{
                patient_id,
                doctor_id: autoDoctorId,         // ⬅️ Otomatis
                schedule_id: Number(schedule_id),
                appointment_date,
                start_time: autoStartTime,       // ⬅️ Sesuai slot yang dipilih
                end_time: autoEndTime,           // ⬅️ Sesuai slot yang dipilih
                status: 'Menunggu',
                patient_complaints: complaints || null
            }])
            .select()
            .single();

        if (error) return NextResponse.json({ message: "Gagal membuat janji temu: " + error.message }, { status: 500 });

        const doctorName = scheduleData?.doctor?.user?.full_name || "dokter";
        await createNotification(
            patient_id,
            "Pembuatan Janji Temu Berhasil",
            `Janji temu Anda dengan Dr. ${doctorName} pada ${formatDateLabel(appointment_date)} pukul ${formatTimeLabel(autoStartTime)} berhasil dibuat.`
        );

        return NextResponse.json({ message: "Janji temu berhasil dibuat!", data }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ message: "Internal server error: " + error.message }, { status: 500 });
    }
}

/// ===================================================================
// 3. PUT: Update Status atau Catatan Janji Temu
// ===================================================================
export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: "Query parameter 'id' wajib disertakan!" }, { status: 400 });
        }

        const body = await request.json();
        const updateData = {};

        const { data: existingAppointment, error: existingError } = await supabase
            .from('appointments')
            .select('id, appointment_date, start_time, end_time, status, patient_id')
            .eq('id', id)
            .maybeSingle();

        if (existingError) return NextResponse.json({ message: existingError.message }, { status: 500 });
        if (!existingAppointment) return NextResponse.json({ message: "Janji temu tidak ditemukan." }, { status: 404 });

        // Menerima perubahan status/notes/jadwal yang dapat memicu notifikasi
        if (body.status !== undefined) updateData.status = body.status;
        if (body.notes !== undefined) updateData.medical_notes = body.notes;
        if (body.appointment_date !== undefined) updateData.appointment_date = body.appointment_date;
        if (body.start_time !== undefined) updateData.start_time = body.start_time;
        if (body.end_time !== undefined) updateData.end_time = body.end_time;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: "Tidak ada data perubahan yang dikirim." }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('appointments')
            .update(updateData)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) return NextResponse.json({ message: error.message }, { status: 500 });
        if (!data) return NextResponse.json({ message: "Janji temu tidak ditemukan." }, { status: 404 });

        const patientId = existingAppointment.patient_id;
        const newAppointmentDate = updateData.appointment_date ?? existingAppointment.appointment_date;
        const newStartTime = updateData.start_time ?? existingAppointment.start_time;
        const newEndTime = updateData.end_time ?? existingAppointment.end_time;
        const newStatus = updateData.status ?? existingAppointment.status;

        if (updateData.status !== undefined && updateData.status !== existingAppointment.status) {
            let title = "Status Janji Temu Diperbarui";
            let message = `Status janji temu Anda berubah menjadi ${newStatus}.`;

            if (newStatus === "Dibatalkan") {
                title = "Janji Temu Dibatalkan";
                message = `Janji temu Anda pada ${formatDateLabel(newAppointmentDate)} pukul ${formatTimeLabel(newStartTime)} telah dibatalkan.`;
            } else if (newStatus === "Selesai") {
                title = "Konsultasi Selesai";
                message = `Konsultasi Anda pada ${formatDateLabel(newAppointmentDate)} pukul ${formatTimeLabel(newStartTime)} telah selesai.`;
            }

            await createNotification(patientId, title, message);
        } else if (
            (updateData.appointment_date !== undefined && updateData.appointment_date !== existingAppointment.appointment_date) ||
            (updateData.start_time !== undefined && updateData.start_time !== existingAppointment.start_time) ||
            (updateData.end_time !== undefined && updateData.end_time !== existingAppointment.end_time)
        ) {
            await createNotification(
                patientId,
                "Jadwal Janji Temu Diperbarui",
                `Jadwal janji temu Anda telah diperbarui menjadi ${formatDateLabel(newAppointmentDate)} pukul ${formatTimeLabel(newStartTime)} WIB.`
            );
        }

        return NextResponse.json({ message: "Data janji temu berhasil diperbarui!", data }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Internal server error: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// 4. DELETE: Hapus/Batalkan Janji Temu
// ===================================================================
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: "Query parameter 'id' wajib disertakan! Contoh: ?id=1" }, { status: 400 });
        }

        const { data: existingAppointment, error: existingError } = await supabase
            .from('appointments')
            .select('id, appointment_date, start_time, patient_id, status')
            .eq('id', id)
            .maybeSingle();

        if (existingError) return NextResponse.json({ message: existingError.message }, { status: 500 });
        if (!existingAppointment) return NextResponse.json({ message: "Janji temu tidak ditemukan." }, { status: 404 });

        if (existingAppointment.status === 'Dibatalkan') {
            return NextResponse.json({ message: "Janji temu sudah dibatalkan.", data: existingAppointment }, { status: 200 });
        }

        const { data, error } = await supabase
            .from('appointments')
            .update({ status: 'Dibatalkan' })
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) return NextResponse.json({ message: error.message }, { status: 500 });
        if (!data) return NextResponse.json({ message: "Gagal membatalkan. Janji temu tidak ditemukan." }, { status: 404 });

        await createNotification(
            existingAppointment.patient_id,
            "Janji Temu Dibatalkan",
            `Janji temu Anda pada ${formatDateLabel(existingAppointment.appointment_date)} pukul ${formatTimeLabel(existingAppointment.start_time)} telah dibatalkan.`
        );

        return NextResponse.json({ message: `Janji temu dengan ID ${id} berhasil dibatalkan.`, data }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Internal server error: " + error.message }, { status: 500 });
    }
}