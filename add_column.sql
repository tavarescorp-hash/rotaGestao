-- Rode esse comando no SQL Editor do seu Supabase para ativar os Formulários Dinâmicos!
ALTER TABLE visitas ADD COLUMN respostas_json_dynamic JSONB DEFAULT '{}'::jsonb;
