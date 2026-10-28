import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { data, mensagemErro, reais, rotuloStatus } from '../lib/formato';
import type { StatusAssociado } from '../lib/tipos';
import { StatusPill } from '../components/StatusPill';
import { Carregando, Erro, Vazio } from '../components/Estados';
import { Icon } from '../components/Icon';
import { Cabecalho, baixarCsv } from './ui';

export interface LinhaAssociado {
  id: string;
  numero: string;
  status: StatusAssociado;
  membro_desde: string | null;
  proxima_cobranca: string | null;
  cancelado_em: string | null;
  refriclube_ativo: boolean;
  cpf_cnpj: string | null;
  area_atuacao: string | null;
  cidade: string | null;
  observacoes: string | null;
  criado_em: string;
  plano_id: string | null;
  plano_nome: string | null;
  preco_mensal: number | null;
  perfil_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  papel: string;
  refriclube_sincronizado_em: string | null;
  refriclube_erro: string | null;
  refriclube_aviso: string | null;
  plano_inclui_refriclube: boolean;
}

const POR_PAGINA = 25;
const filtros: ('todos' | StatusAssociado)[] = ['todos', 'ativo', 'pendente', 'inadimplente', 'cancelado'];

export function Associados() {
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [status, setStatus] = useState<(typeof filtros)[number]>('todos');
  const [pagina, setPagina] = useState(0);
  const [linhas, setLinhas] = useState<LinhaAssociado[] | null>(null);
  const [total, setTotal] = useState(0);
  const [erro, setErro] = useState('');
  const [exportando, setExportando] = useState(false);

  // Busca com pequeno atraso para não consultar a cada letra
  useEffect(() => {
    const t = setTimeout(() => {
      setBuscaAplicada(busca.trim());
      setPagina(0);
    }, 350);
    return () => clearTimeout(t);
  }, [busca]);

  const montarConsulta = useCallback(
    (contar: boolean) => {
      let q = supabase.from('vw_associados').select('*', contar ? { count: 'exact' } : undefined);
      if (status !== 'todos') q = q.eq('status', status);
      if (buscaAplicada) {
        const termo = buscaAplicada.replace(/[,()*]/g, ' ');
        const digitos = termo.replace(/\D/g, '');
        const partes = [`nome.ilike.*${termo}*`, `email.ilike.*${termo}*`, `telefone.ilike.*${termo}*`];
        if (digitos) partes.push(`numero.eq.${digitos.padStart(6, '0')}`);
        q = q.or(partes.join(','));
      }
      return q.order('criado_em', { ascending: false });
    },
    [status, buscaAplicada],
  );

  useEffect(() => {
    setLinhas(null);
    setErro('');
    montarConsulta(true)
      .range(pagina * POR_PAGINA, pagina * POR_PAGINA + POR_PAGINA - 1)
      .then(({ data: d, count, error }) => {
        if (error) setErro(mensagemErro(error));
        setLinhas((d as LinhaAssociado[]) ?? []);
        setTotal(count ?? 0);
      });
  }, [montarConsulta, pagina]);

  async function exportar() {
    setExportando(true);
    const { data: d, error } = await montarConsulta(false).range(0, 9999);
    setExportando(false);
    if (error) return setErro(mensagemErro(error));
    const lista = (d as LinhaAssociado[]) ?? [];
    baixarCsv(`associados-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Número', 'Nome', 'E-mail', 'WhatsApp', 'Status', 'Plano', 'Mensalidade', 'Membro desde', 'Próxima cobrança', 'Refriclube liberado', 'Cidade', 'Área de atuação'],
      ...lista.map((a) => [
        a.numero,
        a.nome,
        a.email,
        a.telefone,
        rotuloStatus[a.status],
        a.plano_nome,
        a.preco_mensal != null ? String(a.preco_mensal).replace('.', ',') : '',
        data(a.membro_desde),
        data(a.proxima_cobranca),
        a.refriclube_ativo ? 'Sim' : 'Não',
        a.cidade,
        a.area_atuacao,
      ]),
    ]);
  }

  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <>
      <Cabecalho
        titulo="Associados"
        subtitulo={linhas ? `${total} ${total === 1 ? 'associado' : 'associados'}` : undefined}
        acoes={
          <button className="btn outline sm" onClick={exportar} disabled={exportando}>
            {exportando ? 'Gerando…' : 'Exportar planilha'}
          </button>
        }
      />

      <div className="adm-filtros">
        <label htmlFor="busca" className="sr-only">Buscar</label>
        <input id="busca" className="adm-busca" type="search" placeholder="Buscar por nome, e-mail, WhatsApp ou número" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <div className="chips" role="group" aria-label="Filtrar por status">
          {filtros.map((f) => (
            <button
              key={f}
              className={f === status ? 'chip active' : 'chip'}
              aria-pressed={f === status}
              onClick={() => {
                setStatus(f);
                setPagina(0);
              }}
            >
              {f === 'todos' ? 'Todos' : rotuloStatus[f]}
            </button>
          ))}
        </div>
      </div>

      {erro && <Erro>{erro}</Erro>}

      {linhas === null ? (
        <Carregando />
      ) : linhas.length === 0 ? (
        <Vazio icone="user" titulo="Nenhum associado encontrado" texto={buscaAplicada || status !== 'todos' ? 'Tente outra busca ou outro filtro.' : 'Quando os técnicos se cadastrarem no app, eles aparecem aqui.'} />
      ) : (
        <>
          <div className="so-cel col gap-8">
            {linhas.map((a) => (
              <Link key={a.id} to={`/admin/associados/${a.id}`} className="adm-cartao">
                <div className="col gap-2 grow min-0">
                  <strong className="text-14 ink">{a.nome || '(sem nome)'}</strong>
                  <span className="muted xsmall">#{a.numero} · {a.telefone || a.email}</span>
                </div>
                <StatusPill status={a.status} />
                <Icon name="chevronRight" size={16} className="faint" />
              </Link>
            ))}
          </div>
          <div className="tabela-caixa so-desk">
            <table className="tabela clicavel">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Nome</th>
                  <th>Contato</th>
                  <th>Status</th>
                  <th>Plano</th>
                  <th>Próx. cobrança</th>
                  <th aria-label="Abrir" />
                </tr>
              </thead>
              <tbody>
                {linhas.map((a) => (
                  <tr key={a.id}>
                    <td className="muted">{a.numero}</td>
                    <td>
                      <Link to={`/admin/associados/${a.id}`} className="ink strong">{a.nome || '(sem nome)'}</Link>
                    </td>
                    <td>
                      <div className="col">
                        <span className="small">{a.email}</span>
                        <span className="muted xsmall">{a.telefone}</span>
                      </div>
                    </td>
                    <td><StatusPill status={a.status} /></td>
                    <td>
                      {a.plano_nome ?? '—'} <span className="muted xsmall">{a.preco_mensal != null ? reais(a.preco_mensal) : ''}</span>
                    </td>
                    <td>{data(a.proxima_cobranca)}</td>
                    <td>
                      <Link to={`/admin/associados/${a.id}`} className="icon-btn" aria-label={`Abrir ${a.nome}`}>
                        <Icon name="chevronRight" size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {paginas > 1 && (
            <div className="paginacao">
              <button className="btn outline sm" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>Anterior</button>
              <span className="small muted">Página {pagina + 1} de {paginas}</span>
              <button className="btn outline sm" disabled={pagina + 1 >= paginas} onClick={() => setPagina(pagina + 1)}>Próxima</button>
            </div>
          )}
        </>
      )}
    </>
  );
}
