import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedUsers() {
  console.log('Iniciando cadastro de usuários de teste...')

  // 1. Buscar o Tenant Unibeer
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', 'unibeer')
    .single()

  if (!tenant) {
    console.error('Tenant Unibeer não encontrado. Rode o script de importação primeiro.')
    return
  }

  const users = [
    {
      email: 'supervisor@unibeer.com',
      password: 'senha123',
      role: 'supervisor',
      external_id: 'C100', // Carlos Tavares no CSV
      full_name: 'Carlos Tavares (Supervisor)'
    },
    {
      email: 'vendedor@unibeer.com',
      password: 'senha123',
      role: 'vendedor',
      external_id: 'C134', // Fabricio Jorge no CSV
      full_name: 'Fabricio Jorge (Vendedor)'
    }
  ]

  for (const user of users) {
    console.log(`Criando usuário: ${user.email}...`)

    // a. Criar no Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`Usuário ${user.email} já existe no Auth.`)
      } else {
        console.error(`Erro ao criar ${user.email}:`, authError.message)
        continue
      }
    }

    const userId = authUser.user?.id || (await getUserIdByEmail(user.email))

    if (userId) {
      // b. Criar ou Atualizar Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          tenant_id: tenant.id,
          full_name: user.full_name,
          role: user.role
        })

      if (profileError) {
        console.error(`Erro ao criar profile para ${user.email}:`, profileError.message)
      } else {
        console.log(`Sucesso: ${user.email} configurado.`)
      }
    }
  }

  console.log('Seed de usuários concluído!')
}

async function getUserIdByEmail(email: string) {
  const { data } = await supabase.auth.admin.listUsers()
  return data.users.find(u => u.email === email)?.id
}

seedUsers().catch(console.error)
