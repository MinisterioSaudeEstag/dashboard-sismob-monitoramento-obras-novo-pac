import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, MessageSquare } from 'lucide-react';
import DashboardGeral from './pages/DashboardGeral';
import MapaObras from './pages/MapaObras';
import DashboardRespostas from './pages/DashboardRespostas';
import './index.css';

const HeaderNavegacao = () => {
  const location = useLocation();
  
  return (
    <header style={{ 
      display: 'flex', justifyContent: 'center', padding: '20px 0', 
      backgroundColor: '#f8f9fa', borderBottom: '1px solid #eaeaea'
    }}>
      <nav style={{ 
        display: 'flex', gap: '10px', background: '#fff', 
        padding: '6px', borderRadius: '50px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' 
      }}>
        <Link 
          to="/" 
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 24px', borderRadius: '40px', textDecoration: 'none',
            fontWeight: '600', fontSize: '14px', transition: 'all 0.3s',
            ...(location.pathname === '/' 
              ? { backgroundColor: '#FFF3E0', color: '#E67E22' } 
              : { backgroundColor: 'transparent', color: '#666' })
          }}
        >
          <LayoutDashboard size={18} />
          VISÃO GERAL
        </Link>
        
        <Link 
          to="/mapa" 
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 24px', borderRadius: '40px', textDecoration: 'none',
            fontWeight: '600', fontSize: '14px', transition: 'all 0.3s',
            ...(location.pathname === '/mapa' 
              ? { backgroundColor: '#FFF3E0', color: '#E67E22' } 
              : { backgroundColor: 'transparent', color: '#666' })
          }}
        >
          <Map size={18} />
          MAPA DE OBRAS
        </Link>

        {/* Link de Respostas agora padronizado com o design de pílula */}
        <Link 
          to="/respostas" 
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 24px', borderRadius: '40px', textDecoration: 'none',
            fontWeight: '600', fontSize: '14px', transition: 'all 0.3s',
            ...(location.pathname === '/respostas' 
              ? { backgroundColor: '#FFF3E0', color: '#E67E22' } 
              : { backgroundColor: 'transparent', color: '#666' })
          }}
        >
          <MessageSquare size={18} />
          RESPOSTAS
        </Link>
      </nav>
    </header>
  );
};

function App() {
  const [dadosPlanilha, setDadosPlanilha] = useState([]);
  const [options, setOptions] = useState({
    municipios: [],
    prioridades: ['Alta', 'Média', 'Baixa'],
    situacoes: [],
    componentes: [],
    portes: []
  });

  return (
    <BrowserRouter>
      <div className="app-container">
        <HeaderNavegacao />
        <Routes>
          <Route 
            path="/" 
            element={
              <DashboardGeral 
                dadosPlanilha={dadosPlanilha} 
                setDadosPlanilha={setDadosPlanilha}
                options={options}
                setOptions={setOptions}
              />
            } 
          />
          <Route 
            path="/mapa" 
            element={
              <MapaObras 
                dadosPlanilha={dadosPlanilha} 
                opcoesFiltros={options} 
              />
            } 
          />
          <Route 
            path="/respostas" 
            element={
              <DashboardRespostas dados={dadosPlanilha} />
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;