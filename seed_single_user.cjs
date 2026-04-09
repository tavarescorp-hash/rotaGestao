const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const user = { 
    email: 'carlos.junior@unibeer.com.br', 
    name: 'Carlos Junior', 
    role: 'Niv4', 
    funcao: 'Supervisor', 
    codigo: '100', 
    unidade: 'Campos "C"',
    password: '123456'
};

async function seedUser() {
  console.log("Iniciando criação...");
  
  // Create Auth User
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true
  });

  if (authError) {
      console.log("Erro ao criar user auth:", authError);
      return;
  }
  
  const userId = authData.user.id;

  // Criar Profile
  const { error: profError } = await supabase.from('profiles').upsert({
    id: userId,
    Nome: user.name,
    email: user.email,
    nivel: user.role,
    unidade: user.unidade,
    funcao: user.funcao,
    codigo: user.codigo,
    empresa_id: 1,
    ativo: true
  }).select();

  if (profError) {
      console.error("Erro no profile:", profError);
  } else {
      console.log(`Usuario [${user.email}] cadastrado com sucesso.`);
  }
}

seedUser();
