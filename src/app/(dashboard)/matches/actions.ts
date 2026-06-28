"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function getGroupStandings() {
  const supabase = createAdminClient();
  const { data: standings } = await supabase
    .from("group_standings")
    .select("*")
    .order("position", { ascending: true });

  const standingsByGroup: Record<string, any[]> = {};
  for (const s of (standings ?? [])) {
    // DB stores 'Group A', components expect just 'A'
    const key = s.group_name.replace(/^Group\s+/i, "");
    if (!standingsByGroup[key]) standingsByGroup[key] = [];
    standingsByGroup[key].push(s);
  }
  return standingsByGroup;
}
