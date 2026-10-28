import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { data, mensagemErro } from '../lib/formato';
import { Carregando, Erro, Vazio } from '../components/Estados';
import { Cabecalho, baixarCsv, dataHora } from './ui';

interface CupomLinha {
  id: string;
  codigo: string;
  status: 'gerado' | 'usado' | 'expirado';
  valido_ate: string;
  gerado_em: string;
  usado_em: string | null;
  oferta: { titulo: string } | null;
  associado: { numero: string; perfil: { nome: string } | null } | null;
  vendedor: { nome: string } | null;
}

type Filtro = 'todos' | 'gerado' | 'usado' | 'expirado';
const rotulo: Record<Filtro, string> = { todos: 'Todos', gerado: 'Em aberto', usado: 'Usados', expirado: 'Expirados' };

export function CuponsAdmin() {
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [linhas, setLinhas] = useState<CupomLinha[] | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setLinhas(null);
    let q = supabase
      .from('cupons')
      .select('id, codigo, status, valido_ate, gerado_em, usado_em, oferta:ofertas(titulo), associado:associados(numero, perfil:perfis(nome)), vendedor:perfis!cupons_usado_por_fkey(nome)')
      .order('gerado_em', { ascending: false })
      .limit(300);
    const agora = new Date().toISOString();
    if (filtro === 'usado') q = q.eq('status', 'usado');
    if (filtro === 'gerado') q = q.eq('status', 'gerado').gt('valido_ate', agora);
    if (filtro === 'expirado') q = q.or(`status.eq.expirado,and(status.eq.gerado,valido_ate.lte."${agora}")`);
    q.then(({ data: d, error }) => {
      if (error) setErro(mensagemErro(error));
      setLinhas((d as unknown as CupomLinha[]) ?? []);
    });
  }, [filtro]);

  const situacao = (c: CupomLinha) => (c.status === 'usado' ? 'Usado' : c.status === 'expirado' || new Date(c.valido_ate) < new Date() ? 'Expirado' : 'Em aberto');

  function exportar() {
    if (!linhas) return;
    baixarCsv(`cupons-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Código', 'Oferta', 'Associado', 'Nº', 'Gerado em', 'Situação', 'Usado em', 'Vendedor'],
      ...linhas.map((c) => [c.codigo, c.oferta?.titulo, c.associado?.perfil?.nome, c.associado?.numero, dataHora(c.gerado_em), situacao(c), c.usado_em ? dataHora(c.usado_em) : '', c.vendedor?.nome]),
    ]);
  }

  return (
    <>
      <Cabecalho titulo="Cupons" subtitulo="Cupons gerados pelos associados no app" acoes={<button className="btn outline sm" onClick={exportar} disabled={!linhas?.length}>Exportar planilha</button>} />
      <div className="chips" role="group" aria-label="Filtrar cupons">
        {(Object.keys(rotulo) as Filtro[]).map((k) => (
          <button key={k} className={k === filtro ? 'chip active' : 'chip'} aria-pressed={k === filtro} onClick={() => setFiltro(k)}>
            {rotulo[k]}
          </button>
        ))}
      </div>
      {erro && <Erro>{erro}</Erro>}
      {linhas === null ? (
        <Carregando />
      ) : linhas.length === 0 ? (
        <Vazio icone="ticket" titulo="Nenhum cupom aqui" />
      ) : (
        <div className="tabela-caixa">
          <table className="tabela">
            <thead>
              <tr><th>Código</th><th>Oferta</th><th>Associado</th><th>Gerado</th><th>Situação</th><th>Usado</th></tr>
            </thead>
            <tbody>
              {linhas.map((c) => (
                <tr key={c.id}>
                  <td className="mono">{c.codigo}</td>
                  <td>{c.oferta?.titulo ?? '—'}</td>
                  <td>{c.associado?.perfil?.nome ?? '—'} <span className="muted">#{c.associado?.numero}</span></td>
                  <td>{data(c.gerado_em)}</td>
                  <td>{situacao(c)}</td>
                  <td>{c.usado_em ? `${data(c.usado_em)}${c.vendedor ? ' · ' + c.vendedor.nome : ''}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
