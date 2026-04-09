const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: users, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) return console.error("Auth Error:", authError);
  
  const { data: profiles, error: profError } = await supabase.from('profiles').select('*');
  if (profError) return console.error("Profile Error:", profError);

  console.log(`Auth Users count: ${users.users.length}`);
  console.log(`Profiles count: ${profiles.length}`);
  
  if (users.users.length > 0) {
      console.log('Sample auth user:', users.users[0].email);
  }
}
check();
