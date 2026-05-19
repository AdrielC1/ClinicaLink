import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const roleRoutes = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  admin: "/admin/dashboard",
};

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

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    });

    if (authError) {
      return NextResponse.json(
        { message: "Email atau password salah." },
        { status: 401 }
      );
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id,email,full_name,role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json(
        { message: "Gagal mengambil data profil pengguna." },
        { status: 500 }
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
  } catch (error) {
    return NextResponse.json(
      { message: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
