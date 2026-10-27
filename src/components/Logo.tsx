import { Icon } from './Icon';

// Logo provisório. Substituir pelo arquivo oficial da RefriOne em /public quando a loja enviar.
export function Logo({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <div className="logo">
      <Icon name="snow" size={28} stroke={1.8} />
      <div className="logo-text">
        <strong>RefriOne</strong>
        {subtitle && <small>CLUBE DE BENEFÍCIOS</small>}
      </div>
    </div>
  );
}
