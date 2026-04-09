const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function clean() {
  await supabase.from('visitas').delete().neq('id', 0);
  const { error } = await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log("Profiles deletion error:", error ? error.message : "Success");
}
clean();
