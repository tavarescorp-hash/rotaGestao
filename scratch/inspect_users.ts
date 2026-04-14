
import { createClient } from '@supabase/supabase-client';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.VITE_SUPABASE_ANON_KEY || ""
);

async function inspect() {
  console.log("🔍 [Inspeção] Buscando dados de usuários específicos...");

  // 1. Procurar no Profiles
  const { data: profiles, error: errP } = await supabase
    .from('profiles')
    .select('id, email, Nome, nivel, unidade')
    .or('email.ilike.%cleyton%,email.ilike.%cargo%');

  console.log("\n👤 TABELA: profiles");
  if (errP) console.error("Erro:", errP);
  else console.table(profiles);

  // 2. Procurar no Supervisores
  const { data: sups, error: errS } = await supabase
    .from('supervisores')
    .select('id, nome, filial, gerente');

  const supsFiltrados = sups?.filter(s => 
    s.nome.toUpperCase().includes('CLEYTON') || 
    s.nome.toUpperCase().includes('CARGO')
  );

  console.log("\n👔 TABELA: supervisores");
  if (errS) console.error("Erro:", errS);
  else console.table(supsFiltrados);
}

inspect();
