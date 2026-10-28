import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { data, mensagemErro, reais, rotuloPagamento, rotuloStatus } from '../lib/formato';
import type { Pagamento, Plano, StatusAssociado } from '../lib/tipos';
import { StatusPill } from '../components/StatusPill';
import { Carregando, Erro, Vazio } from '../components/Estados';
import { Icon } from '../components/Icon';
import { Cabecalho, Campo, Modal, dataHora, lerNumero, numeroParaCampo } from './ui';
import type { LinhaAssociado } from './Associados';

interface CupomLinha {
  id: string;
  codigo: string;
  status: string;
  gerado_em: string;
  usado_em: string | null;
  oferta: { titulo: string } | null;
}
interface UsoLinha {
  id: string;
  descricao: string | null;
  valor_compra: number | null;
  valor_desconto: number | null;
  criado_em: string;
}

const statusOpcoes: StatusAssociado[] = ['pendente', 'ativo', 'inadimplente', 'cancelado'];

export function AssociadoDetalhe() {
  const { id } = useParams();
  const [a, setA] = useState<LinhaAssociado | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[] | null>(null);
  const [cupons, setCupons] = useState<CupomLinha[] | null>(null);
  const [usos, setUsos] = useState<UsoLinha[] | null>(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  // edição
  const [statusEd, setStatusEd] = useState<StatusAssociado>('pendente');
  const [planoEd, setPlanoEd] = useState('');
  const [proximaEd, setProximaEd] = useState('');
  const [cidadeEd, setCidadeEd] = useState('');
  const [areaEd, setAreaEd] = useState('');
  const [docEd, setDocEd] = useState('');
  const [obsEd, setObsEd] = useState('');
  const [salvando, setSalvando] = useState(false);

  // pagamento manual
  const [pagAberto, setPagAberto] = useState(false);
  const [pagValor, setPagValor] = useState('');
  const [pagMetodo, setPagMetodo] = useState('Pix');
  const [pagSalvando, setPagSalvando] = useState(false);
  const [pagErro, setPagErro] = useState('');

  const [sincronizando, setSincronizando] = useState(false);

  const carregar = useCallback(async () => {
    if (!id) return;
    const { data: d, error } = await supabase.from('vw_associados').select('*').eq('id', id).maybeSingle();
    if (error) return setErro(mensagemErro(error));
    if (!d) return setNaoEncontrado(true);
    const linha = d as LinhaAssociado;
    setA(linha);
    setStatusEd(linha.status);
    setPlanoEd(linha.plano_id ?? '');
    setProximaEd(linha.proxima_cobranca ?? '');
    setCidadeEd(linha.cidade ?? '');
    setAreaEd(linha.area_atuacao ?? '');
    setDocEd(linha.cpf_cnpj ?? '');
    setObsEd(linha.observacoes ?? '');

    const [p, c, u] = await Promise.all([
      supabase.from('pagamentos').select('id, valor, status, vencimento, pago_em, metodo').eq('associado_id', id).order('criado_em', { ascending: false }),
      supabase.from('cupons').select('id, codigo, status, gerado_em, usado_em, oferta:ofertas(titulo)').eq('associado_id', id).order('gerado_em', { ascending: false }).limit(50),
      supabase.from('usos_beneficio').select('id, descricao, valor_compra, valor_desconto, criado_em').eq('associado_id', id).order('criado_em', { ascending: false }).limit(50),
    ]);
    setPagamentos((p.data as Pagamento[]) ?? []);
    setCupons((c.data as unknown as CupomLinha[]) ?? []);
    setUsos((u.data as UsoLinha[]) ?? []);
  }, [id]);

  useEffect(() => {
    carregar();
    supabase.from('planos').select('id, nome, descricao, preco_mensal, desconto_padrao').order('ordem').then(({ data: d }) => setPlanos((d as Plano[]) ?? []));
  }, [carregar]);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!a) return;
    setErro('');
    setAviso('');
    setSalvando(true);
    const { error } = await supabase
      .from('associados')
      .update({
        status: statusEd,
        plano_id: planoEd || null,
        proxima_cobranca: proximaEd || null,
        cidade: cidadeEd.trim() || null,
        area_atuacao: areaEd.trim() || null,
        cpf_cnpj: docEd.trim() || null,
        observacoes: obsEd.trim() || null,
      })
      .eq('id', a.id);
    setSalvando(false);
    if (error) return setErro(mensagemErro(error));
    setAviso('Alterações salvas.');
    carregar();
  }

  function abrirPagamento() {
    setPagErro('');
    setPagValor(numeroParaCampo(a?.preco_mensal ?? null));
    setPagMetodo('Pix');
    setPagAberto(true);
  }

  async function registrarPagamento(e: FormEvent) {
    e.preventDefault();
    if (!a) return;
    const valor = lerNumero(pagValor);
    if (valor == null || isNaN(valor) || valor <= 0) return setPagErro('Digite o valor recebido, ex.: 89,00');
    setPagSalvando(true);
    const { error } = await supabase.rpc('registrar_pagamento_manual', { p_associado_id: a.id, p_valor: valor, p_metodo: pagMetodo });
    setPagSalvando(false);
    if (error) return setPagErro(mensagemErro(error));
    setPagAberto(false);
    setAviso('Pagamento registrado. O associado está ativo e a próxima cobrança foi atualizada.');
    carregar();
  }

  async function sincronizarRefriclube() {
    if (!a) return;
    setErro('');
    setAviso('');
    setSincronizando(true);
    const { data: r, error } = await supabase.functions.invoke('sincronizar-refriclube', { body: { associado_id: a.id } });
    setSincronizando(false);
    if (error) return setErro('Não foi possível falar com o Refriclube agora. Tente de novo em alguns minutos.');
    const res = r as { erros?: number } | null;
    if (res?.erros) setErro('O Refriclube recusou a sincronização. Veja o motivo no quadro do Refriclube.');
    else setAviso('Refriclube sincronizado.');
    carregar();
  }

  if (naoEncontrado) return <Vazio icone="user" titulo="Associado não encontrado" />;
  if (!a) return erro ? <Erro>{erro}</Erro> : <Carregando />;

  const whats = a.telefone?.replace(/\D/g, '');
  const whatsLink = whats ? `https://wa.me/${whats.length <= 11 ? '55' + whats : whats}` : null;
  const economia = (usos ?? []).reduce((t, u) => t + Number(u.valor_desconto ?? 0), 0);
  const compras = (usos ?? []).reduce((t, u) => t + Number(u.valor_compra ?? 0), 0);

  return (
    <>
      <Link to="/admin/associados" className="small strong voltar">
        <Icon name="chevronLeft" size={16} /> Associados
      </Link>
      <Cabecalho
        titulo={a.nome || '(sem nome)'}
        subtitulo={`Associado nº ${a.numero} · cadastrado em ${data(a.criado_em)}`}
        acoes={
          <>
            {whatsLink && (
              <a href={whatsLink} target="_blank" rel="noreferrer" className="btn outline sm">
                <Icon name="chat" size={18} /> WhatsApp
              </a>
            )}
            <button className="btn primary sm" onClick={abrirPagamento}>Registrar pagamento</button>
          </>
        }
      />

      {aviso && <div className="alerta sucesso">{aviso}</div>}
      {erro && <Erro>{erro}</Erro>}

      <div className="adm-grade">
        <section className="adm-bloco">
          <h2 className="h-sm">Resumo</h2>
          <div className="grid-2 gap-10">
            <Info rotulo="Status" valor={<StatusPill status={a.status} />} />
            <Info rotulo="Plano" valor={`${a.plano_nome ?? '—'} ${a.preco_mensal != null ? '· ' + reais(a.preco_mensal) : ''}`} />
            <Info rotulo="E-mail" valor={a.email} />
            <Info rotulo="WhatsApp" valor={a.telefone || '—'} />
            <Info rotulo="Membro desde" valor={data(a.membro_desde)} />
            <Info rotulo="Próxima cobrança" valor={data(a.proxima_cobranca)} />
            <Info rotulo="Refriclube" valor={a.refriclube_ativo ? 'Liberado' : 'Não liberado'} />
            <Info rotulo="Compras / economia" valor={`${reais(compras)} / ${reais(economia)}`} />
          </div>
        </section>

        <section className="adm-bloco">
          <h2 className="h-sm">Editar cadastro</h2>
          <form className="col gap-12" onSubmit={salvar}>
            <div className="grid-2 gap-10">
              <Campo id="status" rotulo="Status">
                <select id="status" value={statusEd} onChange={(e) => setStatusEd(e.target.value as StatusAssociado)}>
                  {statusOpcoes.map((s) => (
                    <option key={s} value={s}>{rotuloStatus[s]}</option>
                  ))}
                </select>
              </Campo>
              <Campo id="plano" rotulo="Plano">
                <select id="plano" value={planoEd} onChange={(e) => setPlanoEd(e.target.value)}>
                  <option value="">Sem plano</option>
                  {planos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome} · {reais(p.preco_mensal)}</option>
                  ))}
                </select>
              </Campo>
              <Campo id="proxima" rotulo="Próxima cobrança">
                <input id="proxima" type="date" value={proximaEd} onChange={(e) => setProximaEd(e.target.value)} />
              </Campo>
              <Campo id="doc" rotulo="CPF ou CNPJ">
                <input id="doc" value={docEd} onChange={(e) => setDocEd(e.target.value)} />
              </Campo>
              <Campo id="cidade" rotulo="Cidade">
                <input id="cidade" value={cidadeEd} onChange={(e) => setCidadeEd(e.target.value)} />
              </Campo>
              <Campo id="area" rotulo="Área de atuação">
                <input id="area" value={areaEd} onChange={(e) => setAreaEd(e.target.value)} />
              </Campo>
            </div>
            <Campo id="obs" rotulo="Observações internas" ajuda="Só a equipe da loja vê.">
              <textarea id="obs" rows={3} value={obsEd} onChange={(e) => setObsEd(e.target.value)} />
            </Campo>
            {statusEd === 'cancelado' && a.status !== 'cancelado' && (
              <div className="alerta aviso">Ao cancelar, o associado perde os benefícios e o acesso ao Refriclube é revogado na hora.</div>
            )}
            <button className="btn primary" type="submit" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </form>
        </section>
      </div>

      <section className="adm-bloco">
        <div className="row-between gap-10">
          <div className="col gap-2">
            <h2 className="h-sm">Acesso ao Refriclube</h2>
            <span className="muted xsmall">
              {a.refriclube_ativo ? 'Liberado' : 'Não liberado'}
              {a.refriclube_sincronizado_em ? ` · última sincronização ${dataHora(a.refriclube_sincronizado_em)}` : ' · ainda não sincronizado'}
            </span>
          </div>
          <button className="btn outline sm" onClick={sincronizarRefriclube} disabled={sincronizando}>
            {sincronizando ? 'Sincronizando…' : 'Sincronizar agora'}
          </button>
        </div>
        <span className="small muted">
          {a.status === 'ativo' && a.plano_inclui_refriclube
            ? 'Associado ativo em plano com Refriclube: o acesso deve estar liberado.'
            : a.plano_inclui_refriclube
              ? 'O acesso é liberado automaticamente quando o associado ficar ativo.'
              : 'O plano deste associado não inclui o Refriclube.'}
        </span>
        {a.refriclube_aviso && <div className="alerta aviso">{a.refriclube_aviso}</div>}
        {a.refriclube_erro && <Erro>Falha na última tentativa: {a.refriclube_erro}</Erro>}
      </section>

      <section className="adm-bloco">
        <h2 className="h-sm">Pagamentos</h2>
        {pagamentos === null ? (
          <Carregando />
        ) : pagamentos.length === 0 ? (
          <Vazio icone="history" titulo="Nenhum pagamento registrado" texto='Use "Registrar pagamento" quando receber por Pix ou no balcão.' />
        ) : (
          <div className="tabela-caixa">
            <table className="tabela">
              <thead>
                <tr><th>Data</th><th className="num">Valor</th><th>Forma</th><th>Status</th></tr>
              </thead>
              <tbody>
                {pagamentos.map((p) => (
                  <tr key={p.id}>
                    <td>{data(p.pago_em ?? p.vencimento)}</td>
                    <td className="num">{reais(p.valor)}</td>
                    <td>{p.metodo ?? '—'}</td>
                    <td>{rotuloPagamento[p.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="adm-grade">
        <section className="adm-bloco">
          <h2 className="h-sm">Benefícios usados</h2>
          {usos === null ? (
            <Carregando />
          ) : usos.length === 0 ? (
            <Vazio icone="gift" titulo="Nenhum uso ainda" />
          ) : (
            <div className="tabela-caixa">
              <table className="tabela">
                <thead>
                  <tr><th>Data</th><th>Compra</th><th className="num">Desconto</th></tr>
                </thead>
                <tbody>
                  {usos.map((u) => (
                    <tr key={u.id}>
                      <td>{data(u.criado_em)}</td>
                      <td>{u.descricao || '—'}</td>
                      <td className="num">{reais(u.valor_desconto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="adm-bloco">
          <h2 className="h-sm">Cupons</h2>
          {cupons === null ? (
            <Carregando />
          ) : cupons.length === 0 ? (
            <Vazio icone="ticket" titulo="Nenhum cupom gerado" />
          ) : (
            <div className="tabela-caixa">
              <table className="tabela">
                <thead>
                  <tr><th>Código</th><th>Oferta</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {cupons.map((c) => (
                    <tr key={c.id}>
                      <td className="mono">{c.codigo}</td>
                      <td>{c.oferta?.titulo ?? '—'}</td>
                      <td>{c.status === 'usado' ? `Usado ${data(c.usado_em)}` : c.status === 'gerado' ? 'Gerado' : 'Expirado'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <Modal titulo="Registrar pagamento recebido" aberto={pagAberto} fechar={() => setPagAberto(false)}>
        <form className="col gap-12" onSubmit={registrarPagamento}>
          <p className="small muted">
            Use quando o associado pagar por Pix, dinheiro ou cartão na loja. Ele fica <strong>ativo</strong> e a próxima cobrança avança 1 mês.
          </p>
          <Campo id="pagValor" rotulo="Valor recebido (R$)">
            <input id="pagValor" inputMode="decimal" value={pagValor} onChange={(e) => setPagValor(e.target.value)} />
          </Campo>
          <Campo id="pagMetodo" rotulo="Forma de pagamento">
            <select id="pagMetodo" value={pagMetodo} onChange={(e) => setPagMetodo(e.target.value)}>
              <option>Pix</option>
              <option>Dinheiro</option>
              <option>Cartão na loja</option>
              <option>Transferência</option>
            </select>
          </Campo>
          {pagErro && <Erro>{pagErro}</Erro>}
          <button className="btn primary block" type="submit" disabled={pagSalvando}>
            {pagSalvando ? 'Registrando…' : 'Confirmar pagamento'}
          </button>
          <span className="muted xsmall">Registrado em {dataHora(new Date().toISOString())}.</span>
        </form>
      </Modal>
    </>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: ReactNode }) {
  return (
    <div className="col gap-2 min-0">
      <span className="muted xsmall">{rotulo}</span>
      <span className="text-14 strong quebra">{valor}</span>
    </div>
  );
}
