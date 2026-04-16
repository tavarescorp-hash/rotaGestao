const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkWelberson() {
  const { data: vInfo } = await supabase.from('vendedores').select('*').ilike('nome', '%welberson%');
  console.log("Welberson na tabela Vendedores:", vInfo);
  
  const { data: pInfo } = await supabase.from('pdvs').select('nome_supervisor').ilike('nome_vendedor', '%welberson%').limit(2);
  console.log("Welberson no DataLake (quem é o SUP?):", pInfo);
}
checkWelberson();
