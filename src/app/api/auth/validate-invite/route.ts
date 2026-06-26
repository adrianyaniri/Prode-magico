import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "El código de invitación es requerido", valid: false },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Use RPC to validate code (bypasses RLS via security definer)
    const { data, error } = await supabase.rpc("validate_invite_code", {
      code_text: code.toUpperCase(),
    });

    if (error || !data) {
      return NextResponse.json(
        { error: "Código de invitación inválido", valid: false, detail: error?.message },
        { status: 400 },
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Error al validar código", valid: false },
      { status: 500 },
    );
  }
}
