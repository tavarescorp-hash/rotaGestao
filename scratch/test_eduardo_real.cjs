const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspect() {
  const orFilter = `nome_gerente_vendas.ilike.%EDUARDO%BREDA%,nome_gerente_comercial.ilike.%EDUARDO%BREDA%`;
  const { data, error } = await supabase.from('pdvs').select('nome_supervisor').or(orFilter);
  
  if (error) {
     console.error("ERRO:", error);
     return;
  }
  
  const supervisors = new Set();
  data.forEach(d => supervisors.add(d.nome_supervisor));
  
  console.log("Supervisores achados sob o filtro de Eduardo:", [...supervisors]);
}
inspect();
