# 🧠 Manual de Inteligência (Skill): Sistema Rota Unibeer

Este documento consolida as regras de negócio e dinâmicas técnicas implementadas para servir de referência absoluta para o desenvolvimento e evolução do sistema.

---

## 1. 🏗️ Estrutura Hierárquica (Níveis de Acesso)
O sistema opera em uma pirâmide de 6 níveis (Niv0 a Niv5), permitindo uma visão em cascata:

*   **Niv0 (Analista - Igor Oliveira)**: Visão de "Super Usuário". Gerencia bases de dados, aprova visitas retroativas e define diretrizes globais (Travas RGB).
*   **Niv1 (Diretor - Bráulio)**: Visão total de todas as unidades. Foco em KPIs estratégicos.
*   **Niv2 (Gerente Comercial - Eduardo Breda)**: Gerencia os Gerentes de Vendas (GVs). Visão consolidada de todas as rotas.
*   **Niv3 (Gerente de Vendas - Diego Manhanini)**: Gerencia os Supervisores (Niv4). Filtra dados por Filial (Macaé/Campos).
*   **Niv4 (Supervisor - Carlos Tavares, etc)**: Realiza as auditorias em campo (FDS, RGB, Coaching). Enxerga apenas seus vendedores vinculados.
*   **Niv5 (Vendedor/Padrão)**: Nível base de operação.

---

## 2. 🔐 Lógica de Bloqueio RGB (Global Directive)
Implementamos uma trava administrativa para evitar que supervisores ignorem o foco do mês:
- **Painel de Gestão**: O Analista define uma opção (Ex: "Foco Marcas Premium").
- **Efeito no App**: No formulário de `NovaVisita`, a pergunta sobre "Foco RGB" é automaticamente **travada** (`disabled`). O supervisor vê que o campo já está preenchido e configurado pela central, impedindo alterações manuais.

---

## 3. 📅 Dinâmica de Visita Retroativa & Override
O Analista (Niv0) possui o poder de "cobertura" de rotas:
- **Seleção Dinâmica**: Em `VisitaRetroativa`, se o usuário for Analista, um seletor de usuários aparece.
- **Substituição de Identidade**: Ao escolher um supervisor (Ex: Cleyton), o app assume a Unidade e o Cargo dele para a gravação, garantindo que a meta seja computada para o usuário correto.
- **Unidades Híbridas**: Se o Analista selecionar um usuário de nível alto (Niv1/Niv2), o sistema libera a escolha manual entre Campos (C) e Macaé (M).

---

## 4. 🔄 Processo ETL de Dados (Upload de Planilha)
O upload da base de clientes em "Gestão de Dados" não é apenas uma cópia, mas uma reestruturação inteligente:
1.  **Etapa de Supervisores**: O sistema extrai nomes únicos da planilha e atualiza a tabela `supervisores`, mantendo a contagem de liderança.
2.  **Etapa de Vendedores**: Cria as rotas e vincula cada vendedor ao seu respectivo ID de supervisor gerado na etapa 1.
3.  **Etapa de PDVs**: Limpa a base antiga da empresa e insere milhares de pontos de venda com as novas coordenadas e hierarquias.

---

## 5. 🛠️ Regras Técnicas Críticas
- **Normalização de Nomes**: Todas as comparações de hierarquia usam `normalizeName` (remove acentos, espaços extras e ignora Minúsculo/MAIÚSCULO).
- **Isolamento SaaS**: Toda e qualquer query ao banco Supabase DEVE incluir o filtro `.eq('empresa_id', user.empresa_id)` para evitar vazamento de dados entre diferentes empresas.
- **Fallback Offline**: O sistema utiliza **IndexedDB** para cache. Se o sinal de internet cair em campo, as visitas são salvas localmente e sincronizadas assim que a rede retornar.
