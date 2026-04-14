const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testFetch() {
  const finalMatch = 'DIEGO%MANHANINI';
  let orFilter = `nome_gerente_vendas.ilike.%${finalMatch}%,nome_gerente_comercial.ilike.%${finalMatch}%,filial.eq.M,filial.ilike.%MACAE%`;

  console.log("Executando query PDVS com OR:", orFilter);

  const { data: pdvs, error } = await supabase.from('pdvs').select('codigo, filial, nome_gerente_vendas').or(orFilter).limit(5);

  if (error) {
    console.error("Erro na query PDVS:", error);
  } else {
    console.log(`Encontrados ${pdvs.length} pdvs.`); // Se for 0, sabemos o erro
  }

  // E os vendedores?
  const { data: vends, error: e2 } = await supabase.from('vendedores').select('nome, filial, supervisores(nome, gerente)').limit(5);
  console.log("Alguns vendedores sem filtro:", vends?.map(v => `${v.nome} - ${v.filial} - gerente: ${v.supervisores?.gerente}`));
}
testFetch();
