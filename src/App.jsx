import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map } from 'lucide-react';
import Papa from 'papaparse'; 
import DashboardGeral from './pages/DashboardGeral';
import MapaObras from './pages/MapaObras';
import './index.css';

const HeaderNavegacao = () => {
  const location = useLocation();
  
  return (
    <header style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      padding: '20px 0', 
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #eaeaea'
    }}>
      <nav style={{ 
        display: 'flex', 
        gap: '10px', 
        background: '#fff', 
        padding: '6px', 
        borderRadius: '50px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)' 
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

  useEffect(() => {
    const carregarDadosPadrao = async () => {
      try {
        const response = await fetch('/PE(PAC).csv');
        
        if (!response.ok) {
            console.warn("Planilha padrão não encontrada na pasta public. Aguardando upload manual.");
            return;
        }

        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const dadosFormatados = results.data.map(row => ({
              proposta: row['Proposta'],
              anoRepasse: row['Ano da proposta'],
              municipio: row['Município'],
              nomeUnidade: row['Nome da unidade'],
              componente: row['Componente'],
              porte: row['Porte'],
              situacao: row['Situação no SISMOB'],
              execucaoFisica: row['Execução física (%) SISMOB'],
              diasSemMonitoramento: row['Dias sem monitoramento SISMOB'],
              prioridade: row['Prioridade de contato'],
              
              quemFezContato: row['Quem fez o contato?'],
              dataContato: row['Data do contato'],
              execucaoEnte: row['Execução informada pelo ente (%)'],
              conclusaoEnte: row['Data/Previsão de conclusão informada pelo ente'],
              inauguracaoEnte: row['Data/Previsão de inauguração informada pelo ente']
            }));
            
            setDadosPlanilha(dadosFormatados);
          }
        });
      } catch (error) {
        console.error("Erro ao carregar planilha padrão:", error);
      }
    };
    
    carregarDadosPadrao();
  }, []);

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
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;