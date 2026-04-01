import { supabase } from '@/core/api/supabaseClient';

// Mantém export do supabase para componentes que usam hooks de auth diretamente (como AuthContext)
export { supabase };

// Re-exportação temporária dos serviços refatorados para manter a retrocompatibilidade (Evitar Tela Branca na Fase 1)
export * from '@/features/visitas/api/visitas.service';
export * from '@/features/pdvs/api/pdvs.service';
export * from '@/features/fds/api/fds.service';
export * from '@/features/usuarios/api/usuarios.service';
export * from '@/features/empresas/api/empresas.service';
export * from '@/features/config/api/config.service';
export * from '@/features/config/api/metas.service';
export * from '@/features/offline/api/syncWorker.service';
