import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Setup - Você precisará rodar isso no terminal com as variávies de ambiente corretas.
const supabaseUrl = process.env.VITE_SUPABASE_URL; // Substitua se necessário
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_ANON_KEY; // A chave secreta

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function run() {
    console.log("Iniciando criação de usuários...");

    // 1. Apagar os usuários que criamos via SQL (que estão quebrados)
    console.log("Apagando usuários corrompidos antigos...");
    // Não precisamos apagar os profiles porque há cascade ou podemos atualizar depois
    await supabase.auth.admin.deleteUser('33333333-3333-3333-3333-333333333333');
    await supabase.auth.admin.deleteUser('44444444-4444-4444-4444-444444444444');

    // 2. Criar Cleyton corretamente via API
    console.log("Criando Cleyton...");
    // Using regular signUp instead of admin
    const { data: cleyton, error: errorCleyton } = await supabase.auth.signUp({
        email: 'cleyton.souza@unibeer.com.br',
        password: '123456',
        options: {
            data: { name: 'CLEYTON DE SOUZA', role: 'user' }
        }
    });

    if (errorCleyton) {
        console.error("Erro Cleyton:", errorCleyton);
    } else {
        console.log("Cleyton criado! ID:", cleyton.user.id);

        // Wait a small delay for the trigger
        await new Promise(r => setTimeout(r, 1000));

        // Atualizar o profile que a trigger gerou
        await supabase.from('profiles').update({
            "Nome": 'CLEYTON DE SOUZA',
            "nivel": 'Niv4',
            "unidade": 'MACAE',
            "funcao": 'SUPERVISOR 200'
        }).eq('id', cleyton.user.id);
        console.log("Profile do Cleyton atualizado.");
    }

    // 3. Criar Anderson corretamente via API
    console.log("Criando Anderson...");
    const { data: anderson, error: errorAnderson } = await supabase.auth.signUp({
        email: 'anderson.alexandre@unibeer.com.br',
        password: '123456',
        options: {
            data: { name: 'ANDERSON ALEXANDRE', role: 'user' }
        }
    });

    if (errorAnderson) {
        console.error("Erro Anderson:", errorAnderson);
    } else {
        console.log("Anderson criado! ID:", anderson.user.id);

        // Wait a small delay for the trigger
        await new Promise(r => setTimeout(r, 1000));

        // Atualizar o profile que a trigger gerou
        await supabase.from('profiles').update({
            "Nome": 'ANDERSON ALEXANDRE',
            "nivel": 'Niv4',
            "unidade": 'MACAE',
            "funcao": 'SUPERVISOR 100'
        }).eq('id', anderson.user.id);
        console.log("Profile do Anderson atualizado.");
    }

    console.log("Processo finalizado!");
}

run();
