const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('vendedores').select('nome, supervisores(nome)');
  console.log("Qtd Vendedores:", data?.length);
  const cleytons = data?.filter(x => x.supervisores?.nome?.toUpperCase().includes('CLEYTON'));
  console.log("De Cleyton:", cleytons?.length);
  console.log(cleytons);
}
check();
