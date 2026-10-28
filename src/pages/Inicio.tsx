import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon';
import { Logo } from '../components/Logo';
import { StatusPill } from '../components/StatusPill';
import { Carregando, Erro, Vazio } from '../components/Estados';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';
import { data, hora, mensagemErro, primeiroNome, reais } from '../lib/formato';
import type { Comunicado, Evento, Oferta } from '../lib/tipos';

const atalhos: { to: string; label: string; icon: IconName }[] = [
  { to: '/ofertas', label: 'Ofertas', icon: 'tag' },
  { to: '/carteirinha', label: 'Carteirinha', icon: 'card' },
  { to: '/refriclube', label: 'Refriclube', icon: 'phoneApp' },
  { to: '/conta', label: 'Conta', icon: 'user' },
];

export function Inicio() {
  const { perfil, associado } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [destaque, setDestaque] = useState<Oferta | null>(null);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [inscrito, setInscrito] = useState(false);
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [salvandoInscricao, setSalvandoInscricao] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    const agora = new Date().toISOString();
    const [o, ev, c] = await Promise.all([
      supabase.from('ofertas').select('*').eq('destaque', true).order('atualizado_em', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('eventos').select('id, titulo, descricao, data_hora, local').gte('data_hora', agora).order('data_hora').limit(1).maybeSingle(),
      supabase.from('comunicados').select('id, titulo, mensagem, criado_em').eq('publicado', true).order('criado_em', { ascending: false }).limit(3),
    ]);
    setDestaque((o.data as Oferta) ?? null);
    setEvento((ev.data as Evento) ?? null);
    setComunicados((c.data as Comunicado[]) ?? []);

    if (ev.data && associado) {
      const { data: insc } = await supabase
        .from('eventos_inscricoes')
        .select('evento_id')
        .eq('evento_id', (ev.data as Evento).id)
        .eq('associado_id', associado.id)
        .maybeSingle();
      setInscrito(Boolean(insc));
    }
    setCarregando(false);
  }, [associado]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function alternarInscricao() {
    if (!evento || !associado) return;
    setErro('');
    setSalvandoInscricao(true);
    const q = inscrito
      ? supabase.from('eventos_inscricoes').delete().eq('evento_id', evento.id).eq('associado_id', associado.id)
      : supabase.from('eventos_inscricoes').insert({ evento_id: evento.id, associado_id: associado.id });
    const { error } = await q;
    setSalvandoInscricao(false);
    if (error) {
      setErro(associado.status !== 'ativo' ? 'A confirmação em eventos é liberada quando sua assinatura estiver ativa.' : mensagemErro(error));
      return;
    }
    setInscrito(!inscrito);
  }

  const ativo = associado?.status === 'ativo';
  const dataEvento = evento ? new Date(evento.data_hora) : null;

  return (
    <>
      <header className="hero">
        <div className="row-between">
          <Logo />
        </div>
        <div className="greeting">
          <span>Olá,</span>
          <strong>{primeiroNome(perfil?.nome ?? '')}</strong>
        </div>
      </header>

      {associado && ativo && (
        <Link to="/carteirinha" className="status-card">
          <div className="col gap-4">
            <span className="muted small">Sua assinatura</span>
            <div className="row gap-8">
              <strong className="h-sm">Plano {associado.plano?.nome ?? '—'}</strong>
              <StatusPill status={associado.status} />
            </div>
            <span className="muted small">Associado nº {associado.numero}</span>
          </div>
          <span className="link-inline">
            Carteirinha <Icon name="chevronRight" size={16} stroke={2.4} />
          </span>
        </Link>
      )}

      {associado && !ativo && (
        <Link to="/conta" className="status-card pendente">
          <div className="col gap-4">
            <div className="row gap-8">
              <strong className="h-sm">
                {associado.status === 'pendente' ? 'Assinatura aguardando pagamento' : associado.status === 'inadimplente' ? 'Pagamento em atraso' : 'Assinatura cancelada'}
              </strong>
            </div>
            <span className="muted small">
              {associado.status === 'pendente'
                ? 'Assim que o pagamento for confirmado, seus benefícios são liberados.'
                : 'Regularize para voltar a usar os benefícios.'}
            </span>
          </div>
          <Icon name="chevronRight" size={16} stroke={2.4} className="blue" />
        </Link>
      )}

      <main className="content">
        <div className="shortcuts">
          {atalhos.map((a) => (
            <Link key={a.label} to={a.to} className="shortcut">
              <span className="shortcut-icon">
                <Icon name={a.icon} size={24} />
              </span>
              {a.label}
            </Link>
          ))}
        </div>

        {carregando ? (
          <Carregando />
        ) : (
          <>
            {comunicados.length > 0 && (
              <section className="col gap-10">
                <h2 className="h-sm">Avisos do clube</h2>
                {comunicados.map((c) => (
                  <div key={c.id} className="card col gap-4">
                    <strong className="text-14">{c.titulo}</strong>
                    <span className="muted small pre">{c.mensagem}</span>
                  </div>
                ))}
              </section>
            )}

            <section className="col gap-10">
              <div className="row-between baseline">
                <h2 className="h-sm">Oferta em destaque</h2>
                <Link to="/ofertas" className="small strong">Ver todas</Link>
              </div>
              {destaque ? (
                <div className="featured">
                  <span className="pill yellow">SÓ PARA MEMBROS</span>
                  <strong className="featured-title">{destaque.titulo}</strong>
                  <span className="small on-dark-muted">
                    Preço de associado: {reais(destaque.preco_membro)}
                    {destaque.valida_ate ? ` · válido até ${data(destaque.valida_ate)}` : ''}
                  </span>
                  <Link to="/ofertas" className="btn white">Gerar cupom</Link>
                </div>
              ) : (
                <Vazio icone="tag" titulo="Nenhuma oferta em destaque agora" texto="Veja todas as ofertas para membros." />
              )}
            </section>

            <section id="eventos" className="col gap-10">
              <h2 className="h-sm">Próximo evento</h2>
              {evento && dataEvento ? (
                <div className="card row gap-14">
                  <div className="date-badge">
                    <strong>{dataEvento.toLocaleDateString('pt-BR', { day: '2-digit' })}</strong>
                    <span>{dataEvento.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()}</span>
                  </div>
                  <div className="col gap-2 grow min-0">
                    <strong className="text-14">{evento.titulo}</strong>
                    <span className="muted small">
                      {evento.local ? `${evento.local} · ` : ''}
                      {hora(evento.data_hora)}
                    </span>
                  </div>
                  <button className={inscrito ? 'btn primary sm' : 'btn outline sm'} onClick={alternarInscricao} disabled={salvandoInscricao}>
                    {inscrito ? 'Confirmado' : 'Confirmar'}
                  </button>
                </div>
              ) : (
                <Vazio icone="calendar" titulo="Nenhum evento marcado" texto="Quando a loja marcar um encontro, ele aparece aqui." />
              )}
              {erro && <Erro>{erro}</Erro>}
            </section>
          </>
        )}
      </main>
    </>
  );
}
