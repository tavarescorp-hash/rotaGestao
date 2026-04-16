const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runCheck() {
    console.log("=== VISTORIA PARA O DIRETOR ===");
    
    // 1. Quem são os GCOMs na tabela vendedores?
    const { data: vends } = await supabase.from('vendedores').select('gerente_comercial');
    const gcoms = new Set();
    if(vends) {
        vends.forEach(v => {
            if (v.gerente_comercial) gcoms.add(v.gerente_comercial.trim());
        });
    }
    console.log("Gerentes Comerciais detectados na base (listaGerentesComerciais):", Array.from(gcoms));
}

runCheck().catch(console.error);
