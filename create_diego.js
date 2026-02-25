import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_ANON_KEY;

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
    console.log("Iniciando criação do usuário Diego...");

    const { data: diego, error: errorDiego } = await supabase.auth.signUp({
        email: 'Diego.macae@unibeer.com.br',
        password: '123456',
        options: {
            data: { name: 'DIEGO MACAE', role: 'user' }
        }
    });

    if (errorDiego) {
        console.error("Erro ao criar Diego:", errorDiego);
    } else {
        console.log("Diego criado! ID:", diego.user.id);

        // Wait a small delay for the trigger
        await new Promise(r => setTimeout(r, 1000));

        // Atualizar o profile que a trigger gerou
        const { error: profileError } = await supabase.from('profiles').update({
            "Nome": 'DIEGO MACAE',
            "nivel": 'Niv3',
            "unidade": 'MACAE',
            "funcao": 'GERENTE DE VENDAS'
        }).eq('id', diego.user.id);

        if (profileError) {
            console.error("Erro ao atualizar profile:", profileError);
        } else {
            console.log("Profile do Diego atualizado com sucesso.");
        }
    }

    console.log("Processo finalizado!");
}

run();
