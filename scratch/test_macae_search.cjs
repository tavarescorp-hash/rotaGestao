const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function normalizeName(s) {
  if (!s) return "";
  let name = s.replace(/[\n\r\t]/g, ' ').toUpperCase().trim();
  // Simplified for test
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\b(da|de|do|das|dos)\b/gi, "").replace(/[^a-z0-9]/gi, "").trim();
}

function isBranchMatch(val1, val2) {
  if (!val1 || !val2) return false;
  const n1 = normalizeName(val1);
  const n2 = normalizeName(val2);
  if (n1 === n2) return true;
  const isM1 = n1 === 'm' || n1.includes('macae');
  const isM2 = n2 === 'm' || n2.includes('macae');
  if (isM1 && isM2) return true;
  return n1.includes(n2) || n2.includes(n1);
}

async function testFetch() {
  const user = { name: 'DIEGO MANHANINI', email: 'diego.manhanini@unibeer.com.br', nivel: 'Niv3', unidade: 'Macaé' };

  console.log("Executando testFetch para Diego Macaé...");

  const { data: dataSups } = await supabase.from('supervisores').select('*');
  const { data: vends } = await supabase.from('vendedores').select('cod_vendedor, nome, cidade, supervisores(id, nome, filial, gerente, gerente_comercial)');

  let formatado = (vends || []).map((r) => {
    const s = r.supervisores || {};
    return {
      cod_vendedor: r.cod_vendedor,
      nome_vendedor: r.nome,
      nome_supervisor: s.nome || "",
      filial: s.filial || "",
      gerente: s.gerente || ""
    };
  });

  if (dataSups) {
    dataSups.forEach((s) => {
      formatado.push({
        cod_vendedor: `SUP-${s.id}`,
        nome_vendedor: s.nome,
        nome_supervisor: s.nome,
        filial: s.filial,
        gerente: s.gerente
      });
    });
  }

  // Filtragem (Linhas 306+)
  const gerenteRef = '%DIEGOMANHANINI%';
  const nMatch = normalizeName(gerenteRef.replace(/%/g, ''));
  const uUnidRaw = String(user?.unidade || "");
  const uUnid = uUnidRaw === "null" || uUnidRaw === "undefined" ? "" : uUnidRaw.toUpperCase();

  const filtrados = formatado.filter(v => {
    const matchesGerente = normalizeName(v.gerente).includes(nMatch);
    const isMasterView = normalizeName(user?.unidade || "") === 'todas' || normalizeName(user?.unidade || "") === '';
    const matchesFilial = isBranchMatch(user?.unidade, v.filial) || isMasterView;

    return matchesGerente || matchesFilial;
  });

  console.log(`Vendedores Formatados: ${formatado.length}. Filtrados: ${filtrados.length}`);
  if (filtrados.length > 0) {
    const supNames = [...new Set(filtrados.map(f => f.nome_supervisor))];
    console.log("Supervisores da Equipe:", supNames);
  }
}

testFetch();
