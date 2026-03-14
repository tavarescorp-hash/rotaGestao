-- Execute este script no SQL Editor do Supabase para se transformar no Super-Admin (Master)
-- Isso vai liberar a tela de Gestão de Inquilinos (Tenants) para o seu usuário.

UPDATE public.profiles 
SET nivel = 'Master' 
WHERE "Nome" ILIKE '%Carlos Tavares%';

-- Caso você esteja usando um e-mail diferente, descomente a linha abaixo e substitua:
-- UPDATE public.profiles SET nivel = 'Master' WHERE id = (SELECT id FROM auth.users WHERE email = 'seuemail@gmail.com');
