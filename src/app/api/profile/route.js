import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

// Ambil data profil lengkap dari database
async function getUserProfile(userId) {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, full_name, role, img_url")
    .eq("id", userId)
    .maybeSingle();

  if (userError) return { error: userError };
  if (!user) return { profile: null };

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
// [PATCH] Update Informasi Profil (Email Sinkron via Payload Aman)
// =================================================================
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { 
      id, 
      full_name, 
      email, // Kita tangkap lagi email dari frontend
      phone_number, 
      address, 
      date_of_birth, 
      img_url 
    } = body;

    const cleanName = String(full_name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();

    // Validasi data wajib dasar
    if (!id || !cleanName) {
      return NextResponse.json(
        { message: "Nama lengkap wajib diisi." },
        { status: 400 }
      );
    }

    // 1. Ambil data kondisi user saat ini di database
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", id)
      .maybeSingle();

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        { message: "Profil tidak ditemukan di database." },
        { status: 404 }
      );
    }

    // 2. Bangun Payload Dinamis untuk tabel public.users
    const updateUserPayload = {
      full_name: cleanName,
      img_url: String(img_url || "").trim() === "" ? null : String(img_url).trim()
    };

    // OTOMATIS: Update atau masukkan email ke tabel users jika dikirim dari frontend
    if (cleanEmail) {
      updateUserPayload.email = cleanEmail;
    }

    // Eksekusi update tabel public.users
    const { error: updateUserError } = await supabase
      .from("users")
      .update(updateUserPayload)
      .eq("id", id);

    if (updateUserError) {
      console.error("❌ Error saat update tabel 'users':", updateUserError);
      throw updateUserError;
    }

    // Helper sanitasi string kosong -> null
    const sanitizeValue = (val) => {
      if (val === undefined || val === null) return null;
      const clean = String(val).trim();
      return clean === "" ? null : clean;
    };

    // 3. Bangun Payload Dinamis untuk tabel Role ('patients' / 'doctors')
    if (currentUser.role === "patient") {
      const cleanPhone = sanitizeValue(phone_number);
      const cleanAddress = sanitizeValue(address);
      const cleanDob = sanitizeValue(date_of_birth);

      const { error: updatePatientError } = await supabase
        .from("patients")
        .upsert({
          id,
          phone_number: cleanPhone,
          address: cleanAddress,
          date_of_birth: cleanDob,
        }, { onConflict: "id" });

      if (updatePatientError) {
        console.error("❌ Error saat upsert tabel 'patients':", updatePatientError);
        throw updatePatientError;
      }
    }

    if (currentUser.role === "doctor") {
  const cleanPhone = sanitizeValue(phone_number);

  const { error: updateDoctorError } = await supabase
    .from("doctors")
    .update({
      phone_number: cleanPhone,
    })
    .eq("id", id);

  if (updateDoctorError) {
    console.error(
      "❌ Error saat update tabel 'doctors':",
      updateDoctorError
    );
    throw updateDoctorError;
  }
}

    // 4. Ambil ulang data profil terbaru
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
// [PUT] Khusus Fitur Ubah Password
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