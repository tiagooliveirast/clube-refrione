import type { StatusAssociado } from '../lib/tipos';
import { rotuloStatus } from '../lib/formato';

const classe: Record<StatusAssociado, string> = {
  ativo: 'pill ok',
  pendente: 'pill warn',
  inadimplente: 'pill bad',
  cancelado: 'pill neutral',
};

export function StatusPill({ status }: { status: StatusAssociado }) {
  return <span className={classe[status]}>{rotuloStatus[status]}</span>;
}
