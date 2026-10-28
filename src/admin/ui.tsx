import { useEffect, type ReactNode } from 'react';
import { Icon } from '../components/Icon';

export function Cabecalho({ titulo, subtitulo, acoes }: { titulo: string; subtitulo?: string; acoes?: ReactNode }) {
  return (
    <div className="adm-cab">
      <div className="col gap-2 min-0">
        <h1 className="h-lg">{titulo}</h1>
        {subtitulo && <p className="muted small">{subtitulo}</p>}
      </div>
      {acoes && <div className="adm-acoes">{acoes}</div>}
    </div>
  );
}

export function Modal({ titulo, aberto, fechar, children, largo }: { titulo: string; aberto: boolean; fechar: () => void; children: ReactNode; largo?: boolean }) {
  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && fechar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [aberto, fechar]);
  if (!aberto) return null;
  return (
    <div className="adm-modal-fundo" onMouseDown={fechar}>
      <div className={largo ? 'adm-modal largo' : 'adm-modal'} role="dialog" aria-modal="true" aria-label={titulo} onMouseDown={(e) => e.stopPropagation()}>
        <div className="row-between">
          <h2 className="h-md">{titulo}</h2>
          <button className="icon-btn" onClick={fechar} aria-label="Fechar">
            <Icon name="plus" size={20} className="girar45" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Campo({ id, rotulo, children, ajuda }: { id: string; rotulo: string; children: ReactNode; ajuda?: string }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      {children}
      {ajuda && <span className="muted xsmall">{ajuda}</span>}
    </div>
  );
}

export function Interruptor({ id, rotulo, valor, mudar }: { id: string; rotulo: string; valor: boolean; mudar: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="interruptor">
      <input id={id} type="checkbox" checked={valor} onChange={(e) => mudar(e.target.checked)} />
      <span>{rotulo}</span>
    </label>
  );
}

export function Kpi({ rotulo, valor, detalhe, destaque }: { rotulo: string; valor: string; detalhe?: string; destaque?: boolean }) {
  return (
    <div className={destaque ? 'kpi destaque' : 'kpi'}>
      <span className="kpi-rotulo">{rotulo}</span>
      <strong className="kpi-valor">{valor}</strong>
      {detalhe && <span className="kpi-detalhe">{detalhe}</span>}
    </div>
  );
}

// Converte "1.234,56" ou "1234.56" em número (ou null se vazio)
export function lerNumero(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t);
  return isNaN(n) ? NaN : n;
}

export function numeroParaCampo(v: number | null | undefined) {
  return v == null ? '' : String(v).replace('.', ',');
}

// Gera e baixa um CSV que abre certo no Excel (separador ; e BOM UTF-8)
export function baixarCsv(nomeArquivo: string, linhas: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = '﻿' + linhas.map((l) => l.map(esc).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

// Para <input type="datetime-local">
export function paraDatetimeLocal(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function dataHora(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
