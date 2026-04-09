const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, count, error } = await supabase.from('pdvs').select('*', { count: 'exact', head: false }).limit(5);
  console.log("Total PDVs:", count);
  console.log("Amostras:", data.map(p => p.codigo));
  if (error) console.log("Erro:", error);
}
check();
