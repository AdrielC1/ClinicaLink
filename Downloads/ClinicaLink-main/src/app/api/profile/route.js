import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function normalizeProfile(user, patient) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    phone_number: patient?.phone_number || "",
  };
}

async function getUserProfile(userId) {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id,email,full_name,role")
    .eq("id", userId)
    .maybeSingle();

  if (userError) {
    return { error: userError };
  }

  if (!user) {
    return { profile: null };
  }

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("phone_number")
    .eq("id", userId)
    .maybeSingle();

  if (patientError) {
    return { error: patientError };
  }

  return { profile: normalizeProfile(user, patient) };
}

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

export async function PATCH(request) {
  try {
    const { id, full_name, email, phone_number } = await request.json();
    const cleanName = String(full_name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPhone = String(phone_number || "").trim();

    if (!id || !cleanName || !cleanEmail) {
      return NextResponse.json(
        { message: "Nama lengkap dan email wajib diisi." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { message: "Format email tidak valid." },
        { status: 400 }
      );
    }

    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("id,email,role")
      .eq("id", id)
      .maybeSingle();

    if (currentUserError) {
      return NextResponse.json(
        { message: "Gagal memeriksa data profil." },
        { status: 500 }
      );
    }

    if (!currentUser) {
      return NextResponse.json(
        { message: "Profil tidak ditemukan." },
        { status: 404 }
      );
    }

    if (currentUser.email !== cleanEmail) {
      const { data: duplicateEmail, error: duplicateError } = await supabase
        .from("users")
        .select("id")
        .eq("email", cleanEmail)
        .neq("id", id)
        .maybeSingle();

      if (duplicateError) {
        return NextResponse.json(
          { message: "Gagal memeriksa email." },
          { status: 500 }
        );
      }

      if (duplicateEmail) {
        return NextResponse.json(
          { message: "Email sudah digunakan akun lain." },
          { status: 400 }
        );
      }
    }

    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        full_name: cleanName,
        email: cleanEmail,
      })
      .eq("id", id);

    if (updateUserError) {
      return NextResponse.json(
        { message: "Gagal menyimpan data akun." },
        { status: 500 }
      );
    }

    if (currentUser.role === "patient") {
      const { error: updatePatientError } = await supabase
        .from("patients")
        .upsert({ id, phone_number: cleanPhone }, { onConflict: "id" });

      if (updatePatientError) {
        return NextResponse.json(
          { message: "Gagal menyimpan data pasien." },
          { status: 500 }
        );
      }
    }

    const { profile, error } = await getUserProfile(id);

    if (error || !profile) {
      return NextResponse.json(
        { message: "Profil tersimpan, tetapi gagal memuat ulang data." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Profil berhasil diperbarui.",
      profile,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
