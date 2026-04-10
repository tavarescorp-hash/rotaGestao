require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('pdvs').select('nome_supervisor').limit(500);
  if (error) {
    console.error(error);
  } else {
    const s = [...new Set(data.map(d => d.nome_supervisor))];
    console.log("SUPERVISORES UNICOS NO BANCO:", s);
  }
}
run();
