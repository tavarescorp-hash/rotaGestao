const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
  console.log("=== VERIFICANDO PERFIL ===");
  const { data: prof, error: e1 } = await supabase.from('profiles').select('*').eq('email', 'carlos.junior@unibeer.com.br').single();
  if (e1) console.log("Profile Error:", e1.message);
  else console.log("Perfil Encontrado:", JSON.stringify(prof, null, 2));

  console.log("\n=== VERIFICANDO PDVs VINCULADOS (Por Nome) ===");
  // Verify if there are ANY pdvs
  const { count: cTotal } = await supabase.from('pdvs').select('*', { count: 'exact', head: true });
  console.log("Total total de PDVs no baco:", cTotal);

  if (prof) {
    const { data: pdvs1 } = await supabase.from('pdvs').select('codigo, nome_supervisor, id_supervisor').ilike('nome_supervisor', `%${prof.Nome}%`).limit(3);
    console.log(`PDVs ligados ao nome '${prof.Nome}':`, pdvs1);
    
    // Check if there are pdvs tied by id
    const { data: pdvs2 } = await supabase.from('pdvs').select('codigo, nome_supervisor, id_supervisor').eq('id_supervisor', prof.id).limit(3);
    console.log(`PDVs ligados ao ID '${prof.id}':`, pdvs2);
  }
}
verify();
