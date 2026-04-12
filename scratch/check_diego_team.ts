
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { normalizeName } from '../src/lib/utils';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontrados.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDiegoTeam() {
  console.log("🚀 Consultando a equipe do Diego Manhanini...");

  // 1. Buscar na tabela de supervisores
  const { data: sups, error: errSups } = await supabase
    .from('supervisores')
    .select('*');

  if (errSups) console.error("Erro ao buscar supervisores:", errSups);

  const diegoSups = sups?.filter(s => 
    normalizeName(s.gerente || "").includes("diegomanhanini") || 
    (normalizeName(s.filial || "") === 'm' || normalizeName(s.filial || "").includes('macae'))
  ) || [];

  console.log(`\n👨‍💼 SUPERVISORES ENCONTRADOS (${diegoSups.length}):`);
  diegoSups.forEach(s => console.log(`- ${s.nome} [${s.filial}]`));

  // 2. Buscar na tabela de PDVs (Estrutura Real)
  const { data: pdvs, error: errPdvs } = await supabase
    .from('pdvs')
    .select('nome_vendedor, nome_supervisor, nome_gerente_vendas, filial')
    .limit(5000);

  if (errPdvs) console.error("Erro ao buscar PDVs:", errPdvs);

  const teamMap = new Map();
  pdvs?.forEach(p => {
    const gNormal = normalizeName(p.nome_gerente_vendas || "");
    const fNormal = normalizeName(p.filial || "");
    
    if (gNormal.includes("diegomanhanini") || fNormal === 'm' || fNormal.includes('macae')) {
      const sup = p.nome_supervisor || "SEM SUPERVISOR";
      if (!teamMap.has(sup)) teamMap.set(sup, new Set());
      if (p.nome_vendedor) teamMap.get(sup).add(p.nome_vendedor);
    }
  });

  console.log(`\n📦 ESTRUTURA VENDEDORES POR SUPERVISOR (Base PDVs):`);
  teamMap.forEach((vendedores, supervisor) => {
    console.log(`\n🔸 SUPERVISOR: ${supervisor}`);
    Array.from(vendedores).sort().forEach(v => console.log(`   - ${v}`));
  });
}

checkDiegoTeam();
