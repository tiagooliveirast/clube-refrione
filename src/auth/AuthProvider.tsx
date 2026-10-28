import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Associado, Configuracoes, Perfil } from '../lib/tipos';

interface AuthCtx {
  carregando: boolean;
  sessao: Session | null;
  perfil: Perfil | null;
  associado: Associado | null;
  config: Configuracoes | null;
  recuperandoSenha: boolean;
  recarregar: () => Promise<void>;
  sair: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [associado, setAssociado] = useState<Associado | null>(null);
  const [config, setConfig] = useState<Configuracoes | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);

  const carregarDados = useCallback(async (s: Session | null) => {
    // Configurações não bloqueiam a abertura do app
    supabase
      .from('configuracoes')
      .select('nome_clube, whatsapp, regulamento_url, refriclube_url, validade_cupom_dias')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data: cfg }) => setConfig((cfg as Configuracoes) ?? null));

    if (!s) {
      setPerfil(null);
      setAssociado(null);
      return;
    }
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from('perfis').select('id, nome, email, telefone, papel').eq('id', s.user.id).maybeSingle(),
      supabase
        .from('associados')
        .select('id, perfil_id, numero, status, membro_desde, proxima_cobranca, refriclube_ativo, plano:planos(id, nome, descricao, preco_mensal, desconto_padrao)')
        .eq('perfil_id', s.user.id)
        .maybeSingle(),
    ]);
    setPerfil((p as Perfil) ?? null);
    setAssociado((a as unknown as Associado) ?? null);
  }, []);

  useEffect(() => {
    let ativo = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!ativo) return;
      setSessao(data.session);
      await carregarDados(data.session);
      if (ativo) setCarregando(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((evento, s) => {
      if (evento === 'PASSWORD_RECOVERY') setRecuperandoSenha(true);
      if (evento === 'USER_UPDATED') setRecuperandoSenha(false);
      setSessao(s);
      // Não aguardar dentro do callback (recomendação do supabase-js)
      setTimeout(() => {
        carregarDados(s);
      }, 0);
    });

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, [carregarDados]);

  const recarregar = useCallback(() => carregarDados(sessao), [carregarDados, sessao]);

  const sair = useCallback(async () => {
    await supabase.auth.signOut();
    setSessao(null);
    setPerfil(null);
    setAssociado(null);
  }, []);

  return (
    <Ctx.Provider value={{ carregando, sessao, perfil, associado, config, recuperandoSenha, recarregar, sair }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
