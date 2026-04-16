const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkAnderson() {
  const { data: vInfo } = await supabase.from('vendedores').select('*').ilike('nome', '%anderson%');
  console.log("Anderson na tabela Vendedores:", vInfo);
  
  const { data: sInfo } = await supabase.from('supervisores').select('*').ilike('nome', '%anderson%');
  console.log("Anderson na tabela Supervisores:", sInfo);
}
checkAnderson();
