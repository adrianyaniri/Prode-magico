import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data: matches, error } = await supabase
    .from('matches')
    .select('*')
    .neq('round_name', 'Group Stage')
    .order('kickoff_at', { ascending: true });
    
  if (error) {
    console.error(error);
    return;
  }
  
  for (const m of matches) {
    console.log(`[${m.round_name}] ${m.id} (API: ${m.api_id}): ${m.home_team} vs ${m.away_team} @ ${m.kickoff_at}`);
  }
}
main();
