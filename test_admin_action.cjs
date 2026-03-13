require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Variáveis de ambiente ausentes");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdates() {
  console.log("Buscando 1 visita pendente...");
  const { data: pendentes, error: errBusca } = await supabase
    .from('visitas')
    .select('id')
    .eq('status_aprovacao', 'Pendente')
    .limit(1);

  if (errBusca) {
    console.error("Erro na busca:", errBusca);
    return;
  }

  if (!pendentes || pendentes.length === 0) {
    console.log("Nenhuma visita pendente encontrada para testar.");
    return;
  }

  const idToTest = pendentes[0].id;
  console.log("Iniciando Update de Teste no ID:", idToTest);

  const { data, error } = await supabase
    .from('visitas')
    .update({ status_aprovacao: 'Aprovado' })
    .eq('id', idToTest)
    .select();

  if (error) {
    console.error("ERRO GRAVE NA ATUALIZAÇÃO SÓ DE ID:", error.message, error.details);
  } else if (!data || data.length === 0) {
    console.log("A QUERY RODOU SEM ERRO MAS NENHUMA LINHA FOI ATINGIDA (Possível RLS bloqueando UPDATE/DELETE)");
  } else {
    console.log("SUCESSO:", data);
  }
}

testUpdates();
