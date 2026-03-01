import fs from 'fs';
import readline from 'readline';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if(!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.log("Variáveis de ambiente do Supabase não encontradas.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const CSV_FILE = 'Pasta1.csv';
const batchSize = 100;
let batch = [];
let headers = [];
let isFirstLine = true;
let totalProcessed = 0;
let totalInserted = 0;
let totalErrors = 0;

async function uploadBatch(data) {
  const { error } = await supabase
    .from('pdvs')
    .upsert(data, { onConflict: 'codigo', ignoreDuplicates: false });
  
  if (error) {
    console.error(`Erro ao subir batch:`, error.message);
    totalErrors += data.length;
  } else {
    totalInserted += data.length;
    console.log(`Lote inserido com sucesso: ${data.length} PDVs.`);
  }
}

async function processFile() {
  const fileStream = fs.createReadStream(CSV_FILE, { encoding: 'utf-8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    // Remove invisible weird characters like BOM
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

    // Filtra e Mapeia APENAS os campos vitais pro App (conforme api.ts usa do raw)
    if (row['CODIGO']) {
      const pdv = {
        codigo: row['CODIGO'],
        nome_fantasia: row['Sigla'] || row['Razão Social'] || 'S/N',
        canal: row['Canal'] || 'Não Informado',
        regiao: row['Região'],
        cnpj_cpf: row['CNPJ/CPF'],
        razao_social: row['Razão Social'],
        filial: row['FILIAL'],
        municipio: row['Município'],
        codigo_vendedor: row['VENDEDOR'],
        nome_vendedor: row['NOME VENDEDOR'],
        nome_supervisor: row['NOME SUPERVISOR'],
        supervisor: row['Superv(1)'],
        gerente: row['Gerente(1)'],
        coorden_x: row['Coorden-X'],
        coorden_y: row['Coorden-Y']
      };
      
      batch.push(pdv);
      totalProcessed++;
    }

    if (batch.length >= batchSize) {
      await uploadBatch([...batch]);
      batch = [];
    }
  }

  // Upload remaining
  if (batch.length > 0) {
    await uploadBatch([...batch]);
  }

  console.log('--- RESUMO ---');
  console.log(`Total lido: ${totalProcessed}`);
  console.log(`Sucesso no Supabase: ${totalInserted}`);
  console.log(`Erros: ${totalErrors}`);
  process.exit(0);
}

processFile();
