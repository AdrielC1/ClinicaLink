import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ===================================================================
// GET: Ambil semua akun (mendukung filter pencarian & deleted)
// ===================================================================
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const search = searchParams.get('search');
        const filterState = searchParams.get('include_deleted'); // 'only' | 'true' | falsy

        let query = supabase
            .from('users')
            .select(`
                id,
                full_name,
                email,
                role,
                deleted_at,
                patients(phone_number)
            `)
            .neq('role', 'doctor');

        if (id) {
            const { data, error } = await query.eq('id', id).maybeSingle();
            if (error) return NextResponse.json({ message: error.message }, { status: 500 });
            if (!data) return NextResponse.json({ message: "Akun tidak ditemukan." }, { status: 404 });
            return NextResponse.json({ message: "OK", data: formatAccount(data) }, { status: 200 });
        }

        const { data, error } = await query;
        if (error) return NextResponse.json({ message: error.message }, { status: 500 });

        let result = (data || []).map(formatAccount);

        // Filter soft delete
        if (filterState === 'only') {
            result = result.filter(a => a.deleted_at !== null);
        } else if (filterState !== 'true') {
            result = result.filter(a => a.deleted_at === null);
        }

        // Search
        if (search) {
            result = result.filter(a =>
                a.name.toLowerCase().includes(search.toLowerCase()) ||
                a.email.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Sort alphabetically by name to keep order stable
        result.sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({ message: "OK", data: result }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Kesalahan server: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// POST: Tambah akun baru (Pasien atau Admin)
// ===================================================================
export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, phone, role, password } = body;

        if (!name || !email || !role || !password) {
            return NextResponse.json({ message: "Semua kolom utama wajib diisi." }, { status: 400 });
        }

        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('host');
        const baseUrl = request.nextUrl?.origin || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
        const registerRes = await fetch(`${baseUrl}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                full_name: name,
                role: role,
                phone_number: phone || '-'
            }),
        });
        const registerData = await registerRes.json();

        if (!registerRes.ok) {
            return NextResponse.json({ message: registerData.message }, { status: registerRes.status });
        }

        return NextResponse.json({ message: "Akun berhasil ditambahkan.", data: registerData.user }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ message: "Kesalahan server: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// PATCH: Edit data akun / Restore
// ===================================================================
export async function PATCH(request) {
    try {
        const body = await request.json();
        const { id, name, phone, action, role } = body;

        if (!id) return NextResponse.json({ message: "ID akun wajib ada." }, { status: 400 });

        if (action === 'restore') {
            const { error } = await supabase.from('users').update({ deleted_at: null }).eq('id', id);
            if (error) return NextResponse.json({ message: error.message }, { status: 500 });
            return NextResponse.json({ message: "Akun berhasil dipulihkan." }, { status: 200 });
        }

        if (phone !== undefined && role === 'patient') {
            const { error: pError } = await supabase.from('patients').update({ phone_number: phone }).eq('id', id);
            // Ignored error if the user wasn't a patient.
        }

        if (name !== undefined) {
            const { error: uError } = await supabase.from('users').update({ full_name: name }).eq('id', id);
            if (uError) return NextResponse.json({ message: uError.message }, { status: 500 });
        }

        return NextResponse.json({ message: "Data akun berhasil diperbarui." }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Kesalahan server: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// DELETE: Soft-delete atau hard-delete akun
// ===================================================================
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const isHardDelete = searchParams.get('hard') === 'true';

        if (!id) return NextResponse.json({ message: "ID akun wajib ada." }, { status: 400 });

        if (isHardDelete) {
            // Kita coba hapus dari patients dan doctors (jika ada) dulu
            await supabase.from('patients').delete().eq('id', id);
            await supabase.from('doctors').delete().eq('id', id);
            
            const { error } = await supabase.from('users').delete().eq('id', id);
            if (error) return NextResponse.json({ message: error.message }, { status: 500 });
            return NextResponse.json({ message: "Akun berhasil dihapus permanen." }, { status: 200 });
        } else {
            // Soft delete
            const { error } = await supabase
                .from('users')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) return NextResponse.json({ message: error.message }, { status: 500 });
            return NextResponse.json({ message: "Akun berhasil dihapus (soft delete)." }, { status: 200 });
        }

    } catch (error) {
        return NextResponse.json({ message: "Kesalahan server: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// Helpers
// ===================================================================

function formatAccount(u) {
    let phone = "-";
    if (u.patients && Array.isArray(u.patients) && u.patients.length > 0) {
        phone = u.patients[0].phone_number;
    } else if (u.patients && u.patients.phone_number) {
        phone = u.patients.phone_number;
    }

    return {
        id: u.id,
        name: u.full_name || "Tanpa Nama",
        email: u.email || "",
        phone: phone || "-",
        role: u.role || "patient",
        deleted_at: u.deleted_at || null,
    };
}
