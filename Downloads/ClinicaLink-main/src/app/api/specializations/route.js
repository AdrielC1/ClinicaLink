import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ===================================================================
// 1. GET: Mengambil Semua Data ATAU Filter Berdasarkan ID / Name
// ===================================================================
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const name = searchParams.get('name');

        let query = supabase.from('specializations').select('*');

        // Fitur A: Ambil spesifik ID (?id=1)
        if (id) {
            const { data, error } = await query.eq('id', id).maybeSingle();

            if (error) return NextResponse.json({ message: error.message }, { status: 500 });
            if (!data) return NextResponse.json({ message: "Data tidak ditemukan." }, { status: 404 });

            return NextResponse.json({ message: "Berhasil mengambil data.", data }, { status: 200 });
        }

        // Fitur B: Filter berdasarkan Nama (?name=Anak)
        if (name) {
            const { data, error } = await query.ilike('name', `%${name.trim()}%`);

            if (error) return NextResponse.json({ message: error.message }, { status: 500 });

            return NextResponse.json({ message: "Berhasil memfilter data.", data }, { status: 200 });
        }

        // Fitur C: Ambil semua data
        const { data, error } = await query.order('id', { ascending: true });

        if (error) {
            return NextResponse.json({ message: error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: "Berhasil mengambil semua data spesialisasi.",
            data: data
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { message: "Terjadi kesalahan internal server." },
            { status: 500 }
        );
    }
}

// ===================================================================
// 2. POST: Menambahkan Spesialisasi Baru
// ===================================================================
export async function POST(request) {
    try {
        const { name, description } = await request.json();
        const cleanName = String(name || "").trim();
        const cleanDescription = String(description || "").trim();

        if (!cleanName) {
            return NextResponse.json(
                { message: "Nama spesialisasi (name) wajib diisi!" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('specializations')
            .insert([
                {
                    name: cleanName,
                    description: cleanDescription || null
                }
            ])
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { message: "Gagal menambahkan spesialisasi: " + error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: "Spesialisasi baru berhasil ditambahkan!",
            data: data
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json(
            { message: "Terjadi kesalahan internal server." },
            { status: 500 }
        );
    }
}

// ===================================================================
// 3. PUT: Memperbarui Data Spesialisasi berdasarkan ID
// ===================================================================
export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        // Pastikan parameter ?id=... dikirimkan
        if (!id) {
            return NextResponse.json(
                { message: "Query parameter 'id' wajib disertakan! Contoh: ?id=1" },
                { status: 400 }
            );
        }

        const { name, description } = await request.json();
        const updateData = {};

        // Validasi opsional: hanya update kolom yang dikirim di body request
        if (name !== undefined) updateData.name = String(name).trim();
        if (description !== undefined) updateData.description = String(description).trim();

        // Jika tidak ada data yang dikirim untuk diupdate
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { message: "Tidak ada data (name/description) yang dikirim untuk diperbarui." },
                { status: 400 }
            );
        }

        // Jalankan perintah update ke Supabase
        const { data, error } = await supabase
            .from('specializations')
            .update(updateData)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) {
            return NextResponse.json({ message: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json(
                { message: `Gagal memperbarui. Spesialisasi dengan ID ${id} tidak ditemukan.` },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Data spesialisasi berhasil diperbarui!",
            data: data
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { message: "Terjadi kesalahan internal server." },
            { status: 500 }
        );
    }
}

// ===================================================================
// 4. DELETE: Menghapus Data Spesialisasi berdasarkan ID
// ===================================================================
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { message: "Query parameter 'id' wajib disertakan! Contoh: ?id=1" },
                { status: 400 }
            );
        }

        // Eksekusi penghapusan dan kembalikan data yang dihapus untuk konfirmasi
        const { data, error } = await supabase
            .from('specializations')
            .delete()
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) {
            return NextResponse.json({ message: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json(
                { message: `Gagal menghapus. Spesialisasi dengan ID ${id} tidak ditemukan.` },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: `Spesialisasi dengan ID ${id} berhasil dihapus.`,
            deletedData: data
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { message: "Terjadi kesalahan internal server." },
            { status: 500 }
        );
    }
}