const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMacae() {
  console.log("🔍 [Macaé Diagnostic] Iniciando inspeção...");

  // 1. Verificar perfil do Diego Manhanini
  const { data: profs, error: err1 } = await supabase
    .from('profiles')
    .select('id, email, Nome, nivel, unidade')
    .ilike('email', '%diego%');
  
  console.log("\n👤 Perfil do Diego (Macaé):");
  console.table(profs);

  // 2. Verificar Supervisores de Macaé
  const { data: sups, error: err2 } = await supabase
    .from('supervisores')
    .select('id, nome, filial, gerente')
    .or("filial.eq.M,filial.ilike.%macae%");

  console.log("\n👔 Supervisores de Macaé:");
  if (err2) console.error(err2);
  else console.table(sups);

  // 3. Verificar Vendedores de Macaé
  /*const { data: vends, error: err3 } = await supabase
    .from('vendedores')
    .select('cod_vendedor, nome, filial')
    .or("filial.eq.M,filial.ilike.%macae%")
    .limit(5);

  console.log("\n🛒 Vendedores de Macaé (Amostra):");
  if (err3) console.error(err3);
  else console.table(vends);*/
}

checkMacae();
