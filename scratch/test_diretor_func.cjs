const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function runTest() {
    console.log("=== VISTORIA COMO DIRETOR ===");
    
    // Simulate `buscarVendedoresAtivos({ nivel: 'Niv1', name: 'BRAULIO' })`
    // Direct from the code logic:
    let queryVend = supabase.from("vendedores").select(`
        cod_vendedor,
        nome,
        cidade,
        supervisores (
          id,
          nome,
          filial,
          gerente,
          gerente_comercial
        )
      `).eq('empresa_id', 1);

    const { data: dataSups } = await supabase.from('supervisores').select('*');
    const res = await queryVend;

    let formatado = res.data.map(r => {
        const s = r.supervisores || {};
        return {
          nome_vendedor: r.nome,
          nome_supervisor: s.nome || "",
          gerente: s.gerente || "",
          gerente_comercial: s.gerente_comercial || ""
        };
    });
    
    // Injetar Supervisores 
    dataSups.forEach(s => {
        formatado.push({
            nome_supervisor: s.nome,
            gerente: s.gerente,
            gerente_comercial: s.gerente_comercial || ""
        });
    });

    const gcoms = new Set();
    formatado.forEach(v => {
        if(v.gerente_comercial) gcoms.add(v.gerente_comercial);
    });

    console.log("GCOMs:", Array.from(gcoms));
    
    const gerentes = new Set();
    formatado.forEach(v => {
        if(v.gerente) gerentes.add(v.gerente);
    });
    console.log("GVs:", Array.from(gerentes));
    
}
runTest().catch(console.error);
