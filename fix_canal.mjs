import fs from 'fs';
import readline from 'readline';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log("Variáveis de ambiente do Supabase não encontradas.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const CSV_FILE = 'Pasta1.csv';
const batchSize = 100;

async function uploadBatch(data) {
    const { error } = await supabase
        .from('pdvs')
        .upsert(data, { onConflict: 'CODIGO' });

    if (error) {
        console.error(`❌ Erro ao subir lote:`, error.message);
        return false;
    }
    return true;
}

async function processFile() {
    if (!fs.existsSync(CSV_FILE)) {
        console.error(`O arquivo ${CSV_FILE} não foi encontrado na raiz do projeto!`);
        process.exit(1);
    }

    const fileStream = fs.createReadStream(CSV_FILE, { encoding: 'utf-8' });
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let batch = [];
    let headers = [];
    let isFirstLine = true;
    let totalProcessed = 0;
    let totalInserted = 0;
    let totalErrors = 0;

    console.log("Iniciando a correção da coluna CANAL...");

    for await (const line of rl) {
        const cleanLine = line.replace(/^\uFEFF/, '').trim();
        if (!cleanLine) continue;

        const cols = cleanLine.split(';');

        if (isFirstLine) {
            headers = cols.map(h => h.trim());
            isFirstLine = false;
            continue;
        }

        const row = {};
        headers.forEach((header, index) => {
            row[header] = cols[index] || null;
        });

        if (row['CODIGO']) {
            const pdv = {
                "CODIGO": row['CODIGO'],
                "SIGLA": row['Sigla'] || row['Razão Social'] || 'S/N',
                "CANAL": row['CANAL'] || 'Não Informado', // FIX: Usando a coluna 'CANAL' maiúscula
                "PORTE": row['Porte'] || row['PORTE'],
                "FILIAL": row['FILIAL'],
                "MUNICIPIO": row['Município'],
                "VENDEDOR": row['VENDEDOR'],
                "NOME_VENDEDOR": row['NOME VENDEDOR'],
                "NOME _SUPERVISOR": row['NOME SUPERVISOR'],
                "SUPERVISOR": row['Superv(1)'],
                "GERENTE": row['Gerente(1)'],
                "ROTA": row['ROTA'],
                "Coorden-X": row['Coorden-X'],
                "Coorden-Y": row['Coorden-Y']
            };

            batch.push(pdv);
            totalProcessed++;
        }

        if (batch.length >= batchSize) {
            const success = await uploadBatch(batch);
            if (success) totalInserted += batch.length;
            else totalErrors += batch.length;

            batch = [];
            process.stdout.write(`✅ Lidos: ${totalProcessed} | Salvos: ${totalInserted}\r`);
        }
    }

    if (batch.length > 0) {
        const success = await uploadBatch(batch);
        if (success) totalInserted += batch.length;
        else totalErrors += batch.length;
        process.stdout.write(`✅ Lidos: ${totalProcessed} | Salvos: ${totalInserted}\r`);
    }

    console.log('\n\n--- RESUMO DA CORREÇÃO ---');
    console.log(`Total lido: ${totalProcessed}`);
    console.log(`Sucesso no Supabase: ${totalInserted}`);
    console.log(`Linhas com Erro: ${totalErrors}`);
    process.exit(0);
}

processFile();
