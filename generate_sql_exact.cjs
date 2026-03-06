const fs = require('fs');
const XLSX = require('xlsx');

const workbook = XLSX.readFile('pdvs.xlsx');
const sheet_name_list = workbook.SheetNames;
const headers = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], { header: 1 })[0];

const dbCols = [
    'created_at', 'CODIGO', 'VENDEDOR', 'NOME_VENDEDOR', 'NOME _SUPERVISOR', 'ROTA',
    'CANAL', 'SIGLA', 'SUPERVISOR', 'GERENTE', 'Coorden-X', 'Coorden-Y', 'PORTE',
    'MUNICIPIO', 'Google', 'SITUAÇAO', 'NOME VENDEDOR', 'NOME SUPERVISOR', 'Região',
    'Número', 'CNPJ/CPF', 'Razão Social', 'Vend(1)', 'Superv(1)', 'Gerente(1)',
    'Vend(2)', 'Superv(2)', 'Gerente(2)', 'Vend(3)', 'Superv(3)', 'Gerente(3)',
    'Vend(4)', 'Superv(4)', 'Gerente(4)', 'Vend(5)', 'Superv(5)', 'Gerente(5)',
    'Sub Canal', 'Código Companhia', 'RG', 'SSP', 'Inscr.Estadual', 'Tp Cobr',
    'Cond Pagto', 'Tabela Preço', 'Transport', 'Contábil', 'Pasta(1)', 'Seq(1)',
    'Pasta(2)', 'Seq(2)', 'Pasta(3)', 'Seq(3)', 'Pasta(4)', 'Seq(4)', 'Pasta(5)',
    'Seq(5)', 'Status', 'Dt Inclusão', 'Dt Bloqueio', 'Dt Alteração', '||FAT-Tipo',
    'Prep', 'Patente', 'Logradouro', 'Nº', 'Compl', 'Município', 'Bairro', 'UF', 'CEP',
    'Cx.Postal', '||COB-Tipo', '||ENT-Tipo', '||Referência', 'Fone(1)', 'Fone(2)',
    'Fax', 'Cel(1)', 'Cel(2)', 'Contato', 'Obs', 'Aliq.ICMS Ret', 'Aliq.ICMS Frete',
    'Contrib', 'Contrib.Arbitrado', 'ABC', 'Form.Op', 'Perc.Desc.Boleto',
    'Perc.Desc.Financ', 'Perc.Taxa Financ', 'Etiq', 'MotBlq', 'CPF Cont', 'Dt.Nascto',
    'Dt.Ult.Compra', 'Código-BW', 'Regiao+Seq', 'Email-NF-e', 'Grupo de Análise',
    'Varejista', 'ICMS Diferido', 'Consum. Final', 'Disp. Port. Vend.',
    'Disp. Port Comp.A', 'Disp. B2B', 'Desc.Canal', 'Desc.Pasta(1)', 'Lim Tit Abe',
    'Nº Dias Entrega(após visita)D+_(1-7)', 'Ouro_Preto', 'Logradouro_1', 'Nº_1',
    'Município_1', 'Bairro_1', 'UF_1', 'CEP_1', 'Cx.Postal_1', 'Logradouro_2',
    'Nº_2', 'Município_2', 'Bairro_2', 'UF_2', 'CEP_2', 'Cx.Postal_2', '__EMPTY',
    '__EMPTY_1', '__EMPTY_2', '__EMPTY_3', '__EMPTY_4', '__EMPTY_5', '__EMPTY_6',
    '__EMPTY_7', '__EMPTY_8', '__EMPTY_9', 'FILIAL', '__EMPTY_10'
];

let sql = '';
// Let's get duplicates like xlsx handles them to match EXACTLY what xlsx Outputs.
const parsedArr = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
if (parsedArr.length > 0) {
    const xlsxHeaders = Object.keys(parsedArr[0]);
    xlsxHeaders.forEach(header => {
        if (header) {
            const colName = header.trim();
            if (!dbCols.includes(colName)) {
                const safeCol = '"' + colName.replace(/"/g, '""') + '"';
                sql += 'ALTER TABLE public.pdvs ADD COLUMN IF NOT EXISTS ' + safeCol + ' TEXT;\n';
            }
        }
    });
}

fs.writeFileSync('add_cols_case_sensitive.sql', sql);
console.log('SQL generated: add_cols_case_sensitive.sql');
