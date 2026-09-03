import React, { useState, useMemo } from 'react';
import { Search, CalendarCheck } from 'lucide-react';
import SpreadsheetUploader from '../components/SpreadsheetUploader';

export default function DashboardRespostas({ dados, setDados }) {
  const [busca, setBusca] = useState('');

  const dadosFiltrados = useMemo(() => {
    if (!dados || dados.length === 0) return [];

    return dados.filter(row => {
      const temContato = row.quemFezContato && row.quemFezContato !== 'Não informado' && row.quemFezContato !== 'ND';
      
      const termo = busca.toLowerCase();
      const matchBusca = String(row['Município Convenente'] || row.municipio || '').toLowerCase().includes(termo) || 
                         String(row.proposta || '').toLowerCase().includes(termo);
      
      return temContato && matchBusca;
    });
  }, [dados, busca]);

  const kpis = useMemo(() => {
    let totalMunicipios = new Set();
    let somaExecucaoEnte = 0;
    let qtdExecucaoValida = 0;

    dadosFiltrados.forEach(d => {
      const mun = d['Município Convenente'] || d.municipio;
      if (mun) totalMunicipios.add(mun);

      if (d.execucaoEnte !== 'ND' && !isNaN(d.execucaoEnte)) {
        somaExecucaoEnte += Number(d.execucaoEnte);
        qtdExecucaoValida++;
      }
    });

    const mediaExecucao = qtdExecucaoValida > 0 ? (somaExecucaoEnte / qtdExecucaoValida).toFixed(1) : "0.0";

    return {
      totalRespostas: dadosFiltrados.length,
      municipiosAtendidos: totalMunicipios.size,
      mediaExecucao: String(mediaExecucao).replace('.', ',')
    };
  }, [dadosFiltrados]);

  return (
    <div className="page-container">
      
      <div className="respostas-header">
        <div>
          <h2 style={{ fontSize: '20px', color: '#002B5E', marginBottom: '5px' }}>
            Feedback e Acompanhamento Local
          </h2>
          <p style={{ fontSize: '13px', color: '#666' }}>
            Dados informados diretamente pelas entidades convenentes através de formulário.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <div className="search-bar">
            <Search size={18} color="#F7941D" />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          
          <SpreadsheetUploader onDataLoaded={setDados} />
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="kpi-card">
          <div className="kpi-header">Formulários Respondidos</div>
          <div className="kpi-body">{kpis.totalRespostas}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-header">Municípios Atendidos</div>
          <div className="kpi-body">{kpis.municipiosAtendidos}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-header">Média de Execução (Local)</div>
          <div className="kpi-body">{kpis.mediaExecucao}%</div>
        </div>
      </div>

      <div className="chart-box" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="respostas-table">
            <thead>
              <tr>
                <th>Proposta / Município</th>
                <th>Componente / Porte</th>
                <th>Contato (Quem / Data)</th>
                <th>Execução Obras</th>
                <th>Previsões (Ente)</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {dadosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '40px', color: '#999'}}>
                    Nenhuma resposta encontrada. Importe a planilha de feedback e verifique os dados.
                  </td>
                </tr>
              ) : (
                dadosFiltrados.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <div className="stack-text">
                        <strong>{item.proposta}</strong>
                        <span>{item['Município Convenente'] || item.municipio}</span>
                      </div>
                    </td>
                    <td>
                      <div className="stack-text">
                        <strong>{item.componente}</strong>
                        <span>{item.porte || 'Porte não informado'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="stack-text">
                        <strong>{item.quemFezContato}</strong>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <CalendarCheck size={12} color="#666" /> {item.dataContato}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="stack-text">
                        <div><span className="exec-badge badge-sismob">SISMOB: {item.execucaoFisica}%</span></div>
                        <div>
                          <span className="exec-badge badge-ente">
                            ENTE: {item.execucaoEnte !== 'ND' ? `${item.execucaoEnte}%` : 'ND'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="stack-text">
                        <span><strong>Conclusão:</strong> {item.conclusaoEnte}</span>
                        <span><strong>Inauguração:</strong> {item.inauguracaoEnte}</span>
                      </div>
                    </td>
                    <td>
                      <div className="obs-text">
                        {item.observacoes || <span style={{color: '#ccc'}}>Sem observações</span>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}