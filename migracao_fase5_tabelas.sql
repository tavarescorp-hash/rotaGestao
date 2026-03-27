-- MIGRATION FASE 5: CLEAN ARCHITECTURE - NORMALIZAÇÃO DE EQUIPES

-- 1. Tabela de Supervisores
CREATE TABLE IF NOT EXISTS public.supervisores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  filial VARCHAR(50),
  gerente VARCHAR(255),
  empresa_id INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garante que não tenhamos o mesmo supervisor digitado duas vezes para a mesma empresa
  CONSTRAINT unique_supervisor_empresa UNIQUE (nome, empresa_id)
);

-- Ativação de Segurança Row Level Security (RLS)
ALTER TABLE public.supervisores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública para usuários autenticados" ON public.supervisores FOR SELECT USING (true);
CREATE POLICY "Modificação para usuários autenticados" ON public.supervisores FOR ALL USING (true);


-- 2. Tabela de Vendedores
CREATE TABLE IF NOT EXISTS public.vendedores (
  cod_vendedor VARCHAR(50) PRIMARY KEY, -- Ex: C129, M125
  nome VARCHAR(255) NOT NULL,
  cidade VARCHAR(255),
  supervisor_id INTEGER REFERENCES public.supervisores(id) ON DELETE SET NULL,
  empresa_id INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_vendedor_empresa UNIQUE (cod_vendedor, empresa_id)
);

-- Ativação de Segurança Row Level Security (RLS)
ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública para usuários autenticados" ON public.vendedores FOR SELECT USING (true);
CREATE POLICY "Modificação para usuários autenticados" ON public.vendedores FOR ALL USING (true);

-- 3. Inserção Inicial Automática das Constantes do arquivo equipes.ts
-- Isso vai popular o banco de imediato pra não quebrar o App enquanto o usuário não faz o upload de um Excel novo.

-- Inserindo Supervisores Atuais
INSERT INTO public.supervisores (nome, filial, gerente, empresa_id) VALUES
('CARLOS TAVARES', 'C', 'GERENTE CAMPOS', 1),
('GUILHERME DAS CHAGAS', 'C', 'GERENTE CAMPOS', 1),
('ANDERSON ALEXANDRE', 'M', 'DIEGO MANHANINI', 1),
('CLEYTON DE SOUZA', 'M', 'DIEGO MANHANINI', 1)
ON CONFLICT (nome, empresa_id) DO NOTHING;

-- Inserindo Vendedores do Carlos Tavares (assumindo ID 1)
INSERT INTO public.vendedores (cod_vendedor, nome, supervisor_id, empresa_id) VALUES
('C129', 'FLAVIO FERNANDES LEAL', (SELECT id FROM public.supervisores WHERE nome = 'CARLOS TAVARES'), 1),
('C122', 'CRISTIANO TAVARES DE VASCONCEL', (SELECT id FROM public.supervisores WHERE nome = 'CARLOS TAVARES'), 1),
('C119', 'ALEX SANDRO DOS SANTOS JORGE', (SELECT id FROM public.supervisores WHERE nome = 'CARLOS TAVARES'), 1),
('C134', 'FABRICIO JORGE', (SELECT id FROM public.supervisores WHERE nome = 'CARLOS TAVARES'), 1),
('C128', 'CARLOS EDUARDO DA SILVA RIBEIR', (SELECT id FROM public.supervisores WHERE nome = 'CARLOS TAVARES'), 1),
('C101', 'FILIPE CANDIDO DA CONCEICAO', (SELECT id FROM public.supervisores WHERE nome = 'CARLOS TAVARES'), 1),
('C131', 'DEYVID TAVARES GONCALVES', (SELECT id FROM public.supervisores WHERE nome = 'CARLOS TAVARES'), 1),
('C132', 'RONALDO CORDEIRO DE LIMA RODRI', (SELECT id FROM public.supervisores WHERE nome = 'CARLOS TAVARES'), 1)
ON CONFLICT (cod_vendedor, empresa_id) DO NOTHING;

-- Inserindo Vendedores do Guilherme das Chagas (assumindo ID 2)
INSERT INTO public.vendedores (cod_vendedor, nome, supervisor_id, empresa_id) VALUES
('C231', 'LISLANE DA SILVA MACIEL', (SELECT id FROM public.supervisores WHERE nome = 'GUILHERME DAS CHAGAS'), 1),
('C225', 'MAURICIO ROSA GALDINO', (SELECT id FROM public.supervisores WHERE nome = 'GUILHERME DAS CHAGAS'), 1),
('C228', 'MATHEUS SILVA MONTEIRO', (SELECT id FROM public.supervisores WHERE nome = 'GUILHERME DAS CHAGAS'), 1),
('C230', 'LUCAS BATISTA DE SOUZA', (SELECT id FROM public.supervisores WHERE nome = 'GUILHERME DAS CHAGAS'), 1),
('C224', 'WELBERSON ROCHA SANTOS', (SELECT id FROM public.supervisores WHERE nome = 'GUILHERME DAS CHAGAS'), 1),
('C215', 'RAFAEL VIEIRA DA SILVA JUNIOR', (SELECT id FROM public.supervisores WHERE nome = 'GUILHERME DAS CHAGAS'), 1),
('C219', 'OTAVIO FARIA DE ALMEIDA', (SELECT id FROM public.supervisores WHERE nome = 'GUILHERME DAS CHAGAS'), 1),
('C214', 'PAULO GUILHERME OLIVEIRA BARBO', (SELECT id FROM public.supervisores WHERE nome = 'GUILHERME DAS CHAGAS'), 1)
ON CONFLICT (cod_vendedor, empresa_id) DO NOTHING;

-- Inserindo Vendedores do Anderson Alexandre (assumindo ID 3)
INSERT INTO public.vendedores (cod_vendedor, nome, supervisor_id, empresa_id) VALUES
('M125', 'LARISSA YORANA ANDRADE SOUZA', (SELECT id FROM public.supervisores WHERE nome = 'ANDERSON ALEXANDRE'), 1),
('M118', 'ANDRE LUIZ TEIXEIRA DE SOUZA', (SELECT id FROM public.supervisores WHERE nome = 'ANDERSON ALEXANDRE'), 1),
('M115', 'JHONATHAN FERNANDES DA SILVA', (SELECT id FROM public.supervisores WHERE nome = 'ANDERSON ALEXANDRE'), 1),
('M127', 'MARIO EMERSON DE SOUSA', (SELECT id FROM public.supervisores WHERE nome = 'ANDERSON ALEXANDRE'), 1),
('M130', 'PAULO ANDRADE BRAGA JARDIM', (SELECT id FROM public.supervisores WHERE nome = 'ANDERSON ALEXANDRE'), 1),
('M117', 'CHRISTIANO DE SOUZA MORAES DE', (SELECT id FROM public.supervisores WHERE nome = 'ANDERSON ALEXANDRE'), 1),
('M120', 'THIAGO MACHADO GARCIA', (SELECT id FROM public.supervisores WHERE nome = 'ANDERSON ALEXANDRE'), 1)
ON CONFLICT (cod_vendedor, empresa_id) DO NOTHING;

-- Inserindo Vendedores do Cleyton de Souza (assumindo ID 4)
INSERT INTO public.vendedores (cod_vendedor, nome, supervisor_id, empresa_id) VALUES
('M228', 'LUIZ HENRIQUE FERREIRA DA SILV', (SELECT id FROM public.supervisores WHERE nome = 'CLEYTON DE SOUZA'), 1),
('M224', 'ANDRE LUIZ QUINTANILHA CARVALH', (SELECT id FROM public.supervisores WHERE nome = 'CLEYTON DE SOUZA'), 1),
('M227', 'MARCELO PORTELA MARINHO', (SELECT id FROM public.supervisores WHERE nome = 'CLEYTON DE SOUZA'), 1),
('M223', 'REGINALDO BATISTA DA SILVA', (SELECT id FROM public.supervisores WHERE nome = 'CLEYTON DE SOUZA'), 1),
('M219', 'GLEIDIANE SERRAO DOS SANTOS', (SELECT id FROM public.supervisores WHERE nome = 'CLEYTON DE SOUZA'), 1),
('M226', 'JOSEFA NATALIA ANDRADE SANTOS', (SELECT id FROM public.supervisores WHERE nome = 'CLEYTON DE SOUZA'), 1)
ON CONFLICT (cod_vendedor, empresa_id) DO NOTHING;
