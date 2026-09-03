import React, { useState, useMemo } from 'react';
import { Search, MessageSquare, Building2, TrendingUp, CalendarCheck } from 'lucide-react';

export default function DashboardRespostas({ dados }) {
  const [busca, setBusca] = useState('');

  const dadosFiltrados = useMemo(() => {
    return dados.filter(row => {
      const temContato = row.quemFezContato !== 'Não informado' && row.quemFezContato !== 'ND';
      
      const termo = busca.toLowerCase();
      const matchBusca = (row['Município Convenente'] || row.municipio || '').toLowerCase().includes(termo) || 
                         (row.proposta || '').toLowerCase().includes(termo);
      
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

    const mediaExecucao = qtdExecucaoValida > 0 ? (somaExecucaoEnte / qtdExecucaoValida).toFixed(1) : 0;

    return {
      totalRespostas: dadosFiltrados.length,
      municipiosAtendidos: totalMunicipios.size,
      mediaExecucao
    };
  }, [dadosFiltrados]);

  return (
    <div className="respostas-container">
      
      <div className="respostas-header">
        <div>
          <h2>Feedback e Acompanhamento Local</h2>
          <p>Dados informados diretamente pelas entidades convenentes através de formulário.</p>
        </div>
        <div className="search-bar">
          <Search size={18} color="#999" />
          <input 
            type="text" 
            placeholder="Pesquisar por município ou proposta..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      <div className="prazos-kpis">
        <div className="prazos-kpi-card" style={{ borderLeftColor: '#0078D4' }}>
          <div className="prazos-kpi-icon" style={{ background: '#e3f2fd', color: '#0078D4' }}>
            <MessageSquare size={24} />
          </div>
          <div className="prazos-kpi-content">
            <h4>Formulários</h4>
            <p>Total de respostas registradas</p>
            <strong>{kpis.totalRespostas} <span>propostas</span></strong>
          </div>
        </div>
        
        <div className="prazos-kpi-card" style={{ borderLeftColor: '#2CA02C' }}>
          <div className="prazos-kpi-icon" style={{ background: '#e8f5e9', color: '#2CA02C' }}>
            <Building2 size={24} />
          </div>
          <div className="prazos-kpi-content">
            <h4>Municípios</h4>
            <p>Prefeituras/Entidades envolvidas</p>
            <strong>{kpis.municipiosAtendidos} <span>municípios</span></strong>
          </div>
        </div>

        <div className="prazos-kpi-card" style={{ borderLeftColor: '#F7941D' }}>
          <div className="prazos-kpi-icon" style={{ background: '#fff3e0', color: '#F7941D' }}>
            <TrendingUp size={24} />
          </div>
          <div className="prazos-kpi-content">
            <h4>Média de Execução</h4>
            <p>Execução média informada (Local)</p>
            <strong>{kpis.mediaExecucao}%</strong>
          </div>
        </div>
      </div>

      <div className="table-card">
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
                <td colSpan="6" style={{textAlign: 'center', padding: '30px', color: '#999'}}>
                  Nenhuma resposta encontrada. Verifique se a planilha possui os dados de contato preenchidos.
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
  );
}