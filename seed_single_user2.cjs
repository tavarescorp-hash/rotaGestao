const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const user = { 
    email: 'carlos.junior@unibeer.com.br', 
    name: 'Carlos Junior', 
    role: 'Niv4', 
    funcao: 'Supervisor', 
    unidade: 'Campos "C"',
    password: '123456'
};

async function seedUser() {
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true
  });
  
  if(authError) {
      console.log("Auth Error:", authError);
      return;
  }

  const { error: profError } = await supabase.from('profiles').upsert({
    id: authData.user.id,
    Nome: user.name,
    email: user.email,
    nivel: user.role,
    unidade: user.unidade,
    funcao: user.funcao,
    empresa_id: 1,
    ativo: true
  });

  if (profError) {
      console.log("Profile Error:", profError);
  } else {
      console.log("Sucesso!");
  }
}

seedUser();
