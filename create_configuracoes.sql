-- Concede permissão para o Supabase incrementar os IDs automaticamente (Sequence Gaps)
GRANT USAGE, SELECT ON SEQUENCE public.configuracoes_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.configuracoes_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.configuracoes_id_seq TO service_role;
