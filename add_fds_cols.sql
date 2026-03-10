ALTER TABLE public.visitas 
ADD COLUMN IF NOT EXISTS fds_qtd_skus text,
ADD COLUMN IF NOT EXISTS fds_refrigerador text,
ADD COLUMN IF NOT EXISTS fds_posicionamento text,
ADD COLUMN IF NOT EXISTS fds_refrigerados text,
ADD COLUMN IF NOT EXISTS fds_precificados text,
ADD COLUMN IF NOT EXISTS fds_melhoria_precificacao text;
