import { supabase } from '@/core/api/supabaseClient';
import { getAllFromDB, STORES } from '@/lib/indexedDB';

export interface VendedorAtivo {
  nome_vendedor: string;
  nome_supervisor?: string;
  codigo_sup?: string;
  municipio?: string;
  filial?: string;
  gerente?: string;
  gerente_comercial?: string;
  cod_vendedor?: string;
}

export async function buscarPdvPorCodigo(codigo: string, user?: any) {
  try {
    let codigoBuscado = codigo;

    if (/^\d+$/.test(codigoBuscado) && user?.unidade) {
      if (user.unidade.toUpperCase().includes('MACA')) {
        codigoBuscado = `M${codigoBuscado}`;
      } else if (user.unidade.toUpperCase().includes('CAMPOS')) {
        codigoBuscado = `C${codigoBuscado}`;
      }
    }

    if (!navigator.onLine) {
      console.log("🌐 Sem internet. Buscando PDV no Cache Local IndexedDB...");
      const cachePdvs = await getAllFromDB(STORES.PDVS_CACHE);
      const dataOff = cachePdvs.find(row => row.codigo === codigoBuscado);

      if (dataOff) {
        const codigoParaVerificar = dataOff.cod_vendedor?.toString() || "";
        
        let forcedData = null;
        try {
          const cacheVendedores = await getAllFromDB(STORES.VENDEDORES_CACHE);
          const vendInfo = cacheVendedores.find(v => v.cod_vendedor === codigoParaVerificar);
          if (vendInfo) {
             forcedData = {
                nome: vendInfo.nome_supervisor,
                gerente: vendInfo.gerente,
                filial: vendInfo.filial
             };
          }
        } catch(e){}

        return {
          nome_fantasia: dataOff.sigla || dataOff.razao_social,
          categoria: dataOff.porte,
          canal_cadastrado: dataOff.canal,
          filial: forcedData?.filial || dataOff.filial,
          municipio: "",
          codigo_vendedor: dataOff.cod_vendedor,
          nome_vendedor: dataOff.nome_vendedor,
          nome_supervisor: forcedData?.nome || dataOff.nome_supervisor,
          supervisor: forcedData ? "" : (dataOff.cod_supervisor ? dataOff.cod_supervisor.toString() : ""),
          gerente: forcedData?.gerente || dataOff.nome_gerente_vendas,
          coorden_x: "",
          coorden_y: ""
        };
      }
      return null;
    }

    let query = supabase
      .from("pdvs")
      .select('filial, codigo, cod_vendedor, nome_vendedor, cod_supervisor, nome_supervisor, cod_gerente, nome_gerente_vendas, nome_gerente_comercial, rota, canal, cnpj_cpf, sigla, razao_social, porte')
      .eq('codigo', codigoBuscado);

    if (user?.empresa_id) {
      query = query.eq('empresa_id', user.empresa_id);
    }

    if (user?.nivel === 'Niv4' && user?.name) {
      let supNome = user.name.toUpperCase();
      if (supNome === 'GUILHERME CHAGAS') supNome = 'GUILHERME DAS CHAGAS';
      if (supNome === 'CARLOS JUNIOR') supNome = 'CARLOS TAVARES';
      query = query.ilike('nome_supervisor', `%${supNome}%`);
    } else if (user?.nivel === 'Niv3') {
      let gerenteRef = user?.name ? user.name : null;
      if (gerenteRef?.toUpperCase() === 'CARLOS JUNIOR') gerenteRef = 'CARLOS TAVARES';
      if (gerenteRef?.toUpperCase() === 'GUILHERME CHAGAS') gerenteRef = 'GUILHERME DAS CHAGAS';

      if (user?.unidade?.toUpperCase().includes("MACA")) {
        query = query.or(`nome_gerente_vendas.eq.${gerenteRef},filial.eq.M,filial.ilike.%MACA%`);
      } else if (user?.unidade?.toUpperCase().includes("CAMPOS")) {
        query = query.or(`nome_gerente_vendas.eq.${gerenteRef},filial.eq.C,filial.ilike.%CAMPOS%`);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro banco:", error);
      return null;
    }

    if (data && data.length > 0) {
      const pdv = data[0];
      const codigoParaVerificar = pdv.cod_vendedor?.toString() || "";
      
      let forcedData: any = null;
      if (codigoParaVerificar) {
        const { data: vData } = await supabase
          .from('vendedores')
          .select('supervisores(nome, filial, gerente)')
          .eq('cod_vendedor', codigoParaVerificar)
          .single();
          
        if (vData?.supervisores) {
           forcedData = vData.supervisores;
        }
      }

      return {
        nome_fantasia: pdv.sigla || pdv.razao_social,
        categoria: pdv.porte,
        canal_cadastrado: pdv.canal,
        filial: forcedData?.filial || pdv.filial,
        municipio: "",
        codigo_vendedor: pdv.cod_vendedor,
        nome_vendedor: pdv.nome_vendedor,
        nome_supervisor: forcedData?.nome || pdv.nome_supervisor,
        supervisor: forcedData ? "" : (pdv.cod_supervisor ? pdv.cod_supervisor.toString() : ""),
        gerente: forcedData?.gerente || pdv.nome_gerente_vendas,
        coorden_x: "",
        coorden_y: ""
      };
    }
    return null;
  } catch (err) {
    console.error("Erro em buscarPdvPorCodigo:", err);
    return null;
  }
}

export async function buscarVendedoresAtivos(user?: any): Promise<VendedorAtivo[]> {
  try {
    let supervisorId = null;
    if (user?.nivel === 'Niv4' && user?.name) {
      // Uso de Wildcard % do SQL para superar divergências do tipo "Guilherme DAS Chagas" vs "guilherme.chagas"
      const cleaned = user.name.toUpperCase().replace(/[^A-Z0-9]/g, '%');
      supervisorId = `%${cleaned}%`;
      
      if (supervisorId.includes('CARLOS%JUNIOR')) supervisorId = '%CARLOS%TAVARES%';
    }

    let gerenteRef = user?.nivel === 'Niv3' && user?.name ? user.name.toUpperCase().replace(/\./g, ' ') : null;
    if (gerenteRef === 'CARLOS JUNIOR') gerenteRef = 'CARLOS TAVARES';
    if (gerenteRef === 'GUILHERME CHAGAS') gerenteRef = 'GUILHERME DAS CHAGAS';

    if (!navigator.onLine) {
      console.log("🌐 Sem internet. Buscando Vendedores no Cache Local (Novo Modelo)...");
      const cacheVendedores = await getAllFromDB(STORES.VENDEDORES_CACHE);
      
      return cacheVendedores.filter(vend => {
        if (user?.nivel === 'Niv4' && user?.name) {
          const search = user.name.toUpperCase();
          return vend.nome_supervisor?.toUpperCase().includes(search);
        } else if (user?.nivel === 'Niv3') {
          const gRef = gerenteRef || "";
          if (user.unidade?.toUpperCase().includes("MACA")) {
            return vend.filial === 'M' || vend.filial?.toUpperCase().includes('MACAE') || (vend.gerente && vend.gerente.toUpperCase() === gRef);
          } else if (user.unidade?.toUpperCase().includes("CAMPOS")) {
            return vend.filial === 'C' || vend.filial?.toUpperCase().includes('CAMPOS') || (vend.gerente && vend.gerente.toUpperCase() === gRef);
          }
          return vend.gerente && vend.gerente.toUpperCase() === gRef;
        }
        return true;
      });
    } else {
      let queryVend = supabase.from("vendedores").select(`
        cod_vendedor,
        nome,
        cidade,
        supervisores!inner (
          id,
          nome,
          filial,
          gerente,
          gerente_comercial
        )
      `);

      if (user?.empresa_id) {
        queryVend = queryVend.eq('empresa_id', user.empresa_id);
      }

      if (user?.nivel === 'Niv4' && supervisorId) {
        queryVend = queryVend.ilike('supervisores.nome', supervisorId);
      } else if (user?.nivel === 'Niv3') {
        if (user.unidade?.toUpperCase().includes("MACA")) {
          queryVend = queryVend.or('filial.eq.M,filial.ilike.%MACAE%', { foreignTable: 'supervisores' });
        } else if (user.unidade?.toUpperCase().includes("CAMPOS")) {
          queryVend = queryVend.or('filial.eq.C,filial.ilike.%CAMPOS%', { foreignTable: 'supervisores' });
        }
      }

      let data: any[] | null = null;
      let error: any = null;

      const res = await queryVend;
      data = res.data;
      error = res.error;

      // Resiliência: Se a coluna gerente_comercial ainda não existir no Supabase, tenta sem ela
      if (error && (error.code === '42703' || error.message?.includes('gerente_comercial'))) {
        console.warn("Coluna gerente_comercial ausente no Supabase. Tentando fallback...");
        const queryFallback = supabase.from("vendedores").select(`
          cod_vendedor,
          nome,
          cidade,
          supervisores!inner (
            id,
            nome,
            filial,
            gerente
          )
        `);
        
        let qf = queryFallback;
        if (user?.empresa_id) qf = qf.eq('empresa_id', user.empresa_id);
        if (user?.nivel === 'Niv4' && supervisorId) qf = qf.ilike('supervisores.nome', supervisorId);
        
        const { data: d2, error: e2 } = await qf;
        data = d2;
        error = e2;
      }

      if (error) {
        console.error("Erro ao buscar vendedores ativos:", error);
        return [];
      }

      const formatado: VendedorAtivo[] = (data as any[]).map((r: any) => ({
        cod_vendedor: r.cod_vendedor,
        nome_vendedor: r.nome,
        nome_supervisor: r.supervisores?.nome || "",
        codigo_sup: r.supervisores?.id?.toString() || "",
        municipio: r.cidade || "",
        filial: r.supervisores?.filial || "",
        gerente: r.supervisores?.gerente || "",
        gerente_comercial: (r.supervisores as any)?.gerente_comercial || ""
      }));

      return formatado;
    }
  } catch (error) {
    console.error("Erro inesperado ao buscar vendedores ativos:", error);
    return [];
  }
}

export async function uploadBasePDVs(dados: any[], user?: any): Promise<{ success: boolean; message: string }> {
  try {
    const chunkSize = 1000;
    const empresaId = user?.empresa_id || 1;

    // --- ETAPA 1: ETL DE SUPERVISORES ---
    const uniqueSupervisors = new Map<string, any>();
    dados.forEach(row => {
      const nomeSup = row.nome_supervisor?.trim();
      if (nomeSup && !uniqueSupervisors.has(nomeSup)) {
        uniqueSupervisors.set(nomeSup, {
          nome: nomeSup.toUpperCase(),
          filial: row.filial?.trim() || null,
          gerente: row.nome_gerente_vendas?.trim() || null,
          gerente_comercial: row.nome_gerente_comercial?.trim() || null,
          empresa_id: empresaId
        });
      }
    });

    if (uniqueSupervisors.size > 0) {
      const supList = Array.from(uniqueSupervisors.values());
      const { error: errSup } = await supabase
        .from('supervisores')
        .upsert(supList, { onConflict: 'nome, empresa_id' });
      if (errSup) throw new Error(`Falha ao injetar Supervisores: ${errSup.message}`);
    }

    // Buscar os IDs reais gerados no Supabase para ligar aos vendedores
    const { data: supData } = await supabase
      .from('supervisores')
      .select('id, nome')
      .eq('empresa_id', empresaId);
    
    const supMap = new Map<string, number>();
    if (supData) supData.forEach(s => supMap.set(s.nome, s.id));

    // --- ETAPA 2: ETL DE VENDEDORES (ROTAS) ---
    const uniqueVendedores = new Map<string, any>();
    dados.forEach(row => {
      const codVend = row.cod_vendedor?.toString().trim() || row.codigo_vendedor?.toString().trim();
      const nomeVend = row.nome_vendedor?.trim();
      const nomeSup = row.nome_supervisor?.trim()?.toUpperCase();
      
      if (codVend && nomeVend && !uniqueVendedores.has(codVend)) {
        uniqueVendedores.set(codVend, {
          cod_vendedor: codVend.toUpperCase(),
          nome: nomeVend.toUpperCase(),
          cidade: null,
          supervisor_id: nomeSup ? supMap.get(nomeSup) : null,
          empresa_id: empresaId
        });
      }
    });

    if (uniqueVendedores.size > 0) {
      const vendList = Array.from(uniqueVendedores.values());
      const { error: errVend } = await supabase
        .from('vendedores')
        .upsert(vendList, { onConflict: 'cod_vendedor, empresa_id' });
      if (errVend) throw new Error(`Falha ao injetar Vendedores: ${errVend.message}`);
    }

    // --- ETAPA 3: ATUALIZAÇÃO DA BASE DE CLIENTES (PDVs) ---
    const { error: errorDel } = await supabase.from("pdvs").delete().eq('empresa_id', empresaId);
    if (errorDel) throw errorDel;

    for (let i = 0; i < dados.length; i += chunkSize) {
      const chunk = dados.slice(i, i + chunkSize);
      const cleanChunk = chunk.map(row => {
        const cleanRow: any = {};
        for (const key in row) {
          const lowerKey = key.toLowerCase();
          if (['id', 'created_at', 'updated_at'].includes(lowerKey)) continue;

          if (row[key] !== undefined && row[key] !== null) {
            if (lowerKey.includes('cod') || lowerKey.includes('cnpj')) {
              cleanRow[key] = String(row[key] || "");
            } else {
              cleanRow[key] = String(row[key]);
            }
          }
        }
        cleanRow.empresa_id = empresaId;
        return cleanRow;
      });

      const { error: errorIns } = await supabase.from("pdvs").insert(cleanChunk);
      if (errorIns) throw errorIns;
    }

    return { success: true, message: `Integração ETL 100% concluída: ${uniqueSupervisors.size} Gerências, ${uniqueVendedores.size} Vendedores e ${dados.length} PDVs inseridos!` };
  } catch (error: any) {
    console.error("Erro técnico no upload (ETL):", error);
    return { success: false, message: error.message || "Erro desconhecido ao processar base ETL de PDVs." };
  }
}


export async function downloadBasePDVs(user?: any) {
  try {
    let allData: any[] = [];
    let from = 0;
    const step = 1000;
    let fetchMore = true;

    const empresaId = user?.empresa_id || 1;

    while (fetchMore) {
      const { data, error } = await supabase
        .from('pdvs')
        .select('*')
        .eq('empresa_id', empresaId)
        .range(from, from + step - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += step;
      } else {
        fetchMore = false;
      }
    }
    return allData;
  } catch (error) {
    console.error("Erro ao baixar base de PDVs:", error);
    return null;
  }
}
