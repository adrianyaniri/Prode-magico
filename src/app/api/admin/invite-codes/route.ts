import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("invite_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch invite codes" },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { code, maxUses } = await request.json();

  if (!code || !maxUses) {
    return NextResponse.json(
      { error: "code and maxUses are required" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("invite_codes")
    .insert({
      code: code.toUpperCase(),
      max_uses: maxUses,
      uses_count: 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create invite code: " + error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}
