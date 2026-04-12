
import { normalizeName, isBranchMatch } from '../src/lib/utils';

const userUnid = "MACAÉ";
const filialDB = "M";

console.log(`--- TESTE DE MATCH DE UNIDADE ---`);
console.log(`Usuário Unidade: "${userUnid}"`);
console.log(`SupaBase Filial: "${filialDB}"`);
console.log(`---------------------------------`);

const n1 = normalizeName(userUnid);
const n2 = normalizeName(filialDB);

console.log(`Normalizado 1: "${n1}"`);
console.log(`Normalizado 2: "${n2}"`);

const isM1 = n1 === 'm' || n1.includes('macae');
const isM2 = n2 === 'm' || n2.includes('macae');

console.log(`isM1: ${isM1}`);
console.log(`isM2: ${isM2}`);

const matchResult = isBranchMatch(userUnid, filialDB);
console.log(`\nRESULTADO FINAL: ${matchResult ? "✅ MATCH!" : "❌ FALHOU!"}`);

// Teste extra com Campos
console.log(`\n--- TESTE CAMPOS ---`);
console.log(`Result: ${isBranchMatch("CAMPOS", "C") ? "✅" : "❌"}`);
console.log(`Result: ${isBranchMatch("MACAÉ", "C") ? "✅ (ERRO!)" : "❌ (CORRETO!)"}`);
