import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { mensagemErro } from '../../lib/formato';
import { Erro } from '../../components/Estados';
import { AuthLayout } from './AuthLayout';

export function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/nova-senha`,
    });
    setEnviando(false);
    if (error) return setErro(mensagemErro(error));
    setEnviado(true);
  }

  return (
    <AuthLayout titulo="Recuperar senha" subtitulo="Enviaremos um link para você criar uma senha nova.">
      {enviado ? (
        <div className="card col gap-10 pad-22">
          <p className="small">
            Se existir uma conta com <strong>{email}</strong>, o link chega em alguns minutos. Procure também no spam.
          </p>
        </div>
      ) : (
        <form className="col gap-14" onSubmit={enviar}>
          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {erro && <Erro>{erro}</Erro>}
          <button className="btn primary block" type="submit" disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar link'}
          </button>
        </form>
      )}
      <Link to="/entrar" className="small strong text-center">Voltar para entrar</Link>
    </AuthLayout>
  );
}
