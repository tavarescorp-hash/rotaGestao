import { supabase } from '@/core/api/supabaseClient';
import { getAllFromDB, STORES } from '@/lib/indexedDB';

export interface VendedorAtivo {
  nome_vendedor: string;
  nome_supervisor?: string;
  codigo_sup?: string;
  municipio?: string;
  filial?: string;
  gerente?: string;
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
        return {
          nome_fantasia: dataOff.sigla || dataOff.razao_social,
          categoria: dataOff.porte,
          canal_cadastrado: dataOff.canal,
          filial: dataOff.filial,
          municipio: "",
          codigo_vendedor: dataOff.cod_vendedor,
          nome_vendedor: dataOff.nome_vendedor,
          nome_supervisor: dataOff.nome_supervisor,
          supervisor: dataOff.cod_supervisor ? dataOff.cod_supervisor.toString() : "",
          gerente: dataOff.nome_gerente_vendas,
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

    if (user?.nivel === 'Niv4' && user?.funcao) {
      const supervisorId = user.funcao.replace('SUPERVISOR ', '').trim();
      query = query.eq('cod_supervisor', supervisorId);
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
      return {
        nome_fantasia: pdv.sigla || pdv.razao_social,
        categoria: pdv.porte,
        canal_cadastrado: pdv.canal,
        filial: pdv.filial,
        municipio: "",
        codigo_vendedor: pdv.cod_vendedor,
        nome_vendedor: pdv.nome_vendedor,
        nome_supervisor: pdv.nome_supervisor,
        supervisor: pdv.cod_supervisor ? pdv.cod_supervisor.toString() : "",
        gerente: pdv.nome_gerente_vendas,
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
    let allData: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    const supervisorId = user?.nivel === 'Niv4' && user?.funcao ? user.funcao.replace('SUPERVISOR ', '').trim() : null;
    let gerenteRef = user?.nivel === 'Niv3' && user?.name ? user.name : null;

    if (gerenteRef?.toUpperCase() === 'CARLOS JUNIOR') gerenteRef = 'CARLOS TAVARES';
    if (gerenteRef?.toUpperCase() === 'GUILHERME CHAGAS') gerenteRef = 'GUILHERME DAS CHAGAS';

    if (!navigator.onLine) {
      console.log("🌐 Sem internet. Buscando Vendedores no Cache Local IndexedDB...");
      const cachePdvs = await getAllFromDB(STORES.PDVS_CACHE);

      allData = cachePdvs.filter(pdv => {
        if (user?.nivel === 'Niv4' && supervisorId) {
          return pdv.cod_supervisor === supervisorId || pdv.cod_supervisor?.toString() === supervisorId;
        } else if (user?.nivel === 'Niv3') {
          if (user.unidade?.toUpperCase().includes("MACA")) {
            return pdv.filial === 'M' || pdv.filial?.toUpperCase().includes('MACAE') || pdv.filial?.toUpperCase().includes('MACAÉ') || pdv.nome_gerente_vendas === gerenteRef;
          } else if (user.unidade?.toUpperCase().includes("CAMPOS")) {
            return pdv.filial === 'C' || pdv.filial?.toUpperCase().includes('CAMPOS') || pdv.nome_gerente_vendas === gerenteRef;
          }
        }
        return true;
      });
    } else {
      while (hasMore) {
        let baseQuery = supabase
          .from("pdvs")
          .select('nome_vendedor, nome_supervisor, filial, nome_gerente_vendas, cod_supervisor, cod_gerente, cod_vendedor');

        if (user?.empresa_id) {
          baseQuery = baseQuery.eq('empresa_id', user.empresa_id);
        }

        if (user?.nivel === 'Niv4' && supervisorId) {
          baseQuery = baseQuery.eq('cod_supervisor', supervisorId);
        } else if (user?.nivel === 'Niv3') {
          if (user.unidade?.toUpperCase().includes("MACA")) {
            baseQuery = baseQuery.or('filial.eq.M,filial.ilike.%MACAE%');
          } else if (user.unidade?.toUpperCase().includes("CAMPOS")) {
            baseQuery = baseQuery.or('filial.eq.C,filial.ilike.%CAMPOS%');
          }
        }

        const { data, error } = await baseQuery.range(from, from + step - 1);

        if (error) {
          console.error("Erro ao buscar base real de vendedores:", error);
          break;
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          if (data.length < step) {
            hasMore = false;
          } else {
            from += step;
          }
        } else {
          hasMore = false;
        }
      }
    }

    if (allData.length === 0) return [];

    const unicosMap = new Map<string, VendedorAtivo>();

    allData.forEach((row: any) => {
      const vend = row.nome_vendedor?.trim();
      const supName = row.nome_supervisor?.trim() || "";
      const supCode = row.cod_supervisor?.toString() || "";
      const municipio = "";
      const extractedCodVendedor = row.cod_vendedor?.toString().trim() || row.codigo_vendedor?.toString().trim() || "";

      if (vend) {
        if (!unicosMap.has(vend)) {
          unicosMap.set(vend, {
            nome_vendedor: vend,
            nome_supervisor: supName,
            codigo_sup: supCode,
            municipio: municipio,
            filial: row.filial?.trim() || "",
            gerente: row.nome_gerente_vendas?.trim() || "",
            cod_vendedor: extractedCodVendedor
          });
        } else {
          const existing = unicosMap.get(vend)!;
          if (!existing.cod_vendedor && extractedCodVendedor) {
            existing.cod_vendedor = extractedCodVendedor;
            unicosMap.set(vend, existing);
          }
        }
      }
    });

    return Array.from(unicosMap.values());
  } catch (error) {
    console.error("Erro inesperado ao buscar vendedores ativos:", error);
    return [];
  }
}

export async function uploadBasePDVs(dados: any[], user?: any): Promise<{ success: boolean; message: string }> {
  try {
    const chunkSize = 1000;
    const empresaId = user?.empresa_id || 1;

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

    return { success: true, message: `Base de clientes atualizada! ${dados.length} PDVs sincronizados.` };
  } catch (error: any) {
    console.error("Erro técnico no upload:", error);
    return { success: false, message: error.message || "Erro desconhecido ao atualizar base de PDVs." };
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
