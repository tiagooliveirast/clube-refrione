import { useState, type FormEvent } from 'react';
import { Icon } from '../components/Icon';
import { associado } from '../data';

// Tela do vendedor (rota /balcao). Na fase 2 fica protegida por login de funcionário
// e consulta o status real do associado no Supabase.
export function Balcao() {
  const [numero, setNumero] = useState('');
  const [consultado, setConsultado] = useState(false);
  const [registrado, setRegistrado] = useState(false);

  function consultar(e: FormEvent) {
    e.preventDefault();
    setConsultado(true);
    setRegistrado(false);
  }

  return (
    <div className="balcao">
      <header className="row-between pad-x-20 pt-28 pb-18">
        <div className="row gap-10">
          <Icon name="snow" size={26} stroke={1.8} />
          <div className="col">
            <strong className="text-17">RefriOne Balcão</strong>
            <span className="xsmall on-dark-muted">Vendedor: [NOME DO VENDEDOR]</span>
          </div>
        </div>
      </header>

      <main className="content">
        <div className="scanner">
          <div className="scanner-frame" />
          <span className="small on-dark-muted">Aponte para o QR da carteirinha</span>
        </div>

        <form className="row gap-10" onSubmit={consultar}>
          <label htmlFor="numero" className="sr-only">
            Número do associado
          </label>
          <input
            id="numero"
            className="input-dark grow"
            placeholder="ou digite o nº do associado"
            inputMode="numeric"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
          />
          <button className="btn primary" type="submit">
            Consultar
          </button>
        </form>

        {consultado && (
          <div className="card col gap-12">
            <div className="row gap-10">
              <span className="ok-circle">
                <Icon name="check" size={22} stroke={2.6} />
              </span>
              <div className="col">
                <strong className="text-16 ok-text">Associado ativo</strong>
                <span className="muted small">Consultado agora</span>
              </div>
            </div>
            <div className="grid-2 gap-10 divider-top">
              <Info label="Nome" valor={associado.nome} />
              <Info label="Plano" valor={associado.plano} />
              <Info label="Desconto na compra" valor="[X]% em itens elegíveis" />
              <Info label="Nº" valor={numero || associado.numero} />
            </div>
            <button className="btn primary block" onClick={() => setRegistrado(true)} disabled={registrado}>
              {registrado ? 'Uso registrado' : 'Registrar uso do benefício'}
            </button>
          </div>
        )}
      </main>
    </div>
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
