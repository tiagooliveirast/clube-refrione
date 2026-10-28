import { createClient } from '@supabase/supabase-js';

// URL e anon key são públicas por natureza (a segurança está nas regras RLS do banco).
// Ficam aqui como padrão para o deploy funcionar sem configurar variáveis na Vercel.
// Se existirem VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (.env.local ou Vercel), elas têm prioridade.
// NUNCA coloque a service_role key no frontend.
const URL_PADRAO = 'https://lrcwurytmqzoyedxdljo.supabase.co';
const ANON_PADRAO =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyY3d1cnl0bXF6b3llZHhkbGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwODk3MTEsImV4cCI6MjEwODY2NTcxMX0.7PwMoaxTea-Xw51yizK1LJkaWiD44y50w0590eh7U7w';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || URL_PADRAO;
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || ANON_PADRAO;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
