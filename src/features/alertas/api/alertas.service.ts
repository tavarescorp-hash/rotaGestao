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
      supervisor_id: String(row['SUPERVISOR_ID'] || row['supervisor_id'] || row['COD_SUPERVISOR'] || row['cod_supervisor'] || ''),
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

export async function getDicaRotaHoje(user: any, dataDesejada?: string): Promise<any[]> {
  if (!user || !user.empresa_id || !navigator.onLine) return [];

  // Supervisores, Master e Niv4 recebem a dica (Niv4 adicionado para você conseguir testar)
  const isSupervisor = user.funcao?.toUpperCase().includes('SUPERVISOR') || user.nivel === 'Master' || user.nivel === 'Niv4';
  if (!isSupervisor) return [];

  // Descobrir qual o dia da semana atual (0 = Domingo, 1 = Segunda, 2 = Terça...)
  const diasSemanaSiglas = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  
  let dateObj = new Date();
  if (dataDesejada) {
      dateObj = new Date(`${dataDesejada}T12:00:00`); // Fixa o meio dia para evitar fuso horário puxando pro dia anterior
  }
  
  const diaAtual = dateObj.getDay();
  const siglaHoje = diasSemanaSiglas[diaAtual]; // Ex: 'SEX'
  
  console.log(`[RGB Alerta] Buscando para dia: ${siglaHoje} (Data base: ${dataDesejada || 'Hoje'}), user.codigo: ${user.codigo}`);

  try {
    console.log(`[RGB Alerta] Parâmetros de Busca: Empresa: ${user.empresa_id}, Dia: ${siglaHoje}, Supervisor_ID buscado: ${user.codigo}`);

    // Passo 1: Buscar os alertas RGB da empresa filtrando direto pela rota (dia da semana) e supervisor
    let queryAlertas = supabase
      .from('alertas_rgb')
      .select('clientes, base_ouro_preto, pedidos, fantasia, fds, vend, rota, supervisor_id')
      .eq('empresa_id', user.empresa_id)
      .ilike('rota', `%${siglaHoje}%`);

    // Filtro inteligente: Tenta usar o código, senão usa o ID do usuário (como está no Excel do Carlos)
    if (user.codigo) {
      queryAlertas = queryAlertas.eq('supervisor_id', String(user.codigo));
    } else {
      queryAlertas = queryAlertas.eq('supervisor_id', user.id);
    }

    const { data: alertas, error: errAlertas } = await queryAlertas;

    if (errAlertas) {
      console.error("[RGB Alerta] Erro na tabela alertas_rgb:", errAlertas);
      return [];
    }

    if (!alertas || alertas.length === 0) {
      return [];
    }

    const dicasCompletas = alertas.map(a => {
      return {
        codigo: a.clientes,
        nome_fantasia: a.fantasia || `Cliente ${a.clientes}`,
        motivo: a.vend || 'N/I', // Agora passamos o código do vendedor aqui
      };
    });

    return dicasCompletas;

  } catch (error) {
    console.error("Erro ao buscar Dicas de Rota RGB:", error);
    return [];
  }
}
