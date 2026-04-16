const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspectEduardo() {
  console.log("🔍 Verificando PDVs para Eduardo Breda...");
  const n = 'EDUARDO B';
  const { data, error } = await supabase.from('pdvs').select('nome_gerente_comercial, filial').ilike('nome_gerente_comercial', `%${n}%`).limit(5);
  
  if (error) console.error(error);
  else console.log(`PDVs encontrados com Eduardo:`, data.length);

  // Vamos ver o que diz o DataLake para o Cleyton!
  const { data: cData } = await supabase.from('pdvs').select('nome_supervisor, nome_gerente_comercial, filial').ilike('nome_supervisor', '%CLEYTON%SOUZA%').limit(5);
  console.log("\nPDVs do Cleyton, quem é o GCOM listado?", cData?.map(d => d.nome_gerente_comercial));
}
inspectEduardo();
