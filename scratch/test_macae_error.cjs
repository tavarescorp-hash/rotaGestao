const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkWhy() {
  const orMacae = `nome_gerente_vendas.ilike.%DIEGO%MANHANINI%,nome_gerente_comercial.ilike.%DIEGO%MANHANINI%,filial.eq.M,filial.ilike.%MACAE%`;
  
  const { data, error } = await supabase.from('pdvs').select('codigo, filial, nome_vendedor, nome_supervisor, nome_gerente_vendas').or(orMacae).eq('nome_supervisor', 'GUILHERME DAS CHAGAS').limit(5);

  console.log("PDVs de Macaé com supervisor Guilherme:");
  if (error) console.error(error);
  else console.table(data);
}
checkWhy();
