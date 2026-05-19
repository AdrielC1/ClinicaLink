import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
    try {
        // 1. Ambil data dari body request frontend / Postman
        const { email, password, full_name, phone_number, role } = await request.json();
        const cleanEmail = String(email || "").trim().toLowerCase();
        const cleanRole = String(role || "").trim().toLowerCase();

        // 2. Validasi Input Dasar
        if (!cleanEmail || !password || !full_name || !cleanRole) {
            return NextResponse.json(
                { message: "Semua kolom utama wajib diisi!" },
                { status: 400 }
            );
        }

        // 3. Validasi Format Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            return NextResponse.json(
                { message: "Format email tidak valid!" },
                { status: 400 }
            );
        }

        // 4. Cek Apakah Email Sudah Terdaftar di tabel USERS
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('email')
            .eq('email', cleanEmail)
            .maybeSingle();

        if (checkError) {
            return NextResponse.json(
                { message: "Gagal memeriksa email: " + checkError.message },
                { status: 500 }
            );
        }

        if (existingUser) {
            return NextResponse.json(
                { message: "Email sudah terdaftar! Silakan gunakan email lain." },
                { status: 400 }
            );
        }

        // 5. Mapping Role (Mendukung pasien, dokter, dan admin untuk akselerasi MVP)
        const roleMapping = {
            "pasien": "patient",
            "dokter": "doctor",
            "admin": "admin"
        };

        const dbRole = roleMapping[cleanRole];

        if (!dbRole) {
            return NextResponse.json(
                { message: "Role tidak valid! Gunakan 'pasien', 'dokter', atau 'admin'." },
                { status: 400 }
            );
        }

        // 6. Simpan Data Baru ke Supabase Auth
        // Trigger database Anda otomatis akan menyalin data profile dasar ke tabel public.users
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: cleanEmail,
            password: password,
            options: {
                data: {
                    full_name: full_name,
                    role: dbRole
                }
            }
        });

        if (authError) {
            return NextResponse.json(
                { message: "Gagal menyimpan akun: " + authError.message },
                { status: 500 }
            );
        }

        if (!authData.user) {
            return NextResponse.json(
                { message: "Registrasi berhasil, tetapi menunggu verifikasi email." },
                { status: 201 }
            );
        }

        const newUserId = authData.user.id; // UUID dari auth.users

        // 7. Logika Kondisional Pengisian Tabel Relasional Spesifik berdasarkan Role
        if (cleanRole === 'pasien') {
            const { error: insertPatientError } = await supabase
                .from('patients')
                .insert([{ id: newUserId, phone_number: phone_number }]);

            if (insertPatientError) {
                await supabase.from('users').delete().eq('id', newUserId); // Rollback
                return NextResponse.json(
                    { message: "Gagal menyimpan data ke tabel patients: " + insertPatientError.message },
                    { status: 500 }
                );
            }
        }
        else if (cleanRole === 'dokter') {
            // Mempermudah penambahan data dokter ke tabel 'doctors' saat MVP jika diperlukan
            const { error: insertDoctorError } = await supabase
                .from('doctors')
                .insert([{
                    id: newUserId,
                    // Anda bisa menambahkan field default spesifik dokter di sini jika kolomnya NOT NULL di DB, 
                    // contoh: specialization: "Umum"
                }]);

            if (insertDoctorError) {
                await supabase.from('users').delete().eq('id', newUserId); // Rollback
                return NextResponse.json(
                    { message: "Gagal menyimpan data ke tabel doctors: " + insertDoctorError.message },
                    { status: 500 }
                );
            }
        }
        // Catatan: Jika role 'admin' tidak membutuhkan tabel relasional tambahan selain public.users, 
        // blok kondisionalnya bisa dilewati saja.

        // 8. Respon Berhasil
        return NextResponse.json(
            {
                message: `Registrasi akun dengan role ${cleanRole} berhasil!`,
                user: {
                    id: newUserId,
                    email: cleanEmail,
                    full_name: full_name,
                    role: dbRole
                }
            },
            { status: 201 }
        );

    } catch (error) {
        return NextResponse.json(
            { message: "Terjadi kesalahan internal server." },
            { status: 500 }
        );
    }
}