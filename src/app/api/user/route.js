import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Fetch users
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const role = searchParams.get('role');

  try {
    // Hanya ambil user yang belum dihapus (soft delete check)
    let query = supabase.from('users').select('*').is('deleted_at', null);

    if (id) {
      query = query.eq('id', id).single();
    } else if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Create a new user
export async function POST(request) {
  try {
    const body = await request.json();
    const { id, email, full_name, role, img_url } = body;

    const { data, error } = await supabase
      .from('users')
      .insert([{ id, email, full_name, role, img_url }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT: Update an existing user
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, email, full_name, role, img_url } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ email, full_name, role, img_url })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE: Soft delete a user
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
  }

  try {
    // Soft delete dengan mengisi kolom deleted_at
    const { data, error } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: "User deleted successfully", data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
