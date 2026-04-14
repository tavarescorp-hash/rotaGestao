
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { normalizeName, isBranchMatch } from '../src/lib/utils';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontrados.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateDiegoSearch() {
  const userEmail = 'diego.manhanini@unibeer.com.br';
  const userName = 'DIEGO MANHANINI';
  const userUnidade = 'MACAÉ';
  const nMatch = normalizeName(userName);

  console.log(`\n🕵️‍♂️ SIMULANDO LOGIN: ${userEmail}`);
  console.log(`🔑 Chave de Identidade: "${nMatch}"`);
  console.log(`📍 Unidade do Usuário: "${userUnidade}"`);

  // 1. Busca na Tabela de Supervisores
  const { data: sups, error: errSups } = await supabase.from('supervisores').select('*');
  
  const supsFiltrados = sups?.filter(s => {
    const matchesGerente = normalizeName(s.gerente).includes(nMatch);
    const matchesFilial = isBranchMatch(userUnidade, s.filial);
    return matchesGerente || matchesFilial;
  }) || [];

  console.log(`\n👨‍💼 SUPERVISORES ENCONTRADOS (Oficiais):`);
  if (supsFiltrados.length === 0) console.log("   (Nenhum encontrado)");
  supsFiltrados.forEach(s => console.log(`   ✅ ${s.nome} [${s.filial}] (Gerente: ${s.gerente})`));

  // 2. Busca no Resgate (DataLake PDVs) Otimizada
  const isMacae = normalizeName(userUnidade).includes('macae') || normalizeName(userUnidade) === 'm';
  const isCampos = normalizeName(userUnidade).includes('campos') || normalizeName(userUnidade) === 'c';
  
  let orFilter = `nome_gerente_vendas.ilike.%${nMatch}%,nome_gerente_comercial.ilike.%${nMatch}%`;
  if (isMacae) orFilter += `,filial.eq.M,filial.ilike.%MACAE%`;
  if (isCampos) orFilter += `,filial.eq.C,filial.ilike.%CAMPOS%`;

  const { data: pdvs, error: errPdvs } = await supabase.from('pdvs')
    .select('nome_vendedor, nome_supervisor, nome_gerente_vendas, filial')
    .or(orFilter);

  if (errPdvs) console.error("Erro no resgate:", errPdvs);

  const subMap = new Map();
  pdvs?.forEach(p => {
    const sup = p.nome_supervisor || "SEM SUPERVISOR";
    if (!subMap.has(sup)) subMap.set(sup, new Set());
    if (p.nome_vendedor) subMap.get(sup).add(p.nome_vendedor);
  });

  console.log(`\n📦 ESTRUTURA RESGATADA (DataLake/PDVs):`);
  if (subMap.size === 0) console.log("   (Nenhuma estrutura encontrada)");
  subMap.forEach((vendedores, supervisor) => {
    console.log(`\n🔸 Supervisor: ${supervisor}`);
    Array.from(vendedores).sort().forEach(v => console.log(`   - Vendedor: ${v}`));
  });
}

simulateDiegoSearch();
