import { Icon, type IconName } from '../components/Icon';
import { associado, REFRICLUBE_URL } from '../data';

const recursos: { titulo: string; texto: string; icon: IconName }[] = [
  { titulo: 'Ordens de serviço', texto: 'Abra, acompanhe e envie a OS em PDF ao cliente.', icon: 'doc' },
  { titulo: 'Financeiro', texto: 'Entradas, saídas e fluxo de caixa do mês.', icon: 'money' },
  { titulo: 'Laudos técnicos', texto: 'Laudo pronto em PDF, com fotos do atendimento.', icon: 'report' },
  { titulo: 'Helô no WhatsApp', texto: 'Assistente que cadastra cliente e OS por mensagem.', icon: 'chat' },
];

export function Refriclube() {
  return (
    <>
      <header className="hero dark">
        <span className="pill yellow tracking-sm">INCLUSO NA SUA ASSINATURA</span>
        <h1 className="text-24">Seu acesso ao Refriclube está liberado</h1>
        <p className="on-dark-muted text-13">O sistema de gestão para técnicos: ordens de serviço, financeiro e laudos no celular.</p>
      </header>

      <main className="content">
        <div className="card col gap-10">
          <div className="row-between">
            <span className="muted small">Entre com o mesmo e-mail</span>
            <span className="pill ok">Liberado</span>
          </div>
          <strong className="text-15">{associado.email}</strong>
          <a href={REFRICLUBE_URL} target="_blank" rel="noreferrer" className="btn primary block">
            Abrir o Refriclube <Icon name="external" size={18} stroke={2.2} />
          </a>
          <span className="muted xsmall">Primeiro acesso? Você recebe um link por e-mail para criar sua senha.</span>
        </div>

        <h2 className="h-sm">O que você usa no Refriclube</h2>
        <div className="grid-2 gap-10">
          {recursos.map((r) => (
            <div key={r.titulo} className="card col gap-8 pad-14">
              <span className="thumb sm">
                <Icon name={r.icon} size={20} />
              </span>
              <strong className="text-14">{r.titulo}</strong>
              <span className="muted xsmall">{r.texto}</span>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
