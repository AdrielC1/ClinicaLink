import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        // 1. Ambil data dari body request frontend
        const { email, password, full_name, phone_number, role } = await request.json();

        // 2. Validasi Input Dasar
        if (!email || !password || !full_name || !role) {
            return NextResponse.json(
                { message: "Semua kolom utama wajib diisi!" },
                { status: 400 }
            );
        }

        // 3. Validasi Format Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { message: "Format email tidak valid!" },
                { status: 400 }
            );
        }

        // 4. Validasi Kriteria Password
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

        if (!passwordRegex.test(password)) {
            return NextResponse.json(
                { message: "Password ditolak! Harus minimal 8 karakter dan mengandung kombinasi huruf besar, kecil, angka, dan karakter unik." },
                { status: 400 }
            );
        }

        // 5. Cek Apakah Email Sudah Terdaftar di tabel USERS
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single();

        if (existingUser) {
            return NextResponse.json(
                { message: "Email sudah terdaftar! Silakan gunakan email lain." },
                { status: 400 }
            );
        }

        // 6. Proses Hashing Password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const roleMapping = {
            "pasien": "patient",
            "pasien": "patient", // Jaga-jaga jika dikirim lowercase
            "dokter": "doctor",
            "dokter": "doctor",
            "admin": "admin",
            "admin": "admin"
        };

        const cleanRole = role ? role.toLowerCase() : "";
        const dbRole = roleMapping[cleanRole];

        if (!dbRole) {
            return NextResponse.json(
                { message: "Role tidak valid! Data yang diterima: " + role },
                { status: 400 }
            );
        }

        // 7. Simpan Data Baru ke tabel USERS
        const { data: newUser, error: insertUserError } = await supabase
            .from('users')
            .insert([
                {
                    email: email.toLowerCase(),
                    password_hash: hashedPassword,
                    full_name: full_name,
                    role: dbRole
                }
            ])
            .select();

        if (insertUserError) {
            return NextResponse.json(
                { message: "Gagal menyimpan akun: " + insertUserError.message },
                { status: 500 }
            );
        }

        const newUserId = newUser[0].id; // Ambil UUID dari user yang baru dibuat

        // 8. Logika khusus untuk role "pasien"
        if (role.toLowerCase() === 'pasien') {
            const { error: insertPatientError } = await supabase
                .from('patients')
                .insert([
                    {
                        id: newUserId, // Gunakan 'id' sesuai relasi PK/FK di gambarmu
                        phone_number: phone_number
                    }
                ]);

            if (insertPatientError) {
                // Opsional: Rollback (hapus user) jika gagal masuk tabel patients
                await supabase.from('users').delete().eq('id', newUserId);

                return NextResponse.json(
                    { message: "Gagal menyimpan data nomor telepon pasien: " + insertPatientError.message },
                    { status: 500 }
                );
            }
        }

        // 9. Respon Berhasil
        return NextResponse.json(
            {
                message: "Registrasi akun berhasil!",
                user: {
                    id: newUserId,
                    email: newUser[0].email,
                    full_name: newUser[0].full_name,
                    role: newUser[0].role
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