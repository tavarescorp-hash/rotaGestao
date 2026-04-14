
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.VITE_SUPABASE_ANON_KEY || ""
);

async function inspect() {
  console.log("🔍 [Inspeção JS] Buscando dados de usuários específicos...");

  try {
    // 1. Procurar no Profiles
    const { data: profiles, error: errP } = await supabase
      .from('profiles')
      .select('id, email, Nome, nivel, unidade')
      .or(`email.ilike.%cleyton%,email.ilike.%cargo%`);

    console.log("\n👤 TABELA: profiles");
    if (errP) console.error("Erro no Profiles:", errP);
    else console.table(profiles);

    // 2. Procurar no Supervisores
    const { data: sups, error: errS } = await supabase
      .from('supervisores')
      .select('id, nome, filial, gerente');

    if (errS) {
      console.error("Erro no Supervisores:", errS);
    } else {
      const supsFiltrados = sups?.filter(s => 
        (s.nome && s.nome.toUpperCase().includes('CLEYTON')) || 
        (s.nome && s.nome.toUpperCase().includes('CARGO'))
      );
      console.log("\n👔 TABELA: supervisores");
      console.table(supsFiltrados);
    }
  } catch (error) {
    console.error("Erro fatal na inspeção:", error);
  }
}

inspect();
