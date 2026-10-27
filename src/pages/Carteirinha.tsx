import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { associado } from '../data';

export function Carteirinha() {
  const [consultadoEm, setConsultadoEm] = useState(() => horaAgora());

  return (
    <>
      <header className="page-header">
        <Link to="/" className="icon-btn" aria-label="Voltar">
          <Icon name="chevronLeft" size={20} stroke={2.2} />
        </Link>
        <h1 className="h-md">Minha carteirinha</h1>
      </header>

      <main className="content">
        <div className="member-card">
          <Icon name="snow" size={180} stroke={1.2} className="member-card-bg" />
          <div className="row-between">
            <div className="row gap-8">
              <Icon name="snow" size={24} stroke={1.8} />
              <strong className="text-17">RefriOne</strong>
            </div>
            <span className="pill yellow tracking">{associado.plano.toUpperCase()}</span>
          </div>
          <div className="col gap-2">
            <span className="label-caps">ASSOCIADO</span>
            <strong className="text-21">{associado.nome}</strong>
          </div>
          <div className="grid-2">
            <div className="col gap-2">
              <span className="small on-dark-muted">Nº do associado</span>
              <strong>{associado.numero}</strong>
            </div>
            <div className="col gap-2">
              <span className="small on-dark-muted">Membro desde</span>
              <strong>{associado.membroDesde}</strong>
            </div>
          </div>
        </div>

        <div className="card col center gap-14 pad-22">
          <span className="pill ok lg">
            <Icon name="check" size={16} stroke={2.6} /> Assinatura ativa
          </span>
          <QrIlustrativo />
          <span className="muted small text-center">
            Mostre este código no balcão da RefriOne ou no parceiro. A validação consulta seu cadastro na hora.
            <br />
            Status consultado às {consultadoEm}.
          </span>
        </div>

        <button className="btn primary block" onClick={() => setConsultadoEm(horaAgora())}>
          Atualizar status
        </button>
      </main>
    </>
  );
}

function horaAgora() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// QR apenas ilustrativo. Na fase 2 o QR codifica um token temporário assinado pelo servidor.
function QrIlustrativo() {
  return (
    <svg width="176" height="176" viewBox="0 0 21 21" role="img" aria-label="QR Code de validação (ilustrativo)" shapeRendering="crispEdges">
      <rect width="21" height="21" fill="#FFFFFF" />
      <g fill="#0E1A3A">
        <path
          fillRule="evenodd"
          d="M0 0h7v7H0zM1 1v5h5V1zM2 2h3v3H2zM14 0h7v7h-7zM15 1v5h5V1zM16 2h3v3h-3zM0 14h7v7H0zM1 15v5h5v-5zM2 16h3v3H2z"
        />
        <path d="M8 0h1v1H8zM10 0h2v1h-2zM9 2h2v1H9zM8 4h1v2H8zM11 3h1v3h-1zM9 6h1v1H9zM8 8h3v1H8zM0 8h2v1H0zM3 8h1v2H3zM5 9h2v1H5zM12 8h2v2h-2zM15 8h1v1h-1zM17 8h4v1h-4zM1 10h1v2H1zM6 11h2v1H6zM9 10h1v3H9zM11 11h2v1h-2zM14 10h2v1h-2zM18 10h1v2h-1zM20 10h1v1h-1zM0 12h1v1H0zM3 12h2v1H3zM12 13h1v2h-1zM15 12h2v2h-2zM19 13h2v1h-2zM8 14h2v1H8zM10 16h3v1h-3zM8 18h1v3H8zM14 15h1v1h-1zM16 15h3v1h-3zM20 16h1v2h-1zM14 17h2v2h-2zM17 18h2v1h-2zM10 19h2v2h-2zM13 20h1v1h-1zM16 20h3v1h-3z" />
      </g>
    </svg>
  );
}
