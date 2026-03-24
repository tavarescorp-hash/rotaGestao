# 🏗️ Proposta de Arquitetura e Regras de Negócio (Refatoração)

É muito comum que projetos cresçam rapidamente e fiquem "embolados" (o famoso código espaguete) quando adicionamos muitas regras de negócio em cima de uma estrutura inicial simples. Para refazermos o app de forma escalável e limpa, precisamos definir um **Documento de Regras e Arquitetura**.

Aqui está um modelo de como você deve pensar e escrever esse documento para podermos guiar a refatoração juntos:

---

## 1. Organização de Pastas (Feature-Sliced Design)
Atualmente, temos arquivos gigantes como `Dashboard.tsx` e `api.ts` que fazem tudo ao mesmo tempo (buscam dados, renderizam UI, calculam regras). 
**Nova Regra:** O código deve ser dividido pelo "assunto" (Feature) e não pelo tipo de arquivo.

**Nova Estrutura Proposta:**
```text
src/
 ┣ 📂 core/             # Código global: api client base do Supabase, auth, utils e router.
 ┣ 📂 components/       # Componentes visuais "burros" (Botões, Inputs, Cards).
 ┣ 📂 features/         # O coração do app, dividido por assunto:
 ┃ ┣ 📂 visitas/        # Tudo sobre visitas: api, componentes de form, hooks de estado.
 ┃ ┣ 📂 relatorios/     # Tudo sobre admin e dashboards.
 ┃ ┣ 📂 usuarios/       # Regras de papéis (roles), criação de usuários.
 ┃ ┗ 📂 offline/        # Lógica centralizada do PWA/Dexie e fila de sincronização.
 ┗ 📂 pages/            # Telas que apenas "costuram" os componentes das features.
```

## 2. Separação de Responsabilidades (UI vs Lógica)
**Nova Regra:** Um componente React (ex: arquivo `.tsx`) não deve fazer chamadas diretas complexas de banco de dados ou ter 50 `useStates`. Ele deve se focar apenas em **Desenhar a Tela**.

* **Camada de Dados (Service/API):** O arquivo `api.ts` atual está com 1000 linhas. Ele deve ser quebrado em vários, por exemplo, `visitas.service.ts`, `produtos.service.ts`.
* **Gerenciamento de Estado (Hooks):** Ao invés de misturar lógica no `NovaVisita.tsx`, usaremos custom hooks como `useVisitaForm()` ou bibliotecas como **React Query** (para gerenciar loading e cache de requisições de forma limpa).

## 3. Padrão de Formulários (Data-Driven)
**Nova Regra:** Evitar a criação manual de campos de formulário na interface se as regras mudam frequentemente.
O modelo que criamos hoje com o `formulariosConfig.ts` e a coluna `respostas_json_dynamic` é o **padrão ouro que deve ser adotado desde o início**. A UI apenas lê um arquivo de configuração e renderiza os campos sozinhos, isolando as regras de negócio de como a tela se comporta.

## 4. Estratégia Offline-First (PWA)
O modo offline hoje está atrelado às chamadas de API pontuais. 
**Nova Regra:** Toda a comunicação do app deve passar primeiro pelo banco local (Dexie.js/IndexedDB). 
1. O app lê os dados locais.
2. Em background, o app pergunta ao Supabase se há novidades e atualiza o banco local.
3. Isso garante que a internet caindo "no meio" do uso nunca afete a experiência, centralizando a lógica de sincronização (Sync Engine) num lugar só, fora das telas.

## 5. Modelagem de Dados no Supabase (Limpeza)
Colunas legadas não utilizadas devem ser aposentadas, mantendo tabelas enxutas:
* **Tabela `visitas`**: Focada em metadados da visita (Supervisor, PDV, Data, Localização, Pontuação) + `respostas_json` (para as respostas variáveis).
* **Tabela `produtos`** e **Tabela `pdvs`**: Tabelas de dimensão (bases importadas).

---

### 🚀 Como Começar?
Para iniciarmos a reescrita (refatoração) de forma segura sem parar a operação atual da sua empresa, você pode me guiar passo a passo com este roteiro:

1. **"Vamos quebrar o `api.ts`"**: Extrair a lógica em pequenos arquivos na pasta de serviços.
2. **"Vamos criar o hook do Form"**: Tirar os 400 lines de lógica do `NovaVisita` e esconder em um hook para deixar o arquivo só com a estrutura visual HTML.
3. **"Vamos refatorar o Dashboard"**: Quebrar os gráficos em componentes independentes para que a página de Dashboard sirva apenas para importar os pequenos pedaços.

O que acha desse modelo? Podemos revisar essa arquitetura aqui e começar pelo ponto que mais te incomoda hoje (ex: o arquivo de Nova Visita ou o Sistema Offline).
