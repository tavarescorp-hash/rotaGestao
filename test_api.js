import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testFilter() {
  // Let's find an existing code first
  const { data: rand, error: e1 } = await supabase.from('pdvs').select('"CODIGO"').eq('"SUPERVISOR"', '100').limit(1).single();
  const codigoAlvo = rand ? rand.CODIGO : 'C12171';

  const unidade = 'MACAE';
  const supervisorId = '100';

  let query = supabase
    .from("pdvs")
    .select('"SIGLA", "FILIAL", "NOME _SUPERVISOR", "SUPERVISOR", "CODIGO"')
    .eq('"CODIGO"', codigoAlvo);

  if (unidade) {
    query = query.ilike('"FILIAL"', `%${unidade}%`);
  }
  if (supervisorId) {
    query = query.eq('"SUPERVISOR"', supervisorId);
  }

  const { data, error } = await query.single();
  console.log(`Result (Simulated Anderson fetching ${codigoAlvo}):`, data || error);

  // Simulated Cleyton (Supervisor 200, MACAE)
  let query2 = supabase
    .from("pdvs")
    .select('"SIGLA", "FILIAL", "NOME _SUPERVISOR", "SUPERVISOR", "CODIGO"')
    .eq('"CODIGO"', codigoAlvo)
    .ilike('"FILIAL"', `%${unidade}%`)
    .eq('"SUPERVISOR"', '200');

  const result2 = await query2.single();
  console.log(`Result (Simulated Cleyton fetching ${codigoAlvo}):`, result2.data || result2.error);
}

testFilter();
