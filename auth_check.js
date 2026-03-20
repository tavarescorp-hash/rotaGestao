import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'diretor.unibeer@unibeer.com.br',
    password: '123456'
  });
  if (authError) {
    console.error("Auth error", authError.message);
    return;
  }
  
  const { data, error } = await supabase.from('profiles').select('email, Nome, funcao, nivel, unidade').eq('id', authData.user.id).single();
  console.log("DIRETOR:", data);
}
run();
