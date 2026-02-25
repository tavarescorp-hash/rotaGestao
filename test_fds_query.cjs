const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function buscarFdsPorCanal(canal) {
    let canalBusca = canal.trim();
    if (canalBusca.toLowerCase() === "entretenimento espec") {
        canalBusca = "Entretenimento Espec.";
    }

    const { data, error } = await supabase
        .from("produtos_fds")
        .select('"PRODUTO", "PONTOS", "EXECUCAO"')
        .ilike("CANAL", canalBusca);

    if (error) {
        console.error("Erro ao buscar dados FDS:", error);
        return { produtos: [], execucao: [] };
    }

    const produtosRaw = data
        .filter((row) => row.PRODUTO && row.PRODUTO.trim() !== "")
        .map((row) => ({ nome: row.PRODUTO.trim(), pontos: row.PONTOS || 0 }));

    const produtos = Array.from(new Map(produtosRaw.map(p => [p.nome, p])).values());

    const execucaoRaw = data
        .filter((row) => row.EXECUCAO && row.EXECUCAO.trim() !== "")
        .map((row) => ({ nome: row.EXECUCAO.trim(), pontos: row.PONTOS || 0 }));
    const execucao = Array.from(new Map(execucaoRaw.map(e => [e.nome, e])).values());

    console.log("PRODUTOS:\n", JSON.stringify(produtos, null, 2));
    console.log("EXECUÇÃO:\n", JSON.stringify(execucao, null, 2));
}

buscarFdsPorCanal('Bar C/D');
