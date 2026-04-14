import { supabase } from '@/core/api/supabaseClient';
import { getAllFromDB, STORES } from '@/lib/indexedDB';
import { normalizeName, isBranchMatch } from '@/lib/utils';

export interface VendedorAtivo {
  nome_vendedor: string;
  nome_supervisor?: string;
  codigo_sup?: string;
  id_supervisor?: string | null;
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
      const unid = normalizeName(user.unidade || "");
      if (unid.includes('macae') || unid === 'm') {
        codigoBuscado = `M${codigoBuscado}`;
      } else if (unid.includes('campos') || unid === 'c') {
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

    const { data, error } = await query;

    if (error) {
      console.error("Erro banco:", error);
      return null;
    }

    if (!data || data.length === 0) {
      throw new Error("Cliente não encontrado na base de dados. Verifique o código e a unidade.");
    }

    const pdv = data[0];

    // Validação de Permissão Nível 4 (Supervisor) com normalização robusta
    if (user?.nivel === 'Niv4' && user?.name) {
      const supPdv = normalizeName(pdv.nome_supervisor);
      const supLogado = normalizeName(user.name);

      if (supPdv !== supLogado && !supPdv.includes(supLogado) && !supLogado.includes(supPdv)) {
        throw new Error(`Este PDV está vinculado ao supervisor ${pdv.nome_supervisor || 'outro'}. Você não possui permissão para acessá-lo.`);
      }
    }

    // Validação de Gestão Nível 3 (Gerente)
    if (user?.nivel === 'Niv3' && user?.name) {
      const gvPdv = normalizeName(pdv.nome_gerente_vendas);
      const gvLogado = normalizeName(user.name);
      const uUnid = user.unidade;
      const fPdv = pdv.filial;
      const isSameBranch = isBranchMatch(uUnid, fPdv);

      if (gvPdv !== gvLogado && !gvPdv.includes(gvLogado) && !gvLogado.includes(gvPdv) && !isSameBranch) {
        throw new Error("Este PDV não pertence à sua estrutura de gestão ou unidade.");
      }
    }

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
    } catch (err) {
      console.error("Erro em buscarPdvPorCodigo:", err);
      return null;
    }
}

export async function buscarVendedoresAtivos(user?: any): Promise<VendedorAtivo[]> {
  try {
    let supervisorId = null;
    if (user?.nivel === 'Niv4' && user?.name) {
      const cleaned = user.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, '%');
      supervisorId = `%${cleaned}%`;
    }

    let gerenteRef: string | null = null;
    if ((user?.nivel === 'Niv3' || user?.nivel === 'Niv2') && user?.name) {
      const cleaned = user.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, '%');
      gerenteRef = `%${cleaned}%`;
    }

    console.log(`📊 [DEBUG HIERARQUIA] User: ${user?.name} | Nível: ${user?.nivel} | GerenteRef: ${gerenteRef}`);

    if (!navigator.onLine) {
      console.log("🌐 Sem internet. Buscando Vendedores no Cache Local (Novo Modelo)...");
      const cacheVendedores = await getAllFromDB(STORES.VENDEDORES_CACHE);

      const nMatch = normalizeName(user?.name);
      return cacheVendedores.filter(vend => {
        if (user?.nivel === 'Niv4' && user?.name) {
          const search = user.name.toUpperCase();
          return vend.nome_supervisor?.toUpperCase().includes(search);
        } else if (user?.nivel === 'Niv2' || user?.nivel === 'Niv3') {
          const matchesGerente = normalizeName(vend.gerente).includes(nMatch);
          const isMasterView = normalizeName(user?.unidade || "") === 'todas' || normalizeName(user?.unidade || "") === '';
          const matchesFilial = isBranchMatch(user?.unidade, vend.filial) || isMasterView;

          return matchesGerente || matchesFilial;
        }
        return true;
      });
    } else {
      let queryVend = supabase.from("vendedores").select(`
        cod_vendedor,
        nome,
        cidade,
        supervisores (
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

      const { data: dataSups, error: errSups } = await supabase.from('supervisores').select('*');
      
      const res = await queryVend;
      let data = res.data;
      let error = res.error;

      console.log(`📊 [DEBUG HIERARQUIA] Resultado SQL: ${data?.length || 0} vnds | ${dataSups?.length || 0} sups | Erro:`, error);

      if (error && !dataSups) {
        console.error("Erro ao buscar vendedores ativos SQL BASE:", error);
        data = [];
      }

      // 1. Criar base de vendedores (via Tabela Vendedores)
      let formatado: VendedorAtivo[] = (data as any[]).map((r: any) => {
        const s = r.supervisores || {};
        return {
          cod_vendedor: r.cod_vendedor,
          nome_vendedor: r.nome,
          nome_supervisor: s.nome || "",
          codigo_sup: s.id?.toString() || "",
          id_supervisor: s.id?.toString() || "",
          municipio: r.cidade || "",
          filial: s.filial || "",
          gerente: s.gerente || "",
          gerente_comercial: s.gerente_comercial || s.nome_gerente_comercial || r.nome_gerente_comercial || s.gerente_com || ""
        };
      });

      // 2. Injetar Supervisores (Garante que o Supervisor apareça mesmo sem vendedores vinculados ainda)
      // Bloqueamos a injeção do próprio usuário logado para evitar o "Auto-Card" redundante
      if (dataSups) {
        dataSups.forEach((s: any) => {
          const supKey = `SUP-${s.id}`;
          const isMe = normalizeName(s.nome) === normalizeName(user?.name) || 
                       (user?.email && normalizeName(s.nome).includes(normalizeName(user.email.split('@')[0])));
          if (!formatado.some(f => f.nome_supervisor === s.nome) && !isMe) {
            formatado.push({
              cod_vendedor: supKey,
              nome_vendedor: s.nome, 
              nome_supervisor: s.nome,
              codigo_sup: s.id?.toString(),
              id_supervisor: s.id?.toString(),
              filial: s.filial,
              gerente: s.gerente,
              gerente_comercial: s.gerente_comercial || s.nome_gerente_comercial || ""
            });
          }
        });
      }

      // 3. Resgate por Atividade (Visitas Realizadas): Garante que vendedores avaliados apareçam na lista
      if (user?.name || user?.id) {
        const { data: dataVts } = await supabase
          .from('visitas')
          .select('nome_vendedor, codigo_vendedor, filial, municipio, avaliador')
          .or(`id_avaliador.eq.${user?.id || 'null'},avaliador.eq.${user?.name || 'null'}`)
          .limit(100);

        if (dataVts && dataVts.length > 0) {
          const nMe = normalizeName(user?.name || "");
          dataVts.forEach((v: any) => {
             const vKey = v.codigo_vendedor || v.nome_vendedor;
             const isMeVnd = normalizeName(v.nome_vendedor || "") === nMe;
             
             if (vKey && !formatado.some(f => f.nome_vendedor === v.nome_vendedor) && !isMeVnd) {
                formatado.push({
                  cod_vendedor: vKey,
                  nome_vendedor: v.nome_vendedor,
                  nome_supervisor: user.name, // Se ele avaliou, ele é o supervisor de fato nessa visão
                  codigo_sup: user.id?.toString(),
                  id_supervisor: user.id?.toString(),
                  filial: v.filial || "",
                  municipio: v.municipio || "",
                  gerente: "",
                  gerente_comercial: ""
                });
             }
          });
        }
      }

      const isAnalista = user?.funcao?.toUpperCase().includes('ANALISTA') || user?.nivel === 'Niv0';

      if (isAnalista) {
        // Analista não filtra nada no JS (Visão de Diretor)
      } else if (user?.nivel === 'Niv4' && supervisorId) {
        const nMatch = normalizeName(supervisorId.replace(/%/g, ''));
        formatado = formatado.filter(v => normalizeName(v.nome_supervisor).includes(nMatch));
      } else if (user?.nivel === 'Niv2' && gerenteRef) {
        const uUnidRaw = String(user?.unidade || "");
        const uUnid = uUnidRaw === "null" || uUnidRaw === "undefined" ? "" : uUnidRaw.toUpperCase();
        const nMatch = normalizeName(gerenteRef.replace(/%/g, ''));

        formatado = formatado.filter(v => {
          const matchesGCom = normalizeName(v.gerente_comercial).includes(nMatch) ||
            normalizeName(v.gerente).includes(nMatch);

          const isMasterView = normalizeName(user?.unidade || "") === 'todas' || normalizeName(user?.unidade || "") === '';
          const emptyUnid = !user?.unidade || normalizeName(user.unidade) === 'null';

          const matchesFilial = isBranchMatch(user?.unidade, v.filial) || isMasterView;

          return matchesGCom || matchesFilial || emptyUnid;
        });
      } else if (user?.nivel === 'Niv3' && gerenteRef) {
        const nMatch = normalizeName(gerenteRef.replace(/%/g, ''));
        const uUnidRaw = String(user?.unidade || "");
        const uUnid = uUnidRaw === "null" || uUnidRaw === "undefined" ? "" : uUnidRaw.toUpperCase();

        formatado = formatado.filter(v => {
          const matchesGerente = normalizeName(v.gerente).includes(nMatch);
          const isMasterView = normalizeName(user?.unidade || "") === 'todas' || normalizeName(user?.unidade || "") === '';

          const matchesFilial = isBranchMatch(user?.unidade, v.filial) || isMasterView;

          return matchesGerente || matchesFilial;
        });
      }

      if ((user?.nivel === 'Niv4' || user?.nivel === 'Niv1' || user?.nivel === 'Niv0' || user?.nivel === 'Niv2' || user?.nivel === 'Niv3' || isAnalista)) {
        // Buscamos os PDVs (DataLake) para complementar a hierarquia (Rescue Force)
        const nMatchStr = normalizeName(user?.name || "");
        const uUnid = normalizeName(user?.unidade || "");
        const isMacae = uUnid.includes('macae') || uUnid === 'm';
        const isCampos = uUnid.includes('campos') || uUnid === 'c';

        // Aprimoramento: Busca resiliente por curingas (ex: Cleyton%Souza matches Cleyton de Souza)
        const rawNameForDB = (user?.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
        const searchWildcard = rawNameForDB.split(' ').filter((x: string) => x.length > 2).join('%');
        const finalMatch = searchWildcard || rawNameForDB;

        // Construímos um filtro OR cirúrgico e ESTRITAMENTE NOMINAL
        // Não usamos mais 'filial.eq.M' em OR porque isso estourava o limite de 1000 registros da API
        // e causava "cortes" aleatórios na equipe de Macaé.
        let orFilter = `nome_gerente_vendas.ilike.%${finalMatch}%,nome_gerente_comercial.ilike.%${finalMatch}%`;
        
        if (user?.nivel === 'Niv4') {
          orFilter = `nome_supervisor.ilike.%${finalMatch}%`;
        }

        let dlQuery = supabase.from("pdvs")
          .select('cod_vendedor, codigo, nome_vendedor, nome_supervisor, id_supervisor, cod_supervisor, filial, nome_gerente_vendas, nome_gerente_comercial')
          .or(orFilter);

        if (user?.empresa_id) dlQuery = dlQuery.eq('empresa_id', user.empresa_id);

        const { data: pdvData, error: errRescue } = await dlQuery;

        if (pdvData && pdvData.length > 0) {
          const isMasterView = uUnid === 'todas' || uUnid === '';

          const pdvFiltrado = pdvData.filter((p: any) => {
            const matchesId = p.id_supervisor && user?.id && p.id_supervisor === user.id;
            if (matchesId) return true;

            const nSales = normalizeName(p.nome_gerente_vendas || "");
            const nComercial = normalizeName(p.nome_gerente_comercial || "");
            const nSup = normalizeName(p.nome_supervisor || "");
            
            const matchesGerente = nSales.includes(nMatchStr) || nComercial.includes(nMatchStr);
            const matchesSup = nSup.includes(nMatchStr);

            // 1. Prioridade: Se o nome do líder bate com o filtro, INCLUA.
            if (user?.nivel === 'Niv4') {
              if (matchesSup) return true;
            } else {
              if (matchesGerente) return true;
            }

            // 2. Fallback: Unidade
            const matchesFilial = isBranchMatch(user?.unidade, p.filial) || isMasterView;
            return matchesFilial;
          });

          // Rescue Force Macaé: Garante que o Diego Manhanini apareça para usuários de Macaé mesmo sem auditoria ativa
          if (isMacae && pdvData.length > 0) {
            pdvData.forEach(p => {
              const isDiegoPdv = normalizeName(p.nome_gerente_vendas || "").includes("diegomanhanini");
              if (isDiegoPdv && !pdvFiltrado.some(pf => pf.codigo === p.codigo)) {
                pdvFiltrado.push(p);
              }
            });
          }

          const vMap = new Map<string, VendedorAtivo>();
          formatado.forEach(v => vMap.set(v.cod_vendedor || v.nome_vendedor, v));

          const nMe = normalizeName(user?.name || "");
          pdvFiltrado.forEach(p => {
            const vKey = p.cod_vendedor || p.codigo;
            const isMeVnd = normalizeName(p.nome_vendedor || "") === nMe;

            if (!vMap.has(vKey) && !isMeVnd) {
              vMap.set(vKey, {
                cod_vendedor: vKey,
                nome_vendedor: p.nome_vendedor || "VENDEDOR " + (vKey || ""),
                nome_supervisor: (p.nome_supervisor || "").replace(/[\n\r]/g, ' ').trim() || "SEM SUPERVISOR",
                codigo_sup: p.cod_supervisor?.toString() || "",
                id_supervisor: p.id_supervisor,
                filial: (p.filial || "").replace(/[\n\r]/g, '').trim(),
                gerente: (p.nome_gerente_vendas || "").replace(/[\n\r]/g, ' ').trim(),
                gerente_comercial: (p.nome_gerente_comercial || "").replace(/[\n\r]/g, ' ').trim()
              });
            }
          });

          formatado = Array.from(vMap.values());
        }
      }

      console.log(`📊 [DEBUG_DIEGO] Registros finais para o componente: ${formatado.length} (Filtro Diego: ${formatado.filter(v => normalizeName(v.gerente).includes("diegomanhanini")).length})`);
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
