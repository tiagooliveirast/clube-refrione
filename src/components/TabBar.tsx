import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

const tabs: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Início', icon: 'home' },
  { to: '/carteirinha', label: 'Carteirinha', icon: 'card' },
  { to: '/ofertas', label: 'Ofertas', icon: 'tag' },
  { to: '/refriclube', label: 'Refriclube', icon: 'phoneApp' },
  { to: '/conta', label: 'Conta', icon: 'user' },
];

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Menu principal">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
          <Icon name={t.icon} />
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
