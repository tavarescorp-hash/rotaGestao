// src/lib/indexedDB.ts

const DB_NAME = "RotaUnibeerDB";
const DB_VERSION = 1;

export const STORES = {
  OFFLINE_QUEUE: "offline_queue",
  PDVS_CACHE: "pdvs_cache",
  VENDEDORES_CACHE: "vendedores_cache",
  METRICAS_CACHE: "metricas_cache",
  VISITAS_CACHE: "visitas_cache"
};

/**
 * Inicializa e retorna a conexão com o IndexedDB.
 */
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2); // Aumentar versão para trigger de upgrade

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Cria as Object Stores se não existirem
      if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
        db.createObjectStore(STORES.OFFLINE_QUEUE, { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.PDVS_CACHE)) {
        db.createObjectStore(STORES.PDVS_CACHE, { keyPath: "cod_pdv" });
      }
      if (!db.objectStoreNames.contains(STORES.VENDEDORES_CACHE)) {
        db.createObjectStore(STORES.VENDEDORES_CACHE, { keyPath: "cod_vendedor" });
      }
      if (!db.objectStoreNames.contains(STORES.METRICAS_CACHE)) {
        db.createObjectStore(STORES.METRICAS_CACHE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.VISITAS_CACHE)) {
        db.createObjectStore(STORES.VISITAS_CACHE, { keyPath: "id" });
      }
    };

    request.onsuccess = (event: Event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event: Event) => {
      console.error("Erro ao inicializar IndexedDB:", (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

/**
 * Adiciona ou atualiza um item em uma store específica.
 */
export const saveToDB = async (storeName: string, data: any): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    
    // Se data for array (ex: salvar cache inteiro das tabelas), inserimos tudo bulk.
    // Se for objeto único, damos apenas um put.
    if (Array.isArray(data)) {
      // Limpa a base antiga antes de rechear o cache novo para tabelas cheias
      if (storeName !== STORES.OFFLINE_QUEUE) {
        store.clear(); 
      }
      data.forEach(item => {
        // Certifica-se de ter `id` como String para as Stores que esperam String (PDVs usam cod_pdv)
        store.put(item);
      });
    } else {
      store.put(data);
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = (e) => reject((e.target as IDBTransaction).error);
  });
};

/**
 * Recupera todos os itens de uma store.
 */
export const getAllFromDB = async (storeName: string): Promise<any[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject((e.target as IDBRequest).error);
  });
};

/**
 * Recupera um item específico de uma store usando uma key primária.
 */
export const getFromDB = async (storeName: string, key: any): Promise<any> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject((e.target as IDBRequest).error);
  });
};

/**
 * Deleta um item específico de uma store. Útil para limpar a fila após o Sync do Offline.
 */
export const deleteFromDB = async (storeName: string, key: any): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    store.delete(key);

    transaction.oncomplete = () => resolve();
    transaction.onerror = (e) => reject((e.target as IDBTransaction).error);
  });
};

/**
 * Limpa completamente uma store.
 */
export const clearDB = async (storeName: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    store.clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = (e) => reject((e.target as IDBTransaction).error);
  });
};
