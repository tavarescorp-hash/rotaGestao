const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function wipeAll() {
  console.log("Iniciando limpeza total de Autenticação e Perfis...");
  
  // Wipe profiles first to respect potential foreign key constraints
  const { error: profError } = await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (profError) {
      console.log("Erro limpando perfis:", profError);
  } else {
      console.log("Tabela profiles esvaziada.");
  }

  // Get all auth users
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
      console.log("Erro buscando users:", authError);
      return;
  }
  
  console.log(`Encontrados ${users.length} usuários para deletar.`);
  
  for (const user of users) {
      const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
      if (delError) {
          console.log(`Erro ao deletar ${user.email}:`, delError);
      } else {
          console.log(`Usuário deletado: ${user.email}`);
      }
  }
  
  console.log("Limpeza do Supabase concluída com sucesso.");
}

wipeAll();
