import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const roleRoutes = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  admin: "/admin/dashboard",
};

const SUPABASE_TIMEOUT_MS = 6000;

function withTimeout(promise, message = "Koneksi Supabase terlalu lama.") {
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), SUPABASE_TIMEOUT_MS);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function createLocalUser(email) {
  const emailName = String(email).split("@")[0]?.replace(/[._-]+/g, " ").trim();
  const fullName = emailName
    ? emailName.replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Pasien ClinicaLink";

  return {
    id: crypto.randomUUID(),
    email,
    full_name: fullName,
    role: "patient",
    is_local_demo: true,
  };
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanEmail || !password) {
      return NextResponse.json(
        { message: "Email dan password wajib diisi." },
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

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({
        message: "Login berhasil dalam mode lokal.",
        redirectTo: "/patient/dashboard",
        user: createLocalUser(cleanEmail),
      });
    }

    try {
      const { data: authData, error: authError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        }),
        "Login Supabase terlalu lama."
      );

      if (authError) {
        return NextResponse.json(
          { message: "Email atau password salah." },
          { status: 401 }
        );
      }

      const { data: user, error: userError } = await withTimeout(
        supabase
          .from("users")
          .select("id,email,full_name,role,deleted_at")
          .eq("id", authData.user.id)
          .maybeSingle(),
        "Pengambilan profil Supabase terlalu lama."
      );

    if (userError || !user) {
      return NextResponse.json(
        { message: "Gagal mengambil data profil pengguna." },
        { status: 500 }
      );
    }

    if (user.deleted_at) {
      return NextResponse.json(
        { message: "Akun ini telah dinonaktifkan/dihapus oleh Admin." },
        { status: 403 }
      );
    }

    const role = (user.role || "patient").toLowerCase();

    return NextResponse.json({
      message: "Login berhasil.",
      redirectTo: roleRoutes[role] || "/patient/dashboard",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role,
      },
    });
  } catch (supabaseError) {
    return NextResponse.json({
      message: "Login berhasil dalam mode lokal.",
      warning: supabaseError.message,
      redirectTo: "/patient/dashboard",
      user: createLocalUser(cleanEmail),
    });
  }

  } catch (error) {
    return NextResponse.json(
      { message: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
