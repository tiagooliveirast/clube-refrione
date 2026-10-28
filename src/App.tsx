import { useEffect, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import { TabBar } from './components/TabBar';
import { Carregando } from './components/Estados';
import { Inicio } from './pages/Inicio';
import { Carteirinha } from './pages/Carteirinha';
import { Ofertas } from './pages/Ofertas';
import { Refriclube } from './pages/Refriclube';
import { Conta } from './pages/Conta';
import { Balcao } from './pages/Balcao';
import { Entrar } from './pages/auth/Entrar';
import { Cadastro } from './pages/auth/Cadastro';
import { RecuperarSenha } from './pages/auth/RecuperarSenha';
import { NovaSenha } from './pages/auth/NovaSenha';
import { AdminLayout } from './admin/AdminLayout';
import { VisaoGeral } from './admin/VisaoGeral';
import { Associados } from './admin/Associados';
import { AssociadoDetalhe } from './admin/AssociadoDetalhe';
import { OfertasAdmin } from './admin/OfertasAdmin';
import { CuponsAdmin } from './admin/CuponsAdmin';
import { EventosAdmin } from './admin/EventosAdmin';
import { ComunicadosAdmin } from './admin/ComunicadosAdmin';
import { PlanosAdmin } from './admin/PlanosAdmin';
import { EquipeAdmin } from './admin/EquipeAdmin';
import { ConfiguracoesAdmin } from './admin/ConfiguracoesAdmin';

export function App() {
  const { pathname } = useLocation();
  const { recuperandoSenha } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Link de recuperação de senha leva direto para a tela de nova senha
  if (recuperandoSenha && pathname !== '/nova-senha') return <Navigate to="/nova-senha" replace />;

  return (
    <Routes>
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/recuperar-senha" element={<RecuperarSenha />} />
      <Route path="/nova-senha" element={<NovaSenha />} />

      <Route path="/admin" element={<Protegido papeis={['admin']} semMoldura><AdminLayout /></Protegido>}>
        <Route index element={<VisaoGeral />} />
        <Route path="associados" element={<Associados />} />
        <Route path="associados/:id" element={<AssociadoDetalhe />} />
        <Route path="ofertas" element={<OfertasAdmin />} />
        <Route path="cupons" element={<CuponsAdmin />} />
        <Route path="eventos" element={<EventosAdmin />} />
        <Route path="comunicados" element={<ComunicadosAdmin />} />
        <Route path="planos" element={<PlanosAdmin />} />
        <Route path="equipe" element={<EquipeAdmin />} />
        <Route path="configuracoes" element={<ConfiguracoesAdmin />} />
      </Route>

      <Route path="/balcao" element={<Protegido papeis={['vendedor', 'admin']} escuro><Balcao /></Protegido>} />

      <Route path="/" element={<Protegido comMenu><Inicio /></Protegido>} />
      <Route path="/carteirinha" element={<Protegido comMenu><Carteirinha /></Protegido>} />
      <Route path="/ofertas" element={<Protegido comMenu><Ofertas /></Protegido>} />
      <Route path="/refriclube" element={<Protegido comMenu><Refriclube /></Protegido>} />
      <Route path="/conta" element={<Protegido comMenu><Conta /></Protegido>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Protegido({
  children,
  comMenu,
  escuro,
  papeis,
  semMoldura,
}: {
  children: ReactNode;
  comMenu?: boolean;
  escuro?: boolean;
  semMoldura?: boolean;
  papeis?: ('associado' | 'vendedor' | 'admin')[];
}) {
  const { carregando, sessao, perfil } = useAuth();
  const local = useLocation();

  if (carregando) {
    return (
      <div className="shell">
        <Carregando />
      </div>
    );
  }
  if (!sessao) return <Navigate to="/entrar" replace state={{ de: local.pathname }} />;
  if (!perfil) {
    return (
      <div className="shell">
        <Carregando texto="Carregando seu cadastro…" />
      </div>
    );
  }
  if (papeis && !papeis.includes(perfil.papel)) return <Navigate to="/" replace />;
  if (semMoldura) return <>{children}</>;

  return (
    <div className={escuro ? 'shell dark-shell' : 'shell'}>
      <div className="screen">{children}</div>
      {comMenu && <TabBar />}
    </div>
  );
}
