import { createClient } from '@supabase/supabase-js';

// Buscamos diretamente das variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificação de segurança
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'ERRO CRÍTICO: Variáveis de ambiente do Supabase não configuradas. ' +
    'Verifique o painel de Secrets no seu ambiente de deploy.'
  );
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);