import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('profiles').select('email, Nome, funcao, nivel, unidade').eq('email', 'diretor.unibeer@unibeer.com.br');
  console.log("DIRETOR:", data);
  const { data: q, error: e } = await supabase.from('profiles').select('email, Nome, funcao, nivel, unidade').ilike('email', '%diretor%');
  console.log("BUSCA:", q);
}
run();
