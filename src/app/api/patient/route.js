import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ===================================================================
// 1. GET: Mengambil Semua Data Pasien ATAU Detail Pasien by ID
// ===================================================================
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        // Menggabungkan tabel patients dengan induknya (users) untuk mengambil nama dan email
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
                    created_at,
                    deleted_at,
                    role
                )
            `)
            

        // Fitur A: Ambil detail 1 pasien spesifik (?id=UUID) untuk halaman rekam medis/profil
        if (id) {
            const { data, error } = await query.eq('id', id).maybeSingle();

            if (error) return NextResponse.json({ message: "Gagal mengambil data pasien: " + error.message }, { status: 500 });
            if (!data) return NextResponse.json({ message: "Pasien tidak ditemukan." }, { status: 404 });

            const formattedPatient = {
                id: data.id,
                full_name: data.user?.full_name || "No Name",
                email: data.user?.email || "",
                phone_number: data.phone_number || "",
                address: data.address || "",
                date_of_birth: data.date_of_birth || null
            };

            return NextResponse.json({ message: "Berhasil mengambil detail pasien.", data: formattedPatient }, { status: 200 });
        }

        // Fitur B: Ambil semua data pasien untuk Tabel Kelola Pasien di Dashboard Admin
        const { data, error } = await query;

        if (error) return NextResponse.json({ message: "Gagal mengambil daftar pasien: " + error.message }, { status: 500 });

        const formattedPatients = data.map(patient => ({
            id: patient.id,
            full_name: patient.user?.full_name || "No Name",
            email: patient.user?.email || "",
            phone_number: patient.phone_number || "",
            address: patient.address || "",
            date_of_birth: patient.date_of_birth || null
        }));

        return NextResponse.json({ message: "Berhasil mengambil semua data pasien.", data: formattedPatients }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Internal server error: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// 2. POST: Tambah Pasien Baru Secara Manual (Backup / Pengisian oleh Admin)
// ===================================================================
export async function POST(request) {
    try {
        const { id, phone_number, address, date_of_birth } = await request.json();

        // Validasi kolom primary key wajib (id/UUID harus berasal dari users yang valid)
        if (!id) {
            return NextResponse.json({ message: "Kolom 'id' (UUID pengguna dari tabel users) wajib disertakan!" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('patients')
            .insert([
                {
                    id,
                    phone_number: phone_number || null,
                    address: address || null,
                    date_of_birth: date_of_birth || null
                }
            ])
            .select()
            .single();

        if (error) return NextResponse.json({ message: "Gagal menyimpan data pasien: " + error.message }, { status: 500 });

        return NextResponse.json({ message: "Data pasien berhasil ditambahkan ke tabel relasional!", data }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ message: "Internal server error: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// 3. PUT: Memperbarui Profil/Biodata Pasien (?id=UUID)
// ===================================================================
export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: "Query parameter 'id' (UUID) pasien wajib disertakan! Contoh: ?id=uuid-pasien" }, { status: 400 });
        }

        const body = await request.json();
        const updateData = {};

        // Melacak field data rekam medis apa saja yang dikirim dari form profil frontend
        if (body.phone_number !== undefined) updateData.phone_number = body.phone_number;
        if (body.address !== undefined) updateData.address = body.address;
        if (body.date_of_birth !== undefined) updateData.date_of_birth = body.date_of_birth;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: "Tidak ada data perubahan biodata yang dikirim." }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('patients')
            .update(updateData)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) return NextResponse.json({ message: error.message }, { status: 500 });
        if (!data) return NextResponse.json({ message: "Gagal memperbarui. Data pasien tidak ditemukan." }, { status: 404 });

        return NextResponse.json({ message: "Biodata profil pasien berhasil diperbarui!", data }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Internal server error: " + error.message }, { status: 500 });
    }
}

// ===================================================================
// 4. DELETE: Menghapus Data Pasien (?id=UUID)
// ===================================================================
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: "Query parameter 'id' (UUID) pasien wajib disertakan!" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('patients')
            .delete()
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) return NextResponse.json({ message: error.message }, { status: 500 });
        if (!data) return NextResponse.json({ message: "Gagal menghapus. Data pasien tidak ditemukan." }, { status: 404 });

        return NextResponse.json({ message: `Data pasien dengan ID ${id} berhasil dihapus dari tabel relasional.`, deletedData: data }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Internal server error: " + error.message }, { status: 500 });
    }
}