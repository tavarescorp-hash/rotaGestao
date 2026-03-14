-- 1. Criar tabela Master de Empresas (Tenants)
CREATE TABLE IF NOT EXISTS public.empresas (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    cnpj TEXT,
    logo_url TEXT,
    cor_primaria TEXT DEFAULT '#B22222',
    status_assinatura TEXT DEFAULT 'Ativa',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inserir a Unibeer como primeira e padrão Inquilina
INSERT INTO public.empresas (id, nome, logo_url, cor_primaria, status_assinatura)
VALUES (1, 'Unibeer', '/logo-global.png', '#B22222', 'Ativa')
ON CONFLICT (id) DO NOTHING;

-- 3. Adicionar coluna empresa_id em TODAS as tabelas e forçar ID = 1 para histórico
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES public.empresas(id);
UPDATE public.profiles SET empresa_id = 1 WHERE empresa_id IS NULL;

ALTER TABLE public.visitas ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES public.empresas(id);
UPDATE public.visitas SET empresa_id = 1 WHERE empresa_id IS NULL;

ALTER TABLE public.pdvs ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES public.empresas(id);
UPDATE public.pdvs SET empresa_id = 1 WHERE empresa_id IS NULL;

ALTER TABLE public.produtos_fds ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES public.empresas(id);
UPDATE public.produtos_fds SET empresa_id = 1 WHERE empresa_id IS NULL;

-- 4. Opcional: Adicionar na configuracoes também
ALTER TABLE public.configuracoes ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES public.empresas(id);
UPDATE public.configuracoes SET empresa_id = 1 WHERE empresa_id IS NULL;

