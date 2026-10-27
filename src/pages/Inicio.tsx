import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon';
import { Logo } from '../components/Logo';
import { associado, ofertaDoMes, proximoEvento } from '../data';

const atalhos: { to: string; label: string; icon: IconName }[] = [
  { to: '/ofertas', label: 'Ofertas', icon: 'tag' },
  { to: '/ofertas', label: 'Cupons', icon: 'ticket' },
  { to: '/refriclube', label: 'Refriclube', icon: 'phoneApp' },
  { to: '/#eventos', label: 'Eventos', icon: 'calendar' },
];

export function Inicio() {
  return (
    <>
      <header className="hero">
        <div className="row-between">
          <Logo />
          <button className="icon-btn on-dark" aria-label="Notificações">
            <Icon name="bell" size={20} />
          </button>
        </div>
        <div className="greeting">
          <span>Olá,</span>
          <strong>{associado.nome}</strong>
        </div>
      </header>

      <Link to="/carteirinha" className="status-card">
        <div className="col gap-4">
          <span className="muted small">Sua assinatura</span>
          <div className="row gap-8">
            <strong className="h-sm">Plano {associado.plano}</strong>
            <span className="pill ok">Ativo</span>
          </div>
          <span className="muted small">Associado nº {associado.numero}</span>
        </div>
        <span className="link-inline">
          Carteirinha <Icon name="chevronRight" size={16} stroke={2.4} />
        </span>
      </Link>

      <main className="content">
        <div className="shortcuts">
          {atalhos.map((a) =>
            a.to === '/#eventos' ? (
              <a key={a.label} href="#eventos" className="shortcut">
                <ShortcutInner label={a.label} icon={a.icon} />
              </a>
            ) : (
              <Link key={a.label} to={a.to} className="shortcut">
                <ShortcutInner label={a.label} icon={a.icon} />
              </Link>
            ),
          )}
        </div>

        <section className="col gap-10">
          <div className="row-between baseline">
            <h2 className="h-sm">Oferta do mês</h2>
            <Link to="/ofertas" className="small strong">Ver todas</Link>
          </div>
          <div className="featured">
            <span className="pill yellow">SÓ PARA MEMBROS</span>
            <strong className="featured-title">{ofertaDoMes.nome}</strong>
            <span className="small on-dark-muted">
              Preço de associado: {ofertaDoMes.precoMembro} · válido até {ofertaDoMes.validade}
            </span>
            <Link to="/ofertas" className="btn white">Gerar cupom</Link>
          </div>
        </section>

        <section id="eventos" className="col gap-10">
          <h2 className="h-sm">Próximo evento</h2>
          <div className="card row gap-14">
            <div className="date-badge">
              <strong>{proximoEvento.dia}</strong>
              <span>{proximoEvento.mes}</span>
            </div>
            <div className="col gap-2 grow">
              <strong className="text-14">{proximoEvento.titulo}</strong>
              <span className="muted small">
                {proximoEvento.local} · {proximoEvento.horario}
              </span>
            </div>
            <button className="btn outline sm">Confirmar</button>
          </div>
        </section>
      </main>
    </>
  );
}

function ShortcutInner({ label, icon }: { label: string; icon: IconName }) {
  return (
    <>
      <span className="shortcut-icon">
        <Icon name={icon} size={24} />
      </span>
      {label}
    </>
  );
}
