import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Helper untuk menyatukan & menstandarkan format data dari tabel 'users' dan 'patients'
// Helper untuk menyatukan & menstandarkan format data (Tanpa Username)
function normalizeProfile(user, patient, doctor) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    img_url: user?.img_url || "",
    phone_number: doctor?.phone_number || patient?.phone_number || "",
    address: patient?.address || "",
    date_of_birth: patient?.date_of_birth || "",
  };
}

// Ambil data profil lengkap tanpa kolom username
async function getUserProfile(userId) {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, full_name, role, img_url")
    .eq("id", userId)
    .maybeSingle();

  if (userError) return { error: userError };
  if (!user) return { profile: null };

  // Hapus 'username' dari string select di bawah ini
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("phone_number, address, date_of_birth")
    .eq("id", userId)
    .maybeSingle();

  if (patientError) return { error: patientError };

  const { data: doctor, error: doctorError } = await supabase
    .from("doctors")
    .select("phone_number")
    .eq("id", userId)
    .maybeSingle();

  if (doctorError) return { error: doctorError };

  return { profile: normalizeProfile(user, patient, doctor) };
}

// =================================================================
// [GET] Ambil Data Profil Berdasarkan userId
// =================================================================
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { message: "User ID wajib dikirim." },
      { status: 400 }
    );
  }

  const { profile, error } = await getUserProfile(userId);

  if (error) {
    console.error("Detail Error Database di GET Profile:", error);
    return NextResponse.json(
      { message: "Gagal mengambil profil." },
      { status: 500 }
    );
  }

  if (!profile) {
    return NextResponse.json(
      { message: "Profil tidak ditemukan." },
      { status: 404 }
    );
  }

  return NextResponse.json({ profile });
}

// =================================================================
// [PATCH] Update Informasi Profil (Teks & URL Foto)
// =================================================================
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { 
      id, 
      full_name, 
      email, 
      phone_number, 
      address, 
      date_of_birth, 
      img_url 
    } = body;

    const cleanName = String(full_name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();

    // Validasi data wajib
    if (!id || !cleanName || !cleanEmail) {
      return NextResponse.json(
        { message: "Nama lengkap dan email wajib diisi." },
        { status: 400 }
      );
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { message: "Format email tidak valid." },
        { status: 400 }
      );
    }

    // Ambil data user saat ini untuk pengecekan role & email lama
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("id", id)
      .maybeSingle();

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        { message: "Profil tidak ditemukan atau gagal diperiksa." },
        { status: 404 }
      );
    }

    // PROSES UPDATE EMAIL (Jika user menginputkan email yang berbeda)
    if (currentUser.email !== cleanEmail) {
      // 1. Cek apakah email baru sudah dipakai orang lain di tabel publik
      const { data: duplicateEmail, error: duplicateError } = await supabase
        .from("users")
        .select("id")
        .eq("email", cleanEmail)
        .neq("id", id)
        .maybeSingle();

      if (duplicateError) {
        return NextResponse.json({ message: "Gagal memeriksa duplikasi email." }, { status: 500 });
      }

      if (duplicateEmail) {
        return NextResponse.json({ message: "Email sudah digunakan akun lain." }, { status: 400 });
      }

      // 2. Sinkronisasikan perubahan email ke Supabase Auth internal
      const { error: authError } = await supabase.auth.updateUser({ email: cleanEmail });
      if (authError) {
        return NextResponse.json(
          { message: `Gagal memperbarui email autentikasi: ${authError.message}` },
          { status: 400 }
        );
      }
    }

    // UPDATE DATA 1: Tabel public.users
    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        full_name: cleanName,
        email: cleanEmail,
        img_url: img_url || "",
      })
      .eq("id", id);

    if (updateUserError) {
      return NextResponse.json({ message: "Gagal menyimpan data akun mendasar." }, { status: 500 });
    }

    // UPDATE DATA 2: Tabel public.patients (Khusus jika rolenya patient)
    if (currentUser.role === "patient") {
      const { error: updatePatientError } = await supabase
        .from("patients")
        .upsert({
          id,
          phone_number: String(phone_number || "").trim(),
          address: String(address || "").trim(),
          date_of_birth: date_of_birth || null,
        }, { onConflict: "id" });

      if (updatePatientError) {
        return NextResponse.json({ message: "Gagal menyimpan detail data pasien." }, { status: 500 });
      }
    }

    // UPDATE DATA 3: Tabel public.doctors (Khusus jika rolenya doctor)
    if (currentUser.role === "doctor") {
      const { error: updateDoctorError } = await supabase
        .from("doctors")
        .upsert({
          id,
          phone_number: String(phone_number || "").trim(),
        }, { onConflict: "id" });

      if (updateDoctorError) {
        return NextResponse.json({ message: "Gagal menyimpan detail data dokter." }, { status: 500 });
      }
    }

    // Ambil data profil terbaru yang sudah digabung untuk dikembalikan ke frontend
    const { profile, error: reloadError } = await getUserProfile(id);

    if (reloadError || !profile) {
      return NextResponse.json(
        { message: "Profil tersimpan, tetapi gagal memuat ulang data terbaru." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Profil berhasil diperbarui.",
      profile,
    });

  } catch (error) {
  // BARIS INI AKAN MENAMPILKAN ERROR APAPUN KE TERMINAL DAN RESPOND BROWSER
  console.error("🔥 TERJADI CRASH PADA PATCH PROFILE:", error);
  
  return NextResponse.json(
    { 
      message: "Terjadi kesalahan internal server.", 
      error_detail: error.message || String(error) 
    }, 
    { status: 500 }
  );
}
}

// =================================================================
// [PUT] Khusus Fitur Ubah Password (Modal Gambar 3)
// =================================================================
export async function PUT(request) {
  try {
    const { password_baru } = await request.json();

    if (!password_baru || password_baru.length < 6) {
      return NextResponse.json(
        { message: "Password baru wajib diisi dan minimal 6 karakter." },
        { status: 400 }
      );
    }

    // Mengubah password pada data user yang sedang aktif di session lewat Supabase Auth
    const { error: authError } = await supabase.auth.updateUser({
      password: password_baru,
    });

    if (authError) {
      return NextResponse.json(
        { message: `Gagal memperbarui password: ${authError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Password berhasil diperbarui." },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { message: "Terjadi kesalahan internal server saat mengubah password." },
      { status: 500 }
    );
  }
}