import type { ReactNode } from 'react';
import { Logo } from '../../components/Logo';

export function AuthLayout({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: ReactNode }) {
  return (
    <div className="auth">
      <header className="auth-hero">
        <Logo />
      </header>
      <main className="auth-card">
        <div className="col gap-4">
          <h1 className="h-lg">{titulo}</h1>
          {subtitulo && <p className="muted small">{subtitulo}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}
