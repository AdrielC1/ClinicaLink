import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ===================================================================
// GET: Ambil semua dokter (mendukung filter is_active & pencarian)
// ===================================================================
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const isActive = searchParams.get('is_active'); // 'true' | 'false'
        const search = searchParams.get('search');
        const includeDeleted = searchParams.get('include_deleted') === 'true';

        let query = supabase
            .from('doctors')
            .select(`
                id,
                is_active,
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

        // Filter berdasarkan status aktif
        if (isActive !== null && isActive !== undefined && isActive !== '') {
            query = query.eq('is_active', isActive === 'true');
        }

        const { data, error } = await query.order('created_at', { ascending: true, referencedTable: 'users' });
        if (error) {
            // Fallback jika kolom created_at tidak ada di users
            const { data: data2, error: error2 } = await supabase
                .from('doctors')
                .select(`id, is_active, phone_number, deleted_at, user:users(full_name, email, img_url), specialization:specializations(id, name)`)
                .is('deleted_at', !includeDeleted ? null : undefined);
            if (error2) return NextResponse.json({ message: error2.message }, { status: 500 });
            let result = data2.map(formatDoctor);
            if (search) {
                result = result.filter(d =>
                    d.full_name.toLowerCase().includes(search.toLowerCase()) ||
                    d.specialization_name.toLowerCase().includes(search.toLowerCase())
                );
            }
            return NextResponse.json({ message: "OK", data: result }, { status: 200 });
        }

        let result = data.map(formatDoctor);
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
        const { full_name, email, password, specialization_id, phone_number, is_active } = body;

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

        // Update field tambahan: phone_number dan is_active di tabel doctors
        if (phone_number || is_active !== undefined) {
            await supabase.from('doctors').update({
                ...(phone_number && { phone_number }),
                ...(is_active !== undefined && { is_active }),
            }).eq('id', userId);
        }

        return NextResponse.json({ message: "Dokter berhasil ditambahkan.", data: registerData.user }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ message: "Kesalahan server: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// PATCH: Edit data dokter (phone, is_active, specialization)
// ===================================================================
export async function PATCH(request) {
    try {
        const body = await request.json();
        const { id, specialization_id, phone_number, is_active, full_name } = body;

        if (!id) return NextResponse.json({ message: "ID dokter wajib ada." }, { status: 400 });

        // Update tabel doctors
        const { error: doctorError } = await supabase.from('doctors').update({
            ...(specialization_id !== undefined && { specialization_id }),
            ...(phone_number !== undefined && { phone_number }),
            ...(is_active !== undefined && { is_active }),
        }).eq('id', id);
        if (doctorError) return NextResponse.json({ message: doctorError.message }, { status: 500 });

        // Update nama di tabel users jika ada
        if (full_name) {
            const { error: userError } = await supabase.from('users').update({ full_name }).eq('id', id);
            if (userError) return NextResponse.json({ message: userError.message }, { status: 500 });
        }

        return NextResponse.json({ message: "Data dokter berhasil diperbarui." }, { status: 200 });

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
// Helper: Format satu baris dokter dari Supabase
// ===================================================================
function formatDoctor(doc) {
    return {
        id: doc.id,
        full_name: doc.user?.full_name || "Tanpa Nama",
        email: doc.user?.email || "",
        phone_number: doc.phone_number || "-",
        specialization_id: doc.specialization?.id || null,
        specialization_name: doc.specialization?.name || "Belum ada spesialisasi",
        is_active: doc.is_active,
        deleted_at: doc.deleted_at || null,
    };
}