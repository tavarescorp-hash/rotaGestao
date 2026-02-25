import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function run() {
    console.log("Iniciando criação do Gerente de Vendas Campos...");

    const { data: gerente, error: errorGerente } = await supabase.auth.signUp({
        email: 'gerente.campos@unibeer.com.br',
        password: '123456',
        options: {
            data: { name: 'GERENTE CAMPOS', role: 'user' }
        }
    });

    if (errorGerente) {
        console.error("Erro ao criar Gerente Campos:", errorGerente);
    } else {
        console.log("Gerente Campos criado! ID:", gerente.user?.id);

        // Wait a small delay for the trigger
        await new Promise(r => setTimeout(r, 2000));

        // Atualizar o profile que a trigger gerou
        const { error: profileError } = await supabase.from('profiles').update({
            "Nome": 'GERENTE CAMPOS',
            "nivel": 'Niv3',
            "unidade": 'CAMPOS',
            "funcao": 'GERENTE DE VENDAS'
        }).eq('id', gerente.user?.id);

        if (profileError) {
            console.error("Erro ao atualizar profile:", profileError);
        } else {
            console.log("Profile do Gerente Campos atualizado com sucesso.");
        }
    }

    console.log("==== FIM DO SCRIPT ====");
}

run();
