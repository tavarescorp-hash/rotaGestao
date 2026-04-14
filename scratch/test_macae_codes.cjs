const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkCodes() {
  const { data, error } = await supabase.from('pdvs').select('codigo, filial').eq('filial', 'M').limit(10);
  console.log("Amostra de Códigos de Macaé (filial M):");
  console.table(data);
}
checkCodes();
