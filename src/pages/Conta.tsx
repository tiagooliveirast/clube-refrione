import { Icon, type IconName } from '../components/Icon';
import { associado, WHATSAPP_CLUBE } from '../data';

const itens: { label: string; icon: IconName }[] = [
  { label: 'Histórico de pagamentos', icon: 'history' },
  { label: 'Trocar forma de pagamento', icon: 'creditCard' },
  { label: 'Benefícios utilizados', icon: 'gift' },
  { label: 'Regulamento do clube', icon: 'doc' },
  { label: 'Privacidade e dados', icon: 'shield' },
];

export function Conta() {
  return (
    <>
      <header className="page-header gap-14">
        <span className="avatar">{associado.iniciais}</span>
        <div className="col gap-2">
          <h1 className="h-md">{associado.nome}</h1>
          <span className="muted small">{associado.email}</span>
        </div>
      </header>

      <main className="content">
        <div className="card col gap-12">
          <div className="row-between">
            <strong className="text-15">Plano {associado.plano}</strong>
            <span className="pill ok">Ativo</span>
          </div>
          <div className="grid-2 gap-10">
            <Info label="Mensalidade" valor={associado.mensalidade} />
            <Info label="Próxima cobrança" valor={associado.proximaCobranca} />
            <Info label="Pagamento" valor={`Cartão final ${associado.cartaoFinal}`} />
            <Info label="Membro desde" valor={associado.membroDesde} />
          </div>
        </div>

        <div className="card list">
          {itens.map((i) => (
            <button key={i.label} className="list-item">
              <Icon name={i.icon} size={20} className="blue" />
              <span className="grow">{i.label}</span>
              <Icon name="chevronRight" size={16} stroke={2.2} className="faint" />
            </button>
          ))}
        </div>

        <a href={`https://wa.me/${WHATSAPP_CLUBE}`} target="_blank" rel="noreferrer" className="btn primary block">
          <Icon name="chat" size={20} /> Falar com o clube no WhatsApp
        </a>
        <button className="btn ghost">Cancelar assinatura</button>
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
