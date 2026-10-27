import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { TabBar } from './components/TabBar';
import { Inicio } from './pages/Inicio';
import { Carteirinha } from './pages/Carteirinha';
import { Ofertas } from './pages/Ofertas';
import { Refriclube } from './pages/Refriclube';
import { Conta } from './pages/Conta';
import { Balcao } from './pages/Balcao';

export function App() {
  const { pathname } = useLocation();
  const balcao = pathname.startsWith('/balcao');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className={balcao ? 'shell dark-shell' : 'shell'}>
      <div className="screen">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/carteirinha" element={<Carteirinha />} />
          <Route path="/ofertas" element={<Ofertas />} />
          <Route path="/refriclube" element={<Refriclube />} />
          <Route path="/conta" element={<Conta />} />
          <Route path="/balcao" element={<Balcao />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!balcao && <TabBar />}
    </div>
  );
}
