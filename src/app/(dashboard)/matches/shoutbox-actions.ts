"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ShoutboxMessage = {
  id: string;
  user_id: string;
  username: string; // we will join this
  message: string;
  created_at: string;
};

export async function getShoutboxMessages(): Promise<ShoutboxMessage[]> {
  const supabase = await createClient();

  // Traemos los últimos 15 mensajes
  const { data, error } = await supabase
    .from("shoutbox")
    .select(`
      id,
      user_id,
      message,
      created_at
    `)
    .order("created_at", { ascending: false })
    .limit(15);

  if (error) {
    console.error("Error fetching shoutbox:", error);
    return [];
  }

  // Fetch usernames using Admin Client (since auth.users is not public)
  const adminSupabase = createAdminClient();
  const { data: authUsers } = await adminSupabase.auth.admin.listUsers();
  
  const userMap = new Map(
    authUsers?.users?.map((u) => [
      u.id, 
      u.user_metadata?.username || (u.email ? u.email.split('@')[0] : u.id)
    ]) ?? [],
  );

  return (data || []).reverse().map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    message: row.message,
    created_at: row.created_at,
    username: userMap.get(row.user_id) || "Usuario",
  }));
}

export async function postShoutboxMessage(message: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const cleanMessage = message.trim().slice(0, 150);
  if (!cleanMessage) return;

  const { error } = await supabase
    .from("shoutbox")
    .insert({
      user_id: user.id,
      message: cleanMessage,
    });

  if (error) {
    console.error("Error posting to shoutbox:", error);
    throw new Error("No se pudo enviar el mensaje");
  }
}
