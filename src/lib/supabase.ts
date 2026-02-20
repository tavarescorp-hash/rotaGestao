import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error("⚠️ VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY está faltando nas variáveis de ambiente! O Supabase não vai conectar.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
