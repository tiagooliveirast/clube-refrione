import { Icon, type IconName } from '../components/Icon';
import { Carregando } from '../components/Estados';
import { useAuth } from '../auth/AuthProvider';

const recursos: { titulo: string; texto: string; icon: IconName }[] = [
  { titulo: 'Ordens de serviço', texto: 'Abra, acompanhe e envie a OS em PDF ao cliente.', icon: 'doc' },
  { titulo: 'Financeiro', texto: 'Entradas, saídas e fluxo de caixa do mês.', icon: 'money' },
  { titulo: 'Laudos técnicos', texto: 'Laudo pronto em PDF, com fotos do atendimento.', icon: 'report' },
  { titulo: 'Helô no WhatsApp', texto: 'Assistente que cadastra cliente e OS por mensagem.', icon: 'chat' },
];

export function Refriclube() {
  const { perfil, associado, config } = useAuth();
  if (!perfil || !associado) return <Carregando />;

  const liberado = associado.refriclube_ativo;
  const url = config?.refriclube_url || 'https://refriclube.app.br';

  return (
    <>
      <header className="hero dark">
        <span className="pill yellow tracking-sm">INCLUSO NA SUA ASSINATURA</span>
        <h1 className="text-24">{liberado ? 'Seu acesso ao Refriclube está liberado' : 'Seu acesso ao Refriclube está a caminho'}</h1>
        <p className="on-dark-muted text-13">O sistema de gestão para técnicos: ordens de serviço, financeiro e laudos no celular.</p>
      </header>

      <main className="content">
        <div className="card col gap-10">
          <div className="row-between">
            <span className="muted small">Entre com o mesmo e-mail</span>
            {liberado ? <span className="pill ok">Liberado</span> : <span className="pill warn">Em liberação</span>}
          </div>
          <strong className="text-15 quebra">{perfil.email}</strong>
          {liberado ? (
            <>
              <a href={url} target="_blank" rel="noreferrer" className="btn primary block">
                Abrir o Refriclube <Icon name="external" size={18} stroke={2.2} />
              </a>
              <span className="muted xsmall">Primeiro acesso? Você recebe um link por e-mail para criar sua senha.</span>
            </>
          ) : (
            <span className="muted xsmall">
              {associado.status === 'ativo'
                ? 'Sua assinatura está ativa e o acesso está sendo liberado. Isso costuma levar poucos minutos.'
                : 'O acesso é liberado automaticamente quando sua assinatura do clube estiver ativa.'}
            </span>
          )}
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
