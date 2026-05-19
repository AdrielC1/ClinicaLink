import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ===================================================================
// 1. GET: Mengambil Semua Data Dokter ATAU Filter Berdasarkan ID tertentu
// ===================================================================
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        // Menggunakan teknik Inner Join / Relation Join khas Supabase
        // Kita mengambil kolom 'id' dari doctors, lalu mengambil nama dari 'users', 
        // serta mengambil nama spesialisasi dari 'specializations'
        let query = supabase
            .from('doctors')
            .select(`
                id,
                is_active,
                user:users (
                    full_name,
                    email
                ),
                specialization:specializations (
                    id,
                    name
                )
            `);

        // Fitur A: Jika admin mencari dokter spesifik berdasarkan ID (?id=...)
        if (id) {
            const { data, error } = await query.eq('id', id).maybeSingle();

            if (error) {
                return NextResponse.json({ message: "Gagal mengambil data dokter: " + error.message }, { status: 500 });
            }
            if (!data) {
                return NextResponse.json({ message: "Dokter tidak ditemukan." }, { status: 404 });
            }

            // Merapikan struktur response data agar mudah dikonsumsi Frontend Dashboard Admin
            const formattedDoctor = {
                id: data.id,
                full_name: data.user?.full_name || "No Name",
                email: data.user?.email || "",
                specialization_id: data.specialization?.id || null,
                specialization_name: data.specialization?.name || "Belum ada spesialisasi",
                is_active: data.is_active
            };

            return NextResponse.json({ message: "Berhasil mengambil data dokter.", data: formattedDoctor }, { status: 200 });
        }

        // Fitur B: Default (Jika tidak ada parameter), ambil semua daftar dokter untuk tabel Kelola Dokter
        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ message: "Gagal mengambil daftar dokter: " + error.message }, { status: 500 });
        }

        // Merapikan struktur data array menjadi flat object agar mudah di-render di komponen Table UI
        const formattedDoctors = data.map(doc => ({
            id: doc.id,
            full_name: doc.user?.full_name || "No Name",
            email: doc.user?.email || "",
            specialization_id: doc.specialization?.id || null,
            specialization_name: doc.specialization?.name || "Belum ada spesialisasi",
            is_active: doc.is_active
        }));

        return NextResponse.json({
            message: "Berhasil mengambil semua data dokter.",
            data: formattedDoctors
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { message: "Terjadi kesalahan internal server: " + error.message },
            { status: 500 }
        );
    }
}