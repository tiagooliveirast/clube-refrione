import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { mensagemErro } from '../lib/formato';
import type { Papel } from '../lib/tipos';
import { useAuth } from '../auth/AuthProvider';
import { Carregando, Erro, Vazio } from '../components/Estados';
import { Cabecalho, Campo } from './ui';

interface Membro {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  papel: Papel;
}
const rotuloPapel: Record<Papel, string> = { admin: 'Administrador', vendedor: 'Vendedor (balcão)', associado: 'Associado' };

export function EquipeAdmin() {
  const { perfil } = useAuth();
  const [equipe, setEquipe] = useState<Membro[] | null>(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [email, setEmail] = useState('');
  const [papel, setPapel] = useState<Papel>('vendedor');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(() => {
    supabase
      .from('perfis')
      .select('id, nome, email, telefone, papel')
      .in('papel', ['admin', 'vendedor'])
      .order('papel')
      .order('nome')
      .then(({ data: d, error }) => {
        if (error) setErro(mensagemErro(error));
        setEquipe((d as Membro[]) ?? []);
      });
  }, []);
  useEffect(carregar, [carregar]);

  async function adicionar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setAviso('');
    const alvo = email.trim().toLowerCase();
    if (!alvo) return;
    setSalvando(true);
    const { data: d, error } = await supabase.from('perfis').update({ papel }).ilike('email', alvo).select('nome');
    setSalvando(false);
    if (error) return setErro(mensagemErro(error));
    if (!d || d.length === 0) return setErro('Não existe conta com esse e-mail. Peça para a pessoa se cadastrar no app primeiro e tente de novo.');
    setAviso(`${(d[0] as { nome: string }).nome || alvo} agora é ${rotuloPapel[papel].toLowerCase()}.`);
    setEmail('');
    carregar();
  }

  async function mudarPapel(m: Membro, novo: Papel) {
    setErro('');
    setAviso('');
    if (m.id === perfil?.id && novo !== 'admin') return setErro('Você não pode tirar o seu próprio acesso de administrador.');
    const { error } = await supabase.from('perfis').update({ papel: novo }).eq('id', m.id);
    if (error) return setErro(mensagemErro(error));
    carregar();
  }

  return (
    <>
      <Cabecalho titulo="Equipe" subtitulo="Quem pode usar o balcão e o painel" />

      <section className="adm-bloco">
        <h2 className="h-sm">Dar acesso a alguém da loja</h2>
        <p className="small muted">A pessoa precisa ter criado conta no app antes. Vendedor usa só a tela do balcão; administrador vê o painel inteiro.</p>
        <form className="adm-linha-form" onSubmit={adicionar}>
          <Campo id="eq-email" rotulo="E-mail da conta">
            <input id="eq-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Campo>
          <Campo id="eq-papel" rotulo="Acesso">
            <select id="eq-papel" value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
              <option value="vendedor">Vendedor (balcão)</option>
              <option value="admin">Administrador</option>
            </select>
          </Campo>
          <button className="btn primary" type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Dar acesso'}</button>
        </form>
        {aviso && <div className="alerta sucesso">{aviso}</div>}
        {erro && <Erro>{erro}</Erro>}
      </section>

      {equipe === null ? (
        <Carregando />
      ) : equipe.length === 0 ? (
        <Vazio icone="shield" titulo="Ninguém na equipe ainda" />
      ) : (
        <div className="tabela-caixa">
          <table className="tabela">
            <thead><tr><th>Nome</th><th>E-mail</th><th>Acesso</th><th /></tr></thead>
            <tbody>
              {equipe.map((m) => (
                <tr key={m.id}>
                  <td className="strong">{m.nome || '—'}{m.id === perfil?.id ? <span className="muted"> (você)</span> : ''}</td>
                  <td>{m.email}</td>
                  <td>
                    <label className="sr-only" htmlFor={`papel-${m.id}`}>Acesso de {m.nome}</label>
                    <select id={`papel-${m.id}`} className="adm-select-mini" value={m.papel} onChange={(e) => mudarPapel(m, e.target.value as Papel)}>
                      <option value="admin">Administrador</option>
                      <option value="vendedor">Vendedor (balcão)</option>
                      <option value="associado">Remover acesso</option>
                    </select>
                  </td>
                  <td />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
