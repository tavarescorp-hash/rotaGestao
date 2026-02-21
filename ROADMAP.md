# 🧭 Roadmap Arquitetural - UniBeer 2025 (Rota Gestão)

Visão estratégica e técnica para evolução e escalabilidade da plataforma de inteligência e auditoria de mercado da UniBeer.

---

## 🧱 Fase 1: Fundação (Curto Prazo)
*Foco na resiliência, segurança e experiência irretocável do fluxo atual (App de Auditoria).*

- [ ] **Sincronização Offline-First (PWA):** Como o app será usado em campo (PDVs com internet ruim), implementar Service Workers (`vite-plugin-pwa`) e um banco local (IndexedDB ou WatermelonDB) para enfileirar as "Visitas" e sincronizar com o Supabase quando a rede voltar.
- [ ] **Tipagem Estrita do Banco de Dados:** Gerar os types `.d.ts` do Supabase via CLI e injetar no TypeScript do React. Isso evitará erros de runtime caso uma coluna da tabela mude (ex: `visitas` ou `pdvs`).
- [ ] **Tratamento Global de Erros (Error Boundaries):** Implementar um *boundary* no React e um serviço central para capturar falhas de API e *crash analytics* (Sentry, por exemplo), avisando ao usuário de forma passiva através de Toasts em vez de simplesmente falhar o carregamento.
- [ ] **Auditoria e Segurança RLS (Row Level Security):** Ajustar as políticas (Policies) no Supabase para que promotores/avaliadores só consigam ver e editar os PDVs da sua própria rota/unidade, garantindo a privacidade contratual dos dados.
- [ ] **Otimização do *Bundle* e Imagens:** Configurar carregamento preguiçoso (Lazy Loading) nas rotas (`React.lazy`) e comprimir as imagens estáticas no Vite para que a tela de login (que agora usa imagens de fundo e logos vetoriais) abra rápido em conexões 3G.

---

## ⚙️ Fase 2: Funcionalidades Core (Médio Prazo)
*Adicionando valor real à operação diária da equipe da Rota UniBeer.*

- [ ] **Módulo de Roteirização Inteligente (Integração com Mapas):** Conectar os campos de geolocalização (`coorden_x`, `coorden_y`) do PDV com a API do Google Maps ou Mapbox. Criar um painel onde o avaliador vê seus clientes no mapa e o sistema sugere a ordem de visitação mais otimizada para economizar combustível.
- [ ] **Gestão Analítica de Rupturas e Estoque:** No formulário de 'Nova Visita', adicionar um check rápido focado no portfólio (SKUs obrigatórios). Se um produto estiver em falta (Ruptura), gerar um *Alerta Push* automático direto para a equipe de Logística/Vendas da base.
- [ ] **Filtros Avançados e Relatórios Gerenciais (Exports):** Ampliar o Dashboard. Permitir cruzamento de dados (ex: "Quantas visitas tiveram Coaching SIM e nota FDS abaixo de 50 no Polo Macaé?"). Adicionar suporte para exportar um PDF dinâmico ou planilha Excel/CSV contendo o resumo consolidado do mês.

---

## 🚀 Fase 3: Escala e IA (Longo Prazo)
*O motor de inovação tracionando Inteligência Artificial Generativa (Google Gemini) para reinventar a execução de mercado.*

- [ ] **Auditor Visual Inteligente (Gemini Vision):** Em vez do promotor preencher o *Scorecard* de produtos (RGB, FDS) à mão no check-in do PDV, ele simplesmente tira uma foto da geladeira ou gôndola. O Gemini Vision processa a foto, identifica quais concorrentes estão próximos, verifica se a *Cerveja X* está na primeira prateleira (planograma correto) e gera a pontuação da execução automaticamente, acabando com a margem de erro ou fraude.
- [ ] **Assistente de Venda *Ask Unibeer* (Generative AI Chatbot):** Um minichat rodando no topo do aplicativo alimentado pelo Gemini Nano ou Pro. O representante em campo pode digitar ou falar: **"Qual foi o problema histórico do PDV 1025?"**. O Gemini cruza as *observações* de visitas antigas e responde: *"Nas últimas 3 visitas, houve reclamação da entrega atrasada. Sugiro abordar isso pacientemente e oferecer uma degustação da nossa nova IPA."*
- [ ] **Motor de Recomendação Compositiva:* Analisando o PDV (Porte, Canal, Bairro) junto à sazonalidade (temperatura, proximidade do carnaval), o modelo de IA prevê demandas personalizadas. Assim que o vendedor abrir a ficha do Bar do Zé, o app indica de imediato: *"A probabilidade do Bar do Zé ficar sem estoque de Cerveja Pilsen este final de semana é de 85%. Sugira o envio de 10 caixas extras sob consignação."*
- [ ] **Análise de Sentimento (Data Mining Escrito):** O Gemini passará constantemente pelo campo "observações" textuais das milhares de auditorias já salvas no banco de dados e enviará um sumário semanal aos diretores: ex: *"Esta semana, 40% das notas do polo Campos relataram 'geladeira vazia', enquanto em Macaé a tendência foi 'preço agressivo do concorrente'."*
