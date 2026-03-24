import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: users } = await supabase.from('usuarios_app').select('Nome, funcao, nivel').ilike('Nome', '%GUILHERME%');
  console.log("Usuarios Guilherme:", users);

  const { data: supPdvs } = await supabase.from('pdvs').select('nome_supervisor, nome_gerente_vendas').ilike('nome_supervisor', '%GUILHERME%').limit(5);
  console.log("Supervisores Guilherme PDVs:", supPdvs);
  
  const { data: gerPdvs } = await supabase.from('pdvs').select('nome_supervisor, nome_gerente_vendas').ilike('nome_gerente_vendas', '%GUILHERME%').limit(5);
  console.log("Gerentes Guilherme PDVs:", gerPdvs);
}
run();
