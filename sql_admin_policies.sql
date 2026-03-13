-- ATUALIZAÇÃO DA POLÍTICA RLS PARA APROVAÇÃO E RECUSA (TABELA VISITAS)

-- 1. Permite que o ANALISTA (Niv1) atualize o status de qualquer visita para Aprovado.
CREATE POLICY "Analistas podem atualizar visitas"
ON public.visitas
FOR UPDATE
TO authenticated
USING (
  (SELECT nivel FROM usuarios_app WHERE email = auth.jwt()->>'email') = 'Niv1'
);

-- 2. Permite que o ANALISTA (Niv1) delete as visitas recusadas.
CREATE POLICY "Analistas podem deletar visitas"
ON public.visitas
FOR DELETE
TO authenticated
USING (
  (SELECT nivel FROM usuarios_app WHERE email = auth.jwt()->>'email') = 'Niv1'
);

-- Para garantir que quem lançou a visita também consiga atualizá-la no momento da inserção, caso não exista:
CREATE POLICY "Usuários podem atualizar próprias visitas"
ON public.visitas
FOR UPDATE
TO authenticated
USING (
  avaliador = (SELECT nome_completo FROM usuarios_app WHERE email = auth.jwt()->>'email')
);
