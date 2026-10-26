import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse'
import { createClient } from '@supabase/supabase-js'

// 1. Configurações (Preencher no .env ou aqui para o teste)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_KEY'

if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
  console.error('ERRO: Por favor, configure as variáveis de ambiente do Supabase.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function importData() {
  const csvFilePath = path.join(process.cwd(), 'unibeerBase.csv')
  const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' })

  // 2. Criar ou Obter o Tenant Unibeer
  const { data: tenant, error: tError } = await supabase
    .from('tenants')
    .upsert({ name: 'Unibeer', slug: 'unibeer' }, { onConflict: 'slug' })
    .select()
    .single()

  if (tError) throw tError
  console.log(`Tenant Unibeer ID: ${tenant.id}`)

  // 3. Processar CSV
  const parser = parse(fileContent, {
    delimiter: ';',
    columns: false, // Não tem header
    skip_empty_lines: true
  })

  interface ColaboradorRecord {
    tenant_id: string
    external_id: string
    name: string
    role: string
  }

  interface PdvRecord {
    tenant_id: string
    external_id: string
    name_fantasy: string
    company_name: string
    cnpj_cpf: string
    channel: string
    segmentation: string
    frequency: string
    external_vendedor_id: string
    active: boolean
  }

  let rowCount = 0

  const colaboradoresToUpsert = new Map<string, ColaboradorRecord>()
  const pdvsToUpsert: PdvRecord[] = []

  for await (const record of parser) {
    rowCount++
    const [
      , , codCliente, codVendedor, nomeVendedor, 
      codSupervisor, nomeSupervisor, codGerente, nomeGerente, 
      codDiretor, nomeDiretor, frequencia, canal, 
      cnpj, nomeFantasia, razaoSocial, segmentacao
    ] = (record as string[]).map((s: string) => s?.trim())

    if (!codCliente) continue

    // Armazenar colaboradores para upsert em massa posterior (ou gradual)
    // Mantendo a hierarquia simplificada (nomes e cargos)
    if (codDiretor) colaboradoresToUpsert.set(codDiretor, { tenant_id: tenant.id, external_id: codDiretor, name: nomeDiretor, role: 'diretor' })
    if (codGerente) colaboradoresToUpsert.set(codGerente, { tenant_id: tenant.id, external_id: codGerente, name: nomeGerente, role: 'gerente' })
    if (codSupervisor) colaboradoresToUpsert.set(codSupervisor, { tenant_id: tenant.id, external_id: codSupervisor, name: nomeSupervisor, role: 'supervisor' })
    if (codVendedor) colaboradoresToUpsert.set(codVendedor, { tenant_id: tenant.id, external_id: codVendedor, name: nomeVendedor, role: 'vendedor' })

    pdvsToUpsert.push({
      tenant_id: tenant.id,
      external_id: codCliente,
      name_fantasy: nomeFantasia,
      company_name: razaoSocial,
      cnpj_cpf: cnpj,
      channel: canal,
      segmentation: segmentacao,
      frequency: frequencia,
      external_vendedor_id: codVendedor, // Usaremos para vincular depois
      active: true
    })

    if (rowCount % 500 === 0) {
      console.log(`Lendo linha ${rowCount}...`)
    }
  }

  // 4. Inserir Colaboradores em Lote
  console.log('Inserindo colaboradores...')
  const colsArray = Array.from(colaboradoresToUpsert.values())
  const { error: colError } = await supabase.from('colaboradores').upsert(colsArray, { onConflict: 'tenant_id, external_id' })
  if (colError) throw colError

  // Buscar os IDs gerados para vincular PDVs
  const { data: colsData } = await supabase.from('colaboradores').select('id, external_id').eq('tenant_id', tenant.id)
  const colIdMap = new Map(colsData?.map(c => [c.external_id, c.id]))

  // 5. Inserir PDVs em Lote (Chunks de 500 para evitar timeout)
  console.log('Inserindo PDVs em lotes...')
  const batchSize = 500
  for (let i = 0; i < pdvsToUpsert.length; i += batchSize) {
    const batch = pdvsToUpsert.slice(i, i + batchSize).map(p => {
      const { external_vendedor_id, ...rest } = p
      return {
        ...rest,
        colaborador_id: colIdMap.get(external_vendedor_id)
      }
    })

    const { error: batchError } = await supabase.from('pdvs').upsert(batch, { onConflict: 'tenant_id, external_id' })
    if (batchError) console.error(`Erro no lote ${i}:`, batchError.message)
    
    console.log(`Progresso PDVs: ${Math.min(i + batchSize, pdvsToUpsert.length)} / ${pdvsToUpsert.length}`)
  }

  console.log('Importação concluída com sucesso!')
}

importData().catch(console.error)
