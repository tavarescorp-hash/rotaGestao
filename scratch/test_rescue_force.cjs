const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkPdvCount() {
  // Macaé
  let orMacae = `nome_gerente_vendas.ilike.%DIEGO%MANHANINI%,nome_gerente_comercial.ilike.%DIEGO%MANHANINI%,filial.eq.M,filial.ilike.%MACAE%`;
  const { data: mData, error: mErr } = await supabase.from('pdvs').select('nome_vendedor, nome_supervisor, filial').or(orMacae);
  
  // Campos
  let orCampos = `nome_gerente_vendas.ilike.%CARGO%VAGO%,nome_gerente_comercial.ilike.%CARGO%VAGO%,filial.eq.C,filial.ilike.%CAMPOS%`;
  const { data: cData, error: cErr } = await supabase.from('pdvs').select('nome_vendedor, nome_supervisor, filial').or(orCampos);
  
  function getUniqueSupervisors(arr) {
     const s = new Set();
     arr?.forEach(x => { if (x.nome_supervisor) s.add(x.nome_supervisor.trim()); });
     return [...s];
  }

  console.log("Macaé PDVS encontrados:", mData?.length, "Erro:", mErr?.message);
  console.log("Supervisores em Macaé DataLake:", getUniqueSupervisors(mData));

  console.log("\nCampos PDVS encontrados:", cData?.length);
  console.log("Supervisores em Campos DataLake:", getUniqueSupervisors(cData));
}
checkPdvCount();
