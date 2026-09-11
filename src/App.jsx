import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, MessageSquare, Menu, X } from 'lucide-react';
import DashboardGeral from './pages/DashboardGeral';
import MapaObras from './pages/MapaObras';
import DashboardRespostas from './pages/DashboardRespostas';
import { supabase } from './utils/supabase';
import './index.css';

const HeaderNavegacao = () => {
  const location = useLocation();
  
  return (
    <header className="desktop-header" style={{ 
      display: 'flex', justifyContent: 'center', padding: '20px 0', 
      backgroundColor: '#f8f9fa', borderBottom: '1px solid #eaeaea'
    }}>
      <nav style={{ 
        display: 'flex', gap: '10px', background: '#fff', 
        padding: '6px', borderRadius: '50px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' 
      }}>
        <Link to="/" style={getLinkStyle(location.pathname === '/')}>
          <LayoutDashboard size={18} /> VISÃO GERAL
        </Link>
        <Link to="/mapa" style={getLinkStyle(location.pathname === '/mapa')}>
          <Map size={18} /> MAPA DE OBRAS
        </Link>
        <Link to="/respostas" style={getLinkStyle(location.pathname === '/respostas')}>
          <MessageSquare size={18} /> RESPOSTAS
        </Link>
      </nav>
    </header>
  );
};

const getLinkStyle = (isActive) => ({
  display: 'flex', alignItems: 'center', gap: '8px',
  padding: '10px 24px', borderRadius: '40px', textDecoration: 'none',
  fontWeight: '600', fontSize: '14px', transition: 'all 0.3s',
  ...(isActive 
    ? { backgroundColor: '#FFF3E0', color: '#E67E22' } 
    : { backgroundColor: 'transparent', color: '#666' })
});

const MobileHeader = ({ onOpenMenu }) => (
  <div className="mobile-header-bar">
    <button onClick={onOpenMenu} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
      <Menu size={24} color="#fff" />
    </button>
    <span className="mobile-header-title">SISMOB</span>
    <div style={{ width: 24 }}></div>
  </div>
);

const MobileMenuDrawer = ({ isOpen, onClose }) => {
  const location = useLocation();

  useEffect(() => {
    onClose();
  }, [location.pathname]);

  if (!isOpen) return null;

  return (
    <div className="mobile-drawer-overlay" onClick={onClose}>
      <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-drawer-header">
          <span style={{ fontWeight: '700', fontSize: '16px', color: '#004b87' }}>Navegação SISMOB</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} color="#333" />
          </button>
        </div>

        <div className="mobile-drawer-links">
          <Link to="/" className={`mobile-drawer-link ${location.pathname === '/' ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Visão Geral
          </Link>
          <Link to="/mapa" className={`mobile-drawer-link ${location.pathname === '/mapa' ? 'active' : ''}`}>
            <Map size={20} /> Mapa de Obras
          </Link>
          <Link to="/respostas" className={`mobile-drawer-link ${location.pathname === '/respostas' ? 'active' : ''}`}>
            <MessageSquare size={20} /> Respostas (Campo)
          </Link>
        </div>
      </div>
    </div>
  );
};

const MobileBottomNav = () => {
  const location = useLocation();
  return (
    <nav className="mobile-bottom-nav">
      <Link to="/" className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <LayoutDashboard size={20} />
        <span>Geral</span>
      </Link>
      <Link to="/mapa" className={`mobile-nav-item ${location.pathname === '/mapa' ? 'active' : ''}`}>
        <Map size={20} />
        <span>Mapa</span>
      </Link>
      <Link to="/respostas" className={`mobile-nav-item ${location.pathname === '/respostas' ? 'active' : ''}`}>
        <MessageSquare size={20} />
        <span>Respostas</span>
      </Link>
    </nav>
  );
};

function App() {
  const [dadosPlanilha, setDadosPlanilha] = useState([]);
  const [dadosRespostas, setDadosRespostas] = useState([]);
  const [dataAtualizacao, setDataAtualizacao] = useState(null); 
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  const [options, setOptions] = useState({
    municipios: [],
    prioridades: ['Alta', 'Média', 'Baixa'],
    situacoes: [],
    componentes: [],
    portes: []
  });

  useEffect(() => {
    const buscarDadosNuvem = async () => {
      const { data, error } = await supabase
        .from('sismob_nuvem')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar dados:", error);
        return;
      }

      if (data) {
        if (data.dados_geral) setDadosPlanilha(data.dados_geral);
        if (data.dados_respostas) setDadosRespostas(data.dados_respostas);
        if (data.data_atualizacao) setDataAtualizacao(data.data_atualizacao);
      }
    };

    buscarDadosNuvem();

    const inscricaoRealtime = supabase
      .channel('mudancas-sismob')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', 
          schema: 'public',
          table: 'sismob_nuvem',
          filter: 'id=eq.1' 
        },
        (payload) => {
          console.log("Planilha atualizada na nuvem! Recarregando gráficos...");
          const novosDados = payload.new;
          
          if (novosDados.dados_geral) setDadosPlanilha(novosDados.dados_geral);
          if (novosDados.dados_respostas) setDadosRespostas(novosDados.dados_respostas);
          if (novosDados.data_atualizacao) setDataAtualizacao(novosDados.data_atualizacao);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inscricaoRealtime);
    };
  }, []);

  const salvarPlanilhaGeralNuvem = async (jsonDados) => {
    setDadosPlanilha(jsonDados); 
    
    const agora = new Date();
    const dataFormatada = `${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    setDataAtualizacao(dataFormatada);

    const { error } = await supabase
      .from('sismob_nuvem')
      .update({ 
        dados_geral: jsonDados,
        data_atualizacao: dataFormatada 
      })
      .eq('id', 1);

    if (error) console.error("Erro ao salvar planilha geral no Supabase:", error);
  };

  const salvarPlanilhaRespostasNuvem = async (jsonDados) => {
    setDadosRespostas(jsonDados); 

    const { error } = await supabase
      .from('sismob_nuvem')
      .update({ 
        dados_respostas: jsonDados 
      })
      .eq('id', 1);

    if (error) console.error("Erro ao salvar respostas no Supabase:", error);
  };

  return (
    <BrowserRouter>
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8f9fa' }}>
        
        <MobileHeader onOpenMenu={() => setMenuMobileAberto(true)} />
        <MobileMenuDrawer isOpen={menuMobileAberto} onClose={() => setMenuMobileAberto(false)} />

        <HeaderNavegacao />

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '70px' }}>
          <Routes>
            <Route 
              path="/" 
              element={
                <DashboardGeral 
                  dadosPlanilha={dadosPlanilha} 
                  setDadosPlanilha={salvarPlanilhaGeralNuvem} 
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
                <DashboardRespostas 
                  dados={dadosRespostas} 
                  setDados={salvarPlanilhaRespostasNuvem} 
                />
              } 
            />
          </Routes>
        </div>

        <MobileBottomNav />

      </div>
    </BrowserRouter>
  );
}

export default App;