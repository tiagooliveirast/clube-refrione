import { useState } from 'react';
import { Icon } from '../components/Icon';
import { ofertas, type Categoria, type Oferta } from '../data';

const filtros: ('Todas' | Categoria)[] = ['Todas', 'Refrigeração', 'Ar-condicionado', 'Linha branca'];

export function Ofertas() {
  const [filtro, setFiltro] = useState<(typeof filtros)[number]>('Todas');
  const [cupom, setCupom] = useState<Oferta | null>(null);
  const lista = filtro === 'Todas' ? ofertas : ofertas.filter((o) => o.categoria === filtro);

  return (
    <>
      <header className="page-header col start gap-14">
        <div className="col gap-2">
          <h1 className="h-lg">Ofertas para membros</h1>
          <span className="muted small">Gere o cupom e apresente no balcão</span>
        </div>
        <div className="chips" role="group" aria-label="Filtrar por categoria">
          {filtros.map((f) => (
            <button key={f} className={f === filtro ? 'chip active' : 'chip'} aria-pressed={f === filtro} onClick={() => setFiltro(f)}>
              {f}
            </button>
          ))}
        </div>
      </header>

      <main className="content">
        {lista.map((o) => (
          <div key={o.id} className="card row gap-14">
            <span className="thumb">
              <Icon name="box" size={30} stroke={1.8} />
            </span>
            <div className="col gap-2 grow min-0">
              <span className="cat">{o.categoria.toUpperCase()}</span>
              <strong className="text-14">{o.nome}</strong>
              <span className="muted small">
                Membro: <strong className="ink">{o.precoMembro}</strong> · {o.detalhe}
              </span>
            </div>
            <button className="icon-btn primary" aria-label={`Gerar cupom: ${o.nome}`} onClick={() => setCupom(o)}>
              <Icon name="plus" size={20} stroke={2.2} />
            </button>
          </div>
        ))}

        <div className="card dashed row gap-12">
          <Icon name="bolt" size={26} className="blue" />
          <span className="muted small">
            Associados veem as promoções da loja <strong className="ink">antes de todo mundo</strong>.
          </span>
        </div>
      </main>

      {cupom && (
        <div className="sheet-backdrop" onClick={() => setCupom(null)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Cupom gerado" onClick={(e) => e.stopPropagation()}>
            <span className="pill ok lg">
              <Icon name="check" size={16} stroke={2.6} /> Cupom gerado
            </span>
            <strong className="text-17 text-center">{cupom.nome}</strong>
            <div className="coupon-code">[CÓDIGO-DO-CUPOM]</div>
            <span className="muted small text-center">Mostre este código ao vendedor. Válido para uma compra.</span>
            <button className="btn primary block" onClick={() => setCupom(null)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
