import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import readline from 'readline';

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const csvFilePath = './Banco de dados - Portifolio.csv';

async function updateProdutosFds() {
    console.log("Starting update of produtos_fds...");

    // 1. Delete all existing records
    console.log("Deleting existing records...");
    const { error: deleteError } = await supabase
        .from('produtos_fds')
        .delete()
        .neq('CANAL', 'PLACEHOLDER_THAT_NEVER_MATCHES'); // Hack to delete all since Supabase requires a filter for delete

    if (deleteError) {
        console.error("Error deleting records:", deleteError);
        return;
    }
    console.log("Existing records deleted.");

    // 2. Read and parse CSV
    const fileStream = fs.createReadStream(csvFilePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let isFirstLine = true;
    const records = [];

    for await (const line of rl) {
        if (isFirstLine) {
            isFirstLine = false;
            continue;
        }

        // A simple CSV parser that respects quotes
        const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
        let match;
        const values = [];

        // Alternative parsing to handle missing values and quotes
        let inQuote = false;
        let currentValue = "";

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                let val = currentValue.trim();
                if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                values.push(val);
                currentValue = "";
            } else {
                currentValue += char;
            }
        }
        let lastVal = currentValue.trim();
        if (lastVal.startsWith('"') && lastVal.endsWith('"')) lastVal = lastVal.slice(1, -1);
        values.push(lastVal); // push the last value

        if (values.length >= 3) { // At least CANAL, PRODUTO, PONTOS
            const canal = values[0];
            const produto = values[1];
            const pontos = parseInt(values[2], 10);
            const execucao = values.length >= 4 ? values[3] : null;

            if (canal) {
                records.push({
                    CANAL: canal,
                    PRODUTO: produto,
                    PONTOS: isNaN(pontos) ? 0 : pontos,
                    EXECUCAO: execucao === "" ? null : execucao
                });
            }
        }
    }

    console.log(`Parsed ${records.length} records from CSV.`);

    // 3. Insert new records in batches
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        console.log(`Inserting batch ${i / batchSize + 1} (${batch.length} records)...`);

        const { error: insertError } = await supabase
            .from('produtos_fds')
            .insert(batch);

        if (insertError) {
            console.error("Error inserting batch:", insertError);
        }
    }

    console.log("Finished updating produtos_fds.");
}

updateProdutosFds().catch(console.error);
