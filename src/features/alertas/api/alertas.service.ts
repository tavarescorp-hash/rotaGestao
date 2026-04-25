import { supabase } from '@/core/api/supabaseClient';

export interface AlertaRGB {
  id?: number;
  clientes: string;
  pedidos?: string;
  fantasia?: string;
  canal?: string;
  base_ouro_preto?: string;
  fds?: string;
  vend?: string;
  rota?: string;
  empresa_id: number;
}

export async function uploadAlertasRGB(fileData: any[], user: any): Promise<boolean> {
  if (!user || !user.empresa_id) return false;

  try {
    // 1. Limpa os alertas antigos da empresa antes de subir os novos
    await supabase.from('alertas_rgb').delete().eq('empresa_id', user.empresa_id);

    // 2. Prepara os novos dados mapeando as colunas exatas da planilha
    const formatData = fileData.map(row => ({
      clientes: String(row['CLIENTES'] || row['clientes'] || row['codigo'] || '').trim(),
      pedidos: String(row['PEDIDOS'] || row['pedidos'] || ''),
      fantasia: String(row['FANTASIA'] || row['fantasia'] || ''),
      canal: String(row['CANAL'] || row['canal'] || ''),
      base_ouro_preto: String(row['BASE OURO PRETO'] || row['base ouro preto'] || row['base_ouro_preto'] || ''),
      fds: String(row['FDS'] || row['fds'] || ''),
      vend: String(row['VEND'] || row['vend'] || ''),
      rota: String(row['ROTA'] || row['rota'] || ''),
      empresa_id: user.empresa_id
    })).filter(row => row.clientes !== ''); // Ignora linhas sem código (CLIENTES)

    // 3. Insere no banco
    if (formatData.length > 0) {
      const { error } = await supabase.from('alertas_rgb').insert(formatData);
      if (error) {
        console.error("Supabase Insert Error:", error);
        throw error;
      }
    }

    return true;
  } catch (error) {
    console.error("Erro no upload de Alertas RGB:", error);
    throw error;
  }
}

export async function getDicaRotaHoje(user: any): Promise<any[]> {
  if (!user || !user.empresa_id || !navigator.onLine) return [];

  // Supervisores, Master e Niv4 recebem a dica (Niv4 adicionado para você conseguir testar)
  const isSupervisor = user.funcao?.toUpperCase().includes('SUPERVISOR') || user.nivel === 'Master' || user.nivel === 'Niv4';
  if (!isSupervisor) return [];

  // Descobrir qual o dia da semana atual (0 = Domingo, 1 = Segunda, 2 = Terça...)
  const diasSemanaSiglas = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  const diaAtual = new Date().getDay();
  const siglaHoje = diasSemanaSiglas[diaAtual]; // Ex: 'SEX'
  
  console.log(`[RGB Alerta] Buscando para dia: ${siglaHoje}, user.codigo: ${user.codigo}`);

  try {
    // Passo 1: Buscar TODOS os alertas RGB da empresa
    const { data: alertas, error: errAlertas } = await supabase
      .from('alertas_rgb')
      .select('clientes, base_ouro_preto, pedidos, fds, vend')
      .eq('empresa_id', user.empresa_id);

    if (errAlertas || !alertas || alertas.length === 0) return [];

    const codigosComAlerta = alertas.map(a => a.clientes);
    console.log(`[RGB Alerta] Códigos com queda:`, codigosComAlerta);

    // Passo 2: Buscar PDVs que estão na Rota de HOJE e que estão na lista de alertas
    let query = supabase
      .from('pdvs')
      .select('codigo, razao_social, sigla, cod_supervisor')
      .eq('empresa_id', user.empresa_id)
      .ilike('rota', `%${siglaHoje}%`) // Tem a sigla em qualquer lugar da string
      .in('codigo', codigosComAlerta);

    // Se for supervisor, filtra apenas a carteira dele. Se for Master ou Niv4, vê de todos para poder testar.
    if (user.nivel !== 'Master' && user.nivel !== 'Niv4') {
      query = query.eq('cod_supervisor', user.codigo);
    }

    const { data: pdvsNaRota, error: errPdvs } = await query;

    if (errPdvs) {
      console.error("[RGB Alerta] Erro PDVs:", errPdvs);
    }

    console.log(`[RGB Alerta] PDVs encontrados na rota de hoje e com alerta:`, pdvsNaRota);

    if (!pdvsNaRota || pdvsNaRota.length === 0) return [];

    // Fazer o "join" manual das dicas com os nomes dos PDVs
    const dicasCompletas = pdvsNaRota.map(pdv => {
      const alertaRef = alertas.find(a => a.clientes === pdv.codigo);
      // Aqui definimos qual informação vai aparecer pro supervisor.
      // Vamos mostrar a "BASE OURO PRETO" ou "PEDIDOS".
      let motivo = '';
      if (alertaRef?.base_ouro_preto && alertaRef.base_ouro_preto !== 'undefined' && alertaRef.base_ouro_preto.trim() !== '') {
          motivo = `Base Ouro: ${alertaRef.base_ouro_preto}`;
      } else if (alertaRef?.pedidos && alertaRef.pedidos !== 'undefined' && alertaRef.pedidos.trim() !== '') {
          motivo = `Pedidos: ${alertaRef.pedidos}`;
      } else {
          motivo = 'Queda identificada (Ver base)';
      }

      return {
        codigo: pdv.codigo,
        nome_fantasia: pdv.sigla || pdv.razao_social,
        motivo: motivo
      };
    });

    return dicasCompletas;

  } catch (error) {
    console.error("Erro ao buscar Dicas de Rota RGB:", error);
    return [];
  }
}
