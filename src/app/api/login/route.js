import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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

    const { data: user, error } = await supabase
      .from("users")
      .select("id,email,password_hash,full_name,role")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { message: "Gagal memeriksa akun. Silakan coba lagi." },
        { status: 500 }
      );
    }

    if (!user?.password_hash) {
      return NextResponse.json(
        { message: "Email atau password salah." },
        { status: 401 }
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return NextResponse.json(
        { message: "Email atau password salah." },
        { status: 401 }
      );
    }

    const role = user.role || "patient";

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
