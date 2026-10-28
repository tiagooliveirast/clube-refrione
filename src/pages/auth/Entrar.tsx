import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { mensagemErro } from '../../lib/formato';
import { useAuth } from '../../auth/AuthProvider';
import { Erro } from '../../components/Estados';
import { AuthLayout } from './AuthLayout';

export function Entrar() {
  const { sessao } = useAuth();
  const local = useLocation();
  const destino = (local.state as { de?: string } | null)?.de || '/';
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  if (sessao) return <Navigate to={destino} replace />;

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setEnviando(false);
    if (error) setErro(mensagemErro(error));
  }

  return (
    <AuthLayout titulo="Entrar no clube" subtitulo="Use o e-mail e a senha do seu cadastro.">
      <form className="col gap-14" onSubmit={entrar}>
        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <input id="senha" type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
        </div>
        {erro && <Erro>{erro}</Erro>}
        <button className="btn primary block" type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <Link to="/recuperar-senha" className="small strong text-center">Esqueci minha senha</Link>
      <p className="small muted text-center">
        Ainda não é associado? <Link to="/cadastro" className="strong">Criar conta</Link>
      </p>
    </AuthLayout>
  );
}
