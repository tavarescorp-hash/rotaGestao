# 🍺 Rota Unibeer App

Sistema de **Gestão Inteligente de Rotas e Avaliação de Performance** para equipes de vendas e auditoria de Pontos de Venda (PDV).
Desenvolvido com foco em alta flexibilidade, consistência de dados e produtividade operacional (Painel PWA / Offline-First).

## 🚀 Funcionalidades Principais

*   **Arquitetura Baseada em Níveis (Roles):** Acesso estrito por mapeamento de Níveis (Master, Analista, Gerente, Supervisor, Auditor, etc). Cada cargo possui acesso a painéis e questionários de avaliações dedicados e dinamicos (via `roles.ts`).
*   **Offline-First Progressivo (PWA):** Construído com Service Workers (`vite-plugin-pwa`) e Banco de Dados assíncrono local (`IndexedDB`). Permite que os avaliadores trabalhem, façam cache de bases de clientes e submetam formulários em áreas sem nenhum sinal de 3G/4G, sincronizando nos bastidores quando houver conexão.
*   **Gestão de Componentização e Acesso SaaS:** Configurações "Over-the-Air" pelo Painel de Administrador, atualizando regras dinâmicas, como Indicadores de "Foco RGB" sem precisar atualizar o App nas lojas.
*   **Dashboard Executivo (BI):** Gráficos integrados reagindo em tempo real ao volume de aprovações de vendas, rotinas e coaching.
*   **Integração de Planilhas:** Ingestão em lote de base de PDVs e Produtos `.xlsx` utilizando engine local para evitar sobrecarga nas integrações com sistemas legados (ERPs).

## 🛠️ Stack Tecnológico Estrutural

*   **Linguagem & Motor:** TypeScript + React 18 (ViteJS)
*   **Estilização & Design System:** Tailwind CSS + `Shadcn/UI` (Acessibilidade Radix)
*   **Database & Autenticação:** [Supabase](https://supabase.com) (PostgreSQL + Row Level Security + Auth Session Manager)
*   **Visualização de Dados:** Recharts
*   **Persistência Offline Local:** Workbox + Dexie/IndexedDB API Local

## ⚙️ Rodando o Projeto (Desenvolvimento)

Para rodar o Rota Unibeer na sua máquina, siga os passos abaixo:

```bash
# 1. Instalar as dependências do ecossistema Node
npm install

# 2. Configurar Autenticação e Supabase
# Crie um arquivo '.env.local' na raiz e adicione suas chaves:
# VITE_SUPABASE_URL="sua_url_aqui"
# VITE_SUPABASE_ANON_KEY="sua_chave_anonima_aqui"

# 3. Rodar o servidor de desenvolvimento rápido (Vite)
npm run dev

# 4. Fazer Build (Otimização para Produção e PWA)
npm run build
npm run preview
```

---
© **Gestão de Rota - Global Soluções.**  
> *Contém arquitetura proprietária focada em alta performance de campo.*
