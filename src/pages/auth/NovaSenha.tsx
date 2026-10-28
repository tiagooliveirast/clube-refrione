import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { mensagemErro } from '../../lib/formato';
import { useAuth } from '../../auth/AuthProvider';
import { Carregando, Erro } from '../../components/Estados';
import { AuthLayout } from './AuthLayout';

export function NovaSenha() {
  const { sessao, carregando } = useAuth();
  const navegar = useNavigate();
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    if (senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.');
    if (senha !== confirmar) return setErro('As duas senhas não são iguais.');
    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setEnviando(false);
    if (error) return setErro(mensagemErro(error));
    navegar('/', { replace: true });
  }

  if (carregando) return <Carregando />;

  return (
    <AuthLayout titulo="Criar nova senha">
      {!sessao ? (
        <Erro>O link de recuperação expirou ou já foi usado. Peça um novo em "Esqueci minha senha".</Erro>
      ) : (
        <form className="col gap-14" onSubmit={salvar}>
          <div className="campo">
            <label htmlFor="senha">Nova senha</label>
            <input id="senha" type="password" autoComplete="new-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="confirmar">Repita a nova senha</label>
            <input id="confirmar" type="password" autoComplete="new-password" required value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
          </div>
          {erro && <Erro>{erro}</Erro>}
          <button className="btn primary block" type="submit" disabled={enviando}>
            {enviando ? 'Salvando…' : 'Salvar nova senha'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
