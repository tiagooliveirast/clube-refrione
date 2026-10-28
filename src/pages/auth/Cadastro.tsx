import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { mensagemErro } from '../../lib/formato';
import { useAuth } from '../../auth/AuthProvider';
import { Aviso, Erro } from '../../components/Estados';
import { Icon } from '../../components/Icon';
import { AuthLayout } from './AuthLayout';

export function Cadastro() {
  const { sessao } = useAuth();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [confirmarEmail, setConfirmarEmail] = useState(false);

  if (sessao) return <Navigate to="/" replace />;

  async function cadastrar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    if (nome.trim().split(/\s+/).length < 2) return setErro('Digite seu nome e sobrenome.');
    if (telefone.replace(/\D/g, '').length < 10) return setErro('Digite o WhatsApp com DDD.');
    if (senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.');

    setEnviando(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        data: { nome: nome.trim(), telefone: telefone.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    setEnviando(false);
    if (error) return setErro(mensagemErro(error));
    // Se a confirmação de e-mail estiver ligada no Supabase, não vem sessão
    if (!data.session) setConfirmarEmail(true);
  }

  if (confirmarEmail) {
    return (
      <AuthLayout titulo="Confirme seu e-mail">
        <div className="card col center gap-12 pad-22">
          <span className="ok-circle">
            <Icon name="check" size={22} stroke={2.6} />
          </span>
          <p className="small text-center">
            Enviamos um link para <strong>{email}</strong>. Abra o e-mail e toque no link para ativar sua conta. Se não encontrar,
            procure no spam.
          </p>
        </div>
        <Link to="/entrar" className="btn primary block">Voltar para entrar</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout titulo="Criar conta" subtitulo="Cadastre-se para fazer parte do Clube RefriOne.">
      <Aviso>
        <strong>Use o mesmo e-mail do Refriclube</strong>, se você já tiver conta lá. É por ele que o acesso ao Refriclube é
        liberado.
      </Aviso>
      <form className="col gap-14" onSubmit={cadastrar}>
        <div className="campo">
          <label htmlFor="nome">Nome completo</label>
          <input id="nome" autoComplete="name" required value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="telefone">WhatsApp com DDD</label>
          <input id="telefone" type="tel" inputMode="tel" autoComplete="tel" required value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="senha">Senha (mínimo 6 caracteres)</label>
          <input id="senha" type="password" autoComplete="new-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
        </div>
        {erro && <Erro>{erro}</Erro>}
        <button className="btn primary block" type="submit" disabled={enviando}>
          {enviando ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>
      <p className="small muted text-center">
        Já tem conta? <Link to="/entrar" className="strong">Entrar</Link>
      </p>
    </AuthLayout>
  );
}
