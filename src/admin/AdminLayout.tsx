import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Icon, type IconName } from '../components/Icon';
import { useAuth } from '../auth/AuthProvider';

const menu: { to: string; rotulo: string; icone: IconName }[] = [
  { to: '/admin', rotulo: 'Visão geral', icone: 'home' },
  { to: '/admin/associados', rotulo: 'Associados', icone: 'user' },
  { to: '/admin/ofertas', rotulo: 'Ofertas', icone: 'tag' },
  { to: '/admin/cupons', rotulo: 'Cupons', icone: 'ticket' },
  { to: '/admin/eventos', rotulo: 'Eventos', icone: 'calendar' },
  { to: '/admin/comunicados', rotulo: 'Comunicados', icone: 'bell' },
  { to: '/admin/planos', rotulo: 'Planos', icone: 'creditCard' },
  { to: '/admin/equipe', rotulo: 'Equipe', icone: 'shield' },
  { to: '/admin/configuracoes', rotulo: 'Configurações', icone: 'doc' },
];

export function AdminLayout() {
  const { perfil, sair } = useAuth();
  const [aberto, setAberto] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setAberto(false), [pathname]);

  return (
    <div className="adm">
      <header className="adm-topo">
        <button className="icon-btn on-dark adm-hamburguer" aria-label="Abrir menu" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <div className="row gap-10">
          <Icon name="snow" size={24} stroke={1.8} />
          <div className="col">
            <strong className="text-15">RefriOne</strong>
            <span className="xsmall on-dark-muted">Painel do clube</span>
          </div>
        </div>
      </header>

      <nav className={aberto ? 'adm-menu aberto' : 'adm-menu'} aria-label="Menu do painel">
        <div className="adm-marca">
          <Icon name="snow" size={26} stroke={1.8} />
          <div className="col">
            <strong className="text-17">RefriOne</strong>
            <span className="xsmall on-dark-muted">Painel do clube</span>
          </div>
        </div>
        <div className="adm-links">
          {menu.map((m) => (
            <NavLink key={m.to} to={m.to} end={m.to === '/admin'} className={({ isActive }) => (isActive ? 'adm-link ativo' : 'adm-link')}>
              <Icon name={m.icone} size={20} />
              {m.rotulo}
            </NavLink>
          ))}
        </div>
        <div className="adm-rodape">
          <Link to="/balcao" className="adm-link">
            <Icon name="scan" size={20} /> Balcão
          </Link>
          <Link to="/" className="adm-link">
            <Icon name="phoneApp" size={20} /> App do associado
          </Link>
          <button className="adm-link" onClick={sair}>
            <Icon name="chevronLeft" size={20} /> Sair
          </button>
          <span className="xsmall on-dark-muted adm-usuario">{perfil?.email}</span>
        </div>
      </nav>
      {aberto && <div className="adm-sombra" onClick={() => setAberto(false)} />}

      <main className="adm-conteudo">
        <Outlet />
      </main>
    </div>
  );
}
