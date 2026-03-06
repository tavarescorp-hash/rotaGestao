const fs = require('fs');
const XLSX = require('xlsx');

const workbook = XLSX.readFile('pdvs.xlsx');
const sheet_name_list = workbook.SheetNames;
const headers = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], { header: 1 })[0];

const existingCols = [
    'created_at', 'CODIGO', 'VENDEDOR', 'NOME_VENDEDOR', 'NOME _SUPERVISOR', 'ROTA',
    'CANAL', 'SIGLA', 'SUPERVISOR', 'GERENTE', 'Coorden-X', 'Coorden-Y', 'PORTE',
    'MUNICIPIO', 'FILIAL', 'Google', 'id', 'tipo', 'updated_at'
].map(c => c.toLowerCase());

let sql = '';
headers.forEach(header => {
    if (header) {
        const colName = header.trim();
        if (!existingCols.includes(colName.toLowerCase())) {
            const safeCol = '"' + colName.replace(/"/g, '""') + '"';
            sql += 'ALTER TABLE public.pdvs ADD COLUMN IF NOT EXISTS ' + safeCol + ' TEXT;\n';
        }
    }
});
fs.writeFileSync('add_cols.sql', sql);
console.log('SQL generated: add_cols.sql');
