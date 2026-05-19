import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
    try {
        // 1. Ambil data dari body request frontend / Postman
        const { email, password, full_name, phone_number, role, specialization_id } = await request.json();
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

        // 5. Mapping Role (Menggunakan standar bahasa Inggris sesuai kesepakatan desain)
        const roleMapping = {
            "patient": "patient",
            "doctor": "doctor",
            "admin": "admin"
        };

        const dbRole = roleMapping[cleanRole];

        if (!dbRole) {
            return NextResponse.json(
                { message: "Role tidak valid! Gunakan 'patient', 'doctor', atau 'admin'." },
                { status: 400 }
            );
        }

        // Validasi awal khusus untuk doctor
        if (cleanRole === 'doctor' && !specialization_id) {
            return NextResponse.json(
                { message: "Kolom 'specialization_id' wajib diisi untuk role doctor!" },
                { status: 400 }
            );
        }

        // 6. Simpan Data Baru ke Supabase Auth
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
                { message: "Gagal menyimpan akun auth: " + authError.message },
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

        // Jeda singkat (100ms) menjamin trigger sinkronisasi profil publik selesai terlebih dahulu
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 7. Logika Kondisional Pengisian Tabel Relasional Spesifik berdasarkan Role
        if (cleanRole === 'patient') { // <--- Ubah dari 'pasien' ke 'patient'
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
        else if (cleanRole === 'doctor') { // <--- Ubah dari 'dokter' ke 'doctor'
            const { error: insertDoctorError } = await supabase
                .from('doctors')
                .insert([{
                    id: newUserId,
                    specialization_id: Number(specialization_id)
                }]);

            if (insertDoctorError) {
                await supabase.from('users').delete().eq('id', newUserId); // Rollback
                return NextResponse.json(
                    { message: "Gagal menyimpan data ke tabel doctors: " + insertDoctorError.message },
                    { status: 500 }
                );
            }
        }

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
        console.error("Error internal registrasi:", error);
        return NextResponse.json(
            { message: "Terjadi kesalahan internal server: " + error.message },
            { status: 500 }
        );
    }
}