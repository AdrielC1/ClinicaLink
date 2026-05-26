import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Route handlers for /api/notifications
// - GET: list notifications (requires ?user_id=...)
// - PATCH: mark a single notification as read (body: { id })
// - PUT: mark all notifications as read for user (body: { user_id })

// =================================================================
// GET - Ambil notifikasi user aktif
// =================================================================
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("user_id");
    const unreadOnly = url.searchParams.get("unread") === "true";

    if (!userId) {
      return NextResponse.json({ message: "Parameter user_id wajib disertakan" }, { status: 400 });
    }

    let query = supabase
      .from("notifications")
      .select("id, user_id, title, message, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (unreadOnly) query = query.eq("is_read", false);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json({ message: "Gagal mengambil notifikasi" }, { status: 500 });
    }

    return NextResponse.json({ notifications: data }, { status: 200 });
  } catch (err) {
    console.error("GET /api/notifications error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// =================================================================
// PATCH - Tandai satu notifikasi sebagai sudah dibaca
// Body: { id }
// =================================================================
export async function PATCH(request) {
  try {
    const body = await request.json();
    const id = body?.id;

    if (!id) {
      return NextResponse.json({ message: "ID notifikasi wajib dikirim." }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error("Error updating notification:", updateError);
      return NextResponse.json({ message: "Gagal menandai notifikasi." }, { status: 500 });
    }

    return NextResponse.json({ notification: updated }, { status: 200 });
  } catch (err) {
    console.error("PATCH /api/notifications error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// =================================================================
// PUT - Tandai semua notifikasi user aktif sebagai sudah dibaca
// =================================================================
export async function PUT(request) {
  try {
    const body = await request.json();
    const userId = body?.user_id;

    if (!userId) {
      return NextResponse.json({ message: "user_id wajib dikirim." }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .select();

    if (error) {
      console.error("Error marking all notifications read:", error);
      return NextResponse.json({ message: "Gagal menandai semua notifikasi." }, { status: 500 });
    }

    return NextResponse.json({ message: "Semua notifikasi ditandai dibaca.", updated_count: updated?.length || 0 }, { status: 200 });
  } catch (err) {
    console.error("PUT /api/notifications error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
