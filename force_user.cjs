const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function force() {
  const { data: usersData } = await supabase.auth.admin.listUsers();
  let user = usersData.users.find(u => u.email === 'carlos.junior@unibeer.com.br');
  
  if (!user) {
    const { data: authData, error: createErr } = await supabase.auth.admin.createUser({
      email: 'carlos.junior@unibeer.com.br', password: '123456', email_confirm: true
    });
    if (createErr) return console.log(createErr);
    user = authData.user;
  } else {
    await supabase.auth.admin.updateUserById(user.id, { password: '123456' });
  }

  const { error: profError } = await supabase.from('profiles').upsert({
    id: user.id,
    Nome: 'Carlos Junior',
    email: 'carlos.junior@unibeer.com.br',
    nivel: 'Niv4',
    unidade: 'Campos "C"',
    funcao: 'Supervisor',
    empresa_id: 1,
    ativo: true
  });
  console.log("Profile Upsert:", profError ? profError : "Success");
}
force();
