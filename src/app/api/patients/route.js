import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ===================================================================
// GET: Ambil semua pasien (mendukung filter pencarian & deleted)
// ===================================================================
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const search = searchParams.get('search');
        const filterState = searchParams.get('include_deleted'); // 'only' | 'true' | falsy

        let query = supabase
            .from('patients')
            .select(`
                id,
                phone_number,
                address,
                date_of_birth,
                user:users (
                    full_name,
                    email,
                    deleted_at
                )
            `);

        if (id) {
            const { data, error } = await query.eq('id', id).maybeSingle();
            if (error) return NextResponse.json({ message: error.message }, { status: 500 });
            if (!data) return NextResponse.json({ message: "Pasien tidak ditemukan." }, { status: 404 });
            return NextResponse.json({ message: "OK", data: formatPatient(data) }, { status: 200 });
        }

        const { data, error } = await query;
        if (error) return NextResponse.json({ message: error.message }, { status: 500 });

        let result = (data || []).map(formatPatient);

        // Filter soft delete
        if (filterState === 'only') {
            result = result.filter(p => p.deleted_at !== null);
        } else if (filterState !== 'true') {
            result = result.filter(p => p.deleted_at === null);
        }

        // Search
        if (search) {
            result = result.filter(p =>
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.email.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Fetch last consultation for each patient
        if (result.length > 0) {
            const patientIds = result.map(p => p.id);
            const { data: appointments, error: apptError } = await supabase
                .from('appointments')
                .select('patient_id, appointment_date')
                .in('patient_id', patientIds)
                .in('status', ['Selesai'])
                .order('appointment_date', { ascending: false });

            if (!apptError && appointments) {
                result = result.map(p => {
                    const lastAppt = appointments.find(a => a.patient_id === p.id);
                    return {
                        ...p,
                        lastConsultation: lastAppt ? formatDateLabel(lastAppt.appointment_date) : "-"
                    };
                });
            }
        }

        return NextResponse.json({ message: "OK", data: result }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Kesalahan server: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// POST: Tambah pasien baru (membuat user baru + patients row)
// ===================================================================
export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, phone } = body;

        if (!name || !email) {
            return NextResponse.json({ message: "Nama dan email wajib diisi." }, { status: 400 });
        }

        const password = "Pasien123!"; // Default password
        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const registerRes = await fetch(`${baseUrl}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                full_name: name,
                role: 'patient',
                phone_number: phone || '-'
            }),
        });
        const registerData = await registerRes.json();

        if (!registerRes.ok) {
            return NextResponse.json({ message: registerData.message }, { status: registerRes.status });
        }

        return NextResponse.json({ message: "Pasien berhasil ditambahkan.", data: registerData.user }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ message: "Kesalahan server: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// PATCH: Edit data pasien / Restore
// ===================================================================
export async function PATCH(request) {
    try {
        const body = await request.json();
        const { id, name, phone, action } = body;

        if (!id) return NextResponse.json({ message: "ID pasien wajib ada." }, { status: 400 });

        if (action === 'restore') {
            const { error } = await supabase.from('users').update({ deleted_at: null }).eq('id', id);
            if (error) return NextResponse.json({ message: error.message }, { status: 500 });
            return NextResponse.json({ message: "Data pasien berhasil dipulihkan." }, { status: 200 });
        }

        if (phone !== undefined) {
            const { error: pError } = await supabase.from('patients').update({ phone_number: phone }).eq('id', id);
            if (pError) return NextResponse.json({ message: pError.message }, { status: 500 });
        }

        if (name !== undefined) {
            const { error: uError } = await supabase.from('users').update({ full_name: name }).eq('id', id);
            if (uError) return NextResponse.json({ message: uError.message }, { status: 500 });
        }

        return NextResponse.json({ message: "Data pasien berhasil diperbarui." }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Kesalahan server: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// DELETE: Soft-delete pasien (set deleted_at timestamp)
// ===================================================================
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ message: "ID pasien wajib ada." }, { status: 400 });

        const { error } = await supabase
            .from('users')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) return NextResponse.json({ message: error.message }, { status: 500 });

        return NextResponse.json({ message: "Pasien berhasil dihapus (soft delete)." }, { status: 200 });

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

function formatPatient(p) {
    return {
        id: p.id,
        name: p.user?.full_name || "Tanpa Nama",
        email: p.user?.email || "",
        phone: p.phone_number || "-",
        deleted_at: p.user?.deleted_at || null,
        lastConsultation: "-" // will be filled in GET
    };
}
