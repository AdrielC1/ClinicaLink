import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ===================================================================
// GET: Ambil semua dokter (mendukung filter status & pencarian)
// ===================================================================
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const statusFilter = searchParams.get('status'); // 'active' | 'inactive'
        const search = searchParams.get('search');
        const includeDeleted = searchParams.get('include_deleted') === 'true';

        // Backward compat: support legacy is_active param
        const legacyIsActive = searchParams.get('is_active');

        let query = supabase
            .from('doctors')
            .select(`
                id,
                inactive_from,
                phone_number,
                deleted_at,
                user:users (
                    full_name,
                    email,
                    img_url
                ),
                specialization:specializations (
                    id,
                    name
                )
            `);

        // Default: jangan tampilkan yang sudah soft-deleted (kecuali diminta)
        if (!includeDeleted) {
            query = query.is('deleted_at', null);
        }

        if (id) {
            const { data, error } = await query.eq('id', id).maybeSingle();
            if (error) return NextResponse.json({ message: error.message }, { status: 500 });
            if (!data) return NextResponse.json({ message: "Dokter tidak ditemukan." }, { status: 404 });
            return NextResponse.json({ message: "OK", data: formatDoctor(data) }, { status: 200 });
        }

        const { data, error } = await query.order('id', { ascending: true });
        if (error) return NextResponse.json({ message: error.message }, { status: 500 });

        let result = (data || []).map(formatDoctor);

        // Filter berdasarkan status (active/inactive) menggunakan logika inactive_from
        const todayStr = new Date().toISOString().split('T')[0];

        if (statusFilter === 'active' || legacyIsActive === 'true') {
            // Aktif = inactive_from IS NULL OR inactive_from > today
            result = result.filter(d => !d.inactive_from || d.inactive_from > todayStr);
        } else if (statusFilter === 'inactive' || legacyIsActive === 'false') {
            // Nonaktif = inactive_from <= today
            result = result.filter(d => d.inactive_from && d.inactive_from <= todayStr);
        }

        // Filter berdasarkan pencarian nama/spesialisasi
        if (search) {
            result = result.filter(d =>
                d.full_name.toLowerCase().includes(search.toLowerCase()) ||
                d.specialization_name.toLowerCase().includes(search.toLowerCase())
            );
        }

        return NextResponse.json({ message: "OK", data: result }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Kesalahan server: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// POST: Tambah dokter baru (membuat user baru + doctors row)
// ===================================================================
export async function POST(request) {
    try {
        const body = await request.json();
        const { full_name, email, password, specialization_id, phone_number } = body;

        if (!full_name || !email || !password || !specialization_id) {
            return NextResponse.json({ message: "Nama, email, password, dan spesialisasi wajib diisi." }, { status: 400 });
        }

        // Gunakan endpoint /api/register yang sudah menangani trigger dengan benar
        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const registerRes = await fetch(`${baseUrl}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                full_name,
                role: 'doctor',
                specialization_id,
            }),
        });
        const registerData = await registerRes.json();

        if (!registerRes.ok) {
            return NextResponse.json({ message: registerData.message }, { status: registerRes.status });
        }

        const userId = registerData.user?.id;
        if (!userId) return NextResponse.json({ message: "Gagal mendapatkan ID user baru." }, { status: 500 });

        // Update field tambahan: phone_number di tabel doctors
        if (phone_number) {
            await supabase.from('doctors').update({ phone_number }).eq('id', userId);
        }

        return NextResponse.json({ message: "Dokter berhasil ditambahkan.", data: registerData.user }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ message: "Kesalahan server: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// PATCH: Edit data dokter (phone, inactive_from, specialization)
//        + Bulk Resolution: cancel affected appointments & notify
// ===================================================================
export async function PATCH(request) {
    try {
        const body = await request.json();
        const { id, specialization_id, phone_number, inactive_from, full_name, cancellation_reason } = body;

        if (!id) return NextResponse.json({ message: "ID dokter wajib ada." }, { status: 400 });

        // Build update object for doctors table
        const doctorUpdate = {};
        if (specialization_id !== undefined) doctorUpdate.specialization_id = specialization_id;
        if (phone_number !== undefined) doctorUpdate.phone_number = phone_number;
        if (inactive_from !== undefined) doctorUpdate.inactive_from = inactive_from; // null = re-activate

        if (Object.keys(doctorUpdate).length > 0) {
            const { error: doctorError } = await supabase.from('doctors').update(doctorUpdate).eq('id', id);
            if (doctorError) return NextResponse.json({ message: doctorError.message }, { status: 500 });
        }

        // Update nama di tabel users jika ada
        if (full_name) {
            const { error: userError } = await supabase.from('users').update({ full_name }).eq('id', id);
            if (userError) return NextResponse.json({ message: userError.message }, { status: 500 });
        }

        // ── Bulk Resolution: Jika inactive_from diset (bukan null) ──
        let cancelledCount = 0;
        if (inactive_from) {
            // Cari semua appointment 'Menunggu' yang terdampak (appointment_date >= inactive_from)
            const { data: affected, error: fetchErr } = await supabase
                .from('appointments')
                .select('id, patient_id, appointment_date, start_time, end_time')
                .eq('doctor_id', id)
                .eq('status', 'Menunggu')
                .gte('appointment_date', inactive_from);

            if (fetchErr) return NextResponse.json({ message: "Gagal fetch appointment terdampak: " + fetchErr.message }, { status: 500 });

            if (affected && affected.length > 0) {
                const reason = cancellation_reason || 'Dokter dinonaktifkan oleh Admin.';
                const affectedIds = affected.map(a => a.id);

                // Bulk update appointments → Dibatalkan
                const { error: cancelErr } = await supabase
                    .from('appointments')
                    .update({ status: 'Dibatalkan', cancellation_reason: reason })
                    .in('id', affectedIds);

                if (cancelErr) return NextResponse.json({ message: "Gagal membatalkan appointment: " + cancelErr.message }, { status: 500 });

                cancelledCount = affected.length;

                // Ambil nama dokter untuk pesan notifikasi
                const { data: docUser } = await supabase
                    .from('users')
                    .select('full_name')
                    .eq('id', id)
                    .maybeSingle();
                const doctorName = docUser?.full_name || 'Dokter';

                // Kirim notifikasi ke setiap pasien terdampak
                const notifications = affected.map(a => {
                    const dateLabel = formatDateLabel(a.appointment_date);
                    const timeLabel = a.start_time ? a.start_time.substring(0, 5).replace(':', '.') : '';
                    return {
                        user_id: a.patient_id,
                        title: 'Janji Temu Dibatalkan',
                        message: `Janji temu Anda dengan Dr. ${doctorName} pada ${dateLabel} pukul ${timeLabel} WIB telah dibatalkan. Alasan: ${reason}`,
                        is_read: false,
                    };
                });

                if (notifications.length > 0) {
                    await supabase.from('notifications').insert(notifications);
                }
            }
        }

        return NextResponse.json({
            message: cancelledCount > 0
                ? `Data dokter berhasil diperbarui. ${cancelledCount} janji temu telah dibatalkan.`
                : "Data dokter berhasil diperbarui.",
            cancelled_count: cancelledCount,
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Kesalahan server: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// DELETE: Soft-delete dokter (set deleted_at timestamp)
// ===================================================================
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ message: "ID dokter wajib ada." }, { status: 400 });

        const { error } = await supabase
            .from('doctors')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) return NextResponse.json({ message: error.message }, { status: 500 });

        return NextResponse.json({ message: "Dokter berhasil dihapus (soft delete)." }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Kesalahan server: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// Helpers
// ===================================================================
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

function formatDoctor(doc) {
    const todayStr = new Date().toISOString().split('T')[0];
    const inactiveFrom = doc.inactive_from || null;
    // Computed is_active for backward compat
    const isActive = !inactiveFrom || inactiveFrom > todayStr;

    return {
        id: doc.id,
        full_name: doc.user?.full_name || "Tanpa Nama",
        email: doc.user?.email || "",
        img_url: doc.user?.img_url || null,
        phone_number: doc.phone_number || "-",
        specialization_id: doc.specialization?.id || null,
        specialization_name: doc.specialization?.name || "Belum ada spesialisasi",
        inactive_from: inactiveFrom,
        is_active: isActive, // computed, backward compat
        deleted_at: doc.deleted_at || null,
    };
}