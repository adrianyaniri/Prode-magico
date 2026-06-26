import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { email, password, username, inviteCode } = await request.json();

    if (!email || !password || !inviteCode) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Validar el código de invitación primero
    const { data: inviteData, error: inviteError } = await supabase.rpc("validate_invite_code", {
      code_text: inviteCode.toUpperCase(),
    });

    if (inviteError || !inviteData || !inviteData.valid) {
      return NextResponse.json({ error: "Código de invitación inválido" }, { status: 400 });
    }

    // 2. Crear usuario usando la API de Administrador (evita cualquier Rate Limit y confirma el correo automáticamente)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });

    if (authError) {
      // Manejar mensajes en español para los casos más comunes
      if (authError.message.includes("already registered")) {
        return NextResponse.json({ error: "Ese nombre ya está en uso." }, { status: 400 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Error desconocido al crear la cuenta" }, { status: 500 });
    }

    // 3. Asignar rol
    await supabase.from("user_roles").insert({
      user_id: authData.user.id,
      role: inviteData.role,
    }); // Ignoramos si falla por clave duplicada en caso de que un trigger lo haya hecho.

    // 4. Consumir código de invitación
    await supabase.rpc("consume_invite_code", {
      code_text: inviteCode.toUpperCase(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error del servidor" }, { status: 500 });
  }
}
