import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { StatusPill } from '../components/StatusPill';
import { Carregando, Vazio } from '../components/Estados';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';
import { data, iniciais, mesAno, reais, rotuloPagamento } from '../lib/formato';
import type { Pagamento, UsoBeneficio } from '../lib/tipos';

type Aba = 'pagamentos' | 'beneficios';

export function Conta() {
  const { perfil, associado, config, sair } = useAuth();
  const [aba, setAba] = useState<Aba>('pagamentos');
  const [pagamentos, setPagamentos] = useState<Pagamento[] | null>(null);
  const [usos, setUsos] = useState<UsoBeneficio[] | null>(null);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    if (!associado) return;
    supabase
      .from('pagamentos')
      .select('id, valor, status, vencimento, pago_em, metodo')
      .eq('associado_id', associado.id)
      .order('criado_em', { ascending: false })
      .limit(24)
      .then(({ data: d }) => setPagamentos((d as Pagamento[]) ?? []));
    supabase
      .from('usos_beneficio')
      .select('id, descricao, valor_compra, valor_desconto, criado_em')
      .eq('associado_id', associado.id)
      .order('criado_em', { ascending: false })
      .limit(30)
      .then(({ data: d }) => setUsos((d as UsoBeneficio[]) ?? []));
  }, [associado]);

  if (!perfil || !associado) return <Carregando />;

  const whatsapp = config?.whatsapp?.replace(/\D/g, '');
  const economia = (usos ?? []).reduce((t, u) => t + Number(u.valor_desconto ?? 0), 0);

  async function encerrarSessao() {
    setSaindo(true);
    await sair();
  }

  return (
    <>
      <header className="page-header gap-14">
        <span className="avatar">{iniciais(perfil.nome)}</span>
        <div className="col gap-2 min-0">
          <h1 className="h-md">{perfil.nome}</h1>
          <span className="muted small quebra">{perfil.email}</span>
        </div>
      </header>

      <main className="content">
        <div className="card col gap-12">
          <div className="row-between">
            <strong className="text-15">Plano {associado.plano?.nome ?? '—'}</strong>
            <StatusPill status={associado.status} />
          </div>
          <div className="grid-2 gap-10">
            <Info label="Nº do associado" valor={associado.numero} />
            <Info label="Mensalidade" valor={associado.plano ? reais(associado.plano.preco_mensal) : '—'} />
            <Info label="Próxima cobrança" valor={data(associado.proxima_cobranca)} />
            <Info label="Membro desde" valor={mesAno(associado.membro_desde)} />
          </div>
          {economia > 0 && (
            <div className="economia">
              Você já economizou <strong>{reais(economia)}</strong> com o clube.
            </div>
          )}
        </div>

        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={aba === 'pagamentos'} className={aba === 'pagamentos' ? 'tab-btn active' : 'tab-btn'} onClick={() => setAba('pagamentos')}>
            Pagamentos
          </button>
          <button role="tab" aria-selected={aba === 'beneficios'} className={aba === 'beneficios' ? 'tab-btn active' : 'tab-btn'} onClick={() => setAba('beneficios')}>
            Benefícios usados
          </button>
        </div>

        {aba === 'pagamentos' &&
          (pagamentos === null ? (
            <Carregando />
          ) : pagamentos.length === 0 ? (
            <Vazio icone="history" titulo="Nenhum pagamento ainda" />
          ) : (
            <div className="card list">
              {pagamentos.map((p) => (
                <div key={p.id} className="list-item static">
                  <div className="col gap-2 grow">
                    <span className="text-14">{reais(p.valor)}</span>
                    <span className="muted xsmall">{p.pago_em ? `Pago em ${data(p.pago_em)}` : `Vencimento ${data(p.vencimento)}`}</span>
                  </div>
                  <span className={p.status === 'pago' ? 'pill ok' : p.status === 'pendente' ? 'pill warn' : 'pill neutral'}>{rotuloPagamento[p.status]}</span>
                </div>
              ))}
            </div>
          ))}

        {aba === 'beneficios' &&
          (usos === null ? (
            <Carregando />
          ) : usos.length === 0 ? (
            <Vazio icone="gift" titulo="Nenhum benefício usado ainda" texto="Gere um cupom em Ofertas e apresente no balcão." />
          ) : (
            <div className="card list">
              {usos.map((u) => (
                <div key={u.id} className="list-item static">
                  <div className="col gap-2 grow">
                    <span className="text-14">{u.descricao || 'Compra na RefriOne'}</span>
                    <span className="muted xsmall">{data(u.criado_em)}</span>
                  </div>
                  {u.valor_desconto != null && <strong className="text-14 ok-text">-{reais(u.valor_desconto)}</strong>}
                </div>
              ))}
            </div>
          ))}

        <div className="card list">
          {config?.regulamento_url && (
            <a href={config.regulamento_url} target="_blank" rel="noreferrer" className="list-item">
              <Icon name="doc" size={20} className="blue" />
              <span className="grow">Regulamento do clube</span>
              <Icon name="chevronRight" size={16} stroke={2.2} className="faint" />
            </a>
          )}
          <button className="list-item" onClick={encerrarSessao} disabled={saindo}>
            <Icon name="user" size={20} className="blue" />
            <span className="grow">{saindo ? 'Saindo…' : 'Sair da conta'}</span>
            <Icon name="chevronRight" size={16} stroke={2.2} className="faint" />
          </button>
        </div>

        {whatsapp && (
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="btn primary block">
            <Icon name="chat" size={20} /> Falar com o clube no WhatsApp
          </a>
        )}
      </main>
    </>
  );
}

function Info({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="col gap-2">
      <span className="muted xsmall">{label}</span>
      <strong className="text-14">{valor}</strong>
    </div>
  );
}
