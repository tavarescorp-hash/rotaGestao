import { supabase } from '@/core/api/supabaseClient';
import { getAllFromDB, STORES } from '@/lib/indexedDB';
import { normalizeName } from '@/lib/utils';

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
        } catch (e) { }

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
      const cleaned = user.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, '%');
      supervisorId = `%${cleaned}%`;

      if (supervisorId.includes('CARLOS%JUNIOR')) supervisorId = '%CARLOS%TAVARES%';
    }

    let gerenteRef: string | null = null;
    if ((user?.nivel === 'Niv3' || user?.nivel === 'Niv2') && user?.name) {
      const cleaned = user.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, '%');
      gerenteRef = `%${cleaned}%`;

      if (gerenteRef.includes('CARLOS%JUNIOR')) gerenteRef = '%CARLOS%TAVARES%';
      if (gerenteRef.includes('GUILHERME%CHAGAS')) gerenteRef = '%GUILHERME%DAS%CHAGAS%';
    }

    console.log(`📊 [DEBUG HIERARQUIA] User: ${user?.name} | Nível: ${user?.nivel} | GerenteRef: ${gerenteRef}`);

    if (!navigator.onLine) {
      console.log("🌐 Sem internet. Buscando Vendedores no Cache Local (Novo Modelo)...");
      const cacheVendedores = await getAllFromDB(STORES.VENDEDORES_CACHE);

      return cacheVendedores.filter(vend => {
        if (user?.nivel === 'Niv4' && user?.name) {
          const search = user.name.toUpperCase();
          return vend.nome_supervisor?.toUpperCase().includes(search);
        } else if (user?.nivel === 'Niv2' || user?.nivel === 'Niv3') {
          const gRef = (gerenteRef?.replace(/%/g, '') || "").toUpperCase();
          const loginU = (user?.name || "").toUpperCase();
          const uUnid = (user?.unidade || "").toUpperCase();
          
          const isMacaeUser = uUnid.includes("MACA") || uUnid === "M" || normalizeName(loginU).includes(normalizeName("DIEGO MANHANINI"));
          const isCamposUser = uUnid.includes("CAMPOS") || uUnid === "C" || loginU.includes("CAMPOS");
          const isMasterView = uUnid === 'TODAS' || uUnid === '';

          const matchesGerente = (vend.gerente_comercial?.toUpperCase()?.includes(gRef)) || (vend.gerente?.toUpperCase()?.includes(gRef));
          
          const matchesFilial = (isMacaeUser && (vend.filial === 'M' || vend.filial?.toUpperCase().includes('MACAE'))) ||
                               (isCamposUser && (vend.filial === 'C' || vend.filial?.toUpperCase().includes('CAMPOS'))) ||
                               isMasterView;

          return matchesGerente || matchesFilial;
        }
        return true;
      });
    } else {
      let queryVend = supabase.from("vendedores").select(`
        cod_vendedor,
        nome,
        cidade
      `);

      if (user?.empresa_id) {
        queryVend = queryVend.eq('empresa_id', user.empresa_id);
      }

      // Filtramos em JS para evitar erro 42703 (coluna inexistente) e ser resiliente a variações de esquema
      let data: any[] | null = null;
      let error: any = null;

      const res = await queryVend;
      data = res.data;
      error = res.error;

      console.log(`📊 [DEBUG HIERARQUIA] Resultado SQL: ${data?.length || 0} vnds | Erro:`, error);


      if (error) {
        console.error("Erro ao buscar vendedores ativos SQL BASE:", error);
        // Em vez de matar o processo e esconder a equipe, repassa um array vazio para forçar a ação do DATALAKE RESCUE.
        data = [];
      }

      let formatado: VendedorAtivo[] = (data as any[]).map((r: any) => {
        const s = r.supervisores || {};
        return {
          cod_vendedor: r.cod_vendedor,
          nome_vendedor: r.nome,
          nome_supervisor: s.nome || "",
          codigo_sup: s.id?.toString() || "",
          municipio: r.cidade || "",
          filial: s.filial || "",
          gerente: s.gerente || "",
          // Tenta encontrar o Gerente Comercial em qualquer coluna que ele possa estar
          gerente_comercial: s.gerente_comercial || s.nome_gerente_comercial || r.nome_gerente_comercial || s.gerente_com || ""
        };
      });

      const isAnalista = user?.funcao?.toUpperCase().includes('ANALISTA') || user?.nivel === 'Niv0';

      if (isAnalista) {
        // Analista não filtra nada no JS (Visão de Diretor)
      } else if (user?.nivel === 'Niv4' && supervisorId) {
        const sMatch = supervisorId.replace(/%/g, '').toUpperCase();
        formatado = formatado.filter(v => v.nome_supervisor?.toUpperCase().includes(sMatch));
      } else if (user?.nivel === 'Niv2' && gerenteRef) {
        const gMatch = gerenteRef.replace(/%/g, '').toUpperCase();
        const uUnidRaw = String(user?.unidade || "");
        const uUnid = uUnidRaw === "null" || uUnidRaw === "undefined" ? "" : uUnidRaw.toUpperCase();
        const loginU = (user?.name || "").toUpperCase();
        
        formatado = formatado.filter(v => {
          const matchesGCom = v.gerente_comercial?.toUpperCase().includes(gMatch) ||
            v.gerente?.toUpperCase().includes(gMatch);

          const isMacaeUser = uUnid.includes("MACA") || uUnid === "M" || normalizeName(loginU).includes(normalizeName("DIEGO MANHANINI"));
          const isCamposUser = uUnid.includes("CAMPOS") || uUnid === "C" || loginU.includes("CAMPOS");
          const isMasterView = uUnid === 'TODAS' || uUnid === '';
          
          const emptyUnid = uUnid === '' || uUnid === 'NULL' || uUnid === 'UNDEFINED';

          const matchesFilial = (isMacaeUser && (v.filial === 'M' || v.filial?.toUpperCase().includes('MACAE'))) ||
                               (isCamposUser && (v.filial === 'C' || v.filial?.toUpperCase().includes('CAMPOS'))) ||
                               isMasterView;

          return matchesGCom || matchesFilial || emptyUnid;
        });
      } else if (user?.nivel === 'Niv3' && gerenteRef) {
        const gMatch = gerenteRef.replace(/%/g, '').toUpperCase();
        const uUnidRaw = String(user?.unidade || "");
        const uUnid = uUnidRaw === "null" || uUnidRaw === "undefined" ? "" : uUnidRaw.toUpperCase();
        const loginU = (user?.name || "").toUpperCase();

        console.log(`📊 [DATA_SERVICE] Iniciando Filtro Niv3 para ${user?.name}. Unidade: ${uUnid}. Ref: ${gMatch}`);

        formatado = formatado.filter(v => {
          const nGerente = normalizeName(v.gerente);
          const nMatch = normalizeName(gMatch);
          const matchesGerente = nGerente.includes(nMatch);
          
          const isMacaeUser = uUnid.includes("MACA") || uUnid === "M" || normalizeName(loginU).includes(normalizeName("DIEGO MANHANINI"));
          const isCamposUser = uUnid.includes("CAMPOS") || uUnid === "C" || normalizeName(loginU).includes(normalizeName("CAMPOS"));
          const isMasterView = uUnid === 'TODAS' || uUnid === '';

          // Acesso Exclusivo por Filial
          const matchesFilial = (isMacaeUser && (v.filial === 'M' || v.filial?.toUpperCase().includes('MACAE'))) ||
                               (isCamposUser && (v.filial === 'C' || v.filial?.toUpperCase().includes('CAMPOS'))) ||
                               isMasterView;

          return matchesGerente || matchesFilial;
        });
      }

      if ((user?.nivel === 'Niv1' || user?.nivel === 'Niv0' || user?.nivel === 'Niv2' || user?.nivel === 'Niv3' || isAnalista) && gerenteRef) {
        console.log("🚑 [DEBUG HIERARQUIA] Iniciando Busca Híbrida Aditiva (DataLake)...");

        // Vamos baixar o bulk bruto e filtrar com segurança no Javascript para evitar falhas silenciosas do PostgREST (.or syntax crash)
        let dlQuery = supabase.from("pdvs")
          .select('cod_vendedor, codigo, nome_vendedor, nome_supervisor, cod_supervisor, filial, nome_gerente_vendas, nome_gerente_comercial')
          .limit(6000);
        
        if (user?.empresa_id) dlQuery = dlQuery.eq('empresa_id', user.empresa_id);

        const { data: pdvData, error: errRescue } = await dlQuery;

        if (errRescue) {
           console.error("Erro fatal no DataLake Rescue:", errRescue);
        }

        if (pdvData && pdvData.length > 0) {
          const gMatch = (gerenteRef || "").replace(/%/g, '').toUpperCase();
          const uUnidRaw = String(user?.unidade || "");
          const uUnid = uUnidRaw === "null" || uUnidRaw === "undefined" ? "" : uUnidRaw.toUpperCase();
          const loginU = (user?.name || "").toUpperCase();

          const isMacaeUser = uUnid.includes("MACA") || uUnid === "M" || normalizeName(loginU).includes("diegomanhanini");
          const isCamposUser = uUnid.includes("CAMPOS") || uUnid === "C" || normalizeName(loginU).includes("campos");
          const isMasterView = uUnid === 'TODAS' || uUnid === '';

          const pdvFiltrado = pdvData.filter((p: any) => {
             const nSales = normalizeName(p.nome_gerente_vendas);
             const nComercial = normalizeName(p.nome_gerente_comercial);
             const nMatch = normalizeName(gMatch);
             const matchesGerente = nSales.includes(nMatch) || nComercial.includes(nMatch);
             
             const matchesFilial = (isMacaeUser && (p.filial === 'M' || p.filial?.toUpperCase().includes('MACA'))) ||
                                  (isCamposUser && (p.filial === 'C' || p.filial?.toUpperCase().includes('CAMPOS'))) ||
                                  isMasterView;

             return matchesGerente || matchesFilial;
          });

          if (isMacaeUser && pdvFiltrado.length === 0 && pdvData.length > 0) {
            console.warn("🛡️ [ALERTA] Filtro de Macaé retornou ZERO mesmo com dados no banco. Forçando inclusão por Filial...");
            // Fallback nuclear: se fôr Diego/Macaé e o filtro falhou, pega tudo que fôr 'M'
            pdvData.filter(p => p.filial === 'M').forEach(p => pdvFiltrado.push(p));
          }

          console.log(`🚑 [DEBUG HIERARQUIA] Resgatados pós-filtro na RAM: ${pdvFiltrado.length} records.`);
          const vMap = new Map<string, VendedorAtivo>();

          // 1. Prioridade para o que já estava formatado (Cadastro Oficial)
          // Se fôr usuário de Macaé, ignoramos o 'vendedores' oficial para evitar vazamentos de Campos
          if (!isMacaeUser) {
            formatado.forEach(v => vMap.set(v.cod_vendedor || v.nome_vendedor, v));
          }

          // 2. Complemento via PDVs (Data Lake)
          pdvFiltrado.forEach(p => {
            if (!vMap.has(p.cod_vendedor)) {
              vMap.set(p.cod_vendedor, {
                cod_vendedor: p.cod_vendedor || p.codigo,
                nome_vendedor: p.nome_vendedor || "VENDEDOR " + (p.cod_vendedor || p.codigo || "MACAÉ"),
                nome_supervisor: (p.nome_supervisor || "").replace(/[\n\r]/g, '').trim(),
                codigo_sup: p.cod_supervisor?.toString() || "",
                filial: (p.filial || "").replace(/[\n\r]/g, '').trim(),
                gerente: (p.nome_gerente_vendas || "").replace(/[\n\r]/g, '').trim(),
                gerente_comercial: (p.nome_gerente_comercial || "").replace(/[\n\r]/g, '').trim()
              });
            }
          });
          formatado = Array.from(vMap.values());
          console.log(`🚑 [DEBUG HIERARQUIA] Fusão concluída: ${formatado.length} vnds totais.`);
        }
      }

      console.log(`📊 [DEBUG HIERARQUIA] Pós-Filtro: ${formatado.length} vnds`);
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
