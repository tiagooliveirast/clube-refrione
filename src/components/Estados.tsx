import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="estado" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span className="muted small">{texto}</span>
    </div>
  );
}

export function Vazio({ icone = 'box', titulo, texto }: { icone?: IconName; titulo: string; texto?: string }) {
  return (
    <div className="estado card">
      <span className="thumb sm">
        <Icon name={icone} size={20} />
      </span>
      <strong className="text-14">{titulo}</strong>
      {texto && <span className="muted xsmall text-center">{texto}</span>}
    </div>
  );
}

export function Erro({ children }: { children: ReactNode }) {
  return (
    <div className="alerta erro" role="alert">
      {children}
    </div>
  );
}

export function Aviso({ children }: { children: ReactNode }) {
  return <div className="alerta aviso">{children}</div>;
}
