import React, { useState, useMemo } from 'react';
import { Search, CalendarCheck, MessageSquare, MapPin, TrendingUp } from 'lucide-react';
import SpreadsheetUploader from '../components/SpreadsheetUploader';

export default function DashboardRespostas({ dados, setDados }) {
  const [busca, setBusca] = useState('');

  const formatarDataBR = (valorData) => {
    if (!valorData) return "Não informada";
    
    if (typeof valorData === 'number') {
      const dataBase = new Date(1899, 11, 30);
      dataBase.setDate(dataBase.getDate() + valorData);
      return dataBase.toLocaleDateString('pt-BR');
    }

    if (valorData instanceof Date) {
      return valorData.toLocaleDateString('pt-BR');
    }

    const stringData = String(valorData).trim();
    if (!stringData || stringData === 'NaT' || stringData === 'NaN') return "Não informada";

    const dataObj = new Date(stringData);
    if (!isNaN(dataObj.getTime())) {
      return dataObj.toLocaleDateString('pt-BR');
    }

    return stringData;
  };

  const dadosFiltrados = useMemo(() => {
    if (!dados || dados.length === 0) return [];

    return dados.filter(row => {
      const temContato = row.quemFezContato && row.quemFezContato !== 'Não informado' && row.quemFezContato !== 'ND';
      
      const termo = busca.toLowerCase();
      const matchBusca = String(row['Município Convenente'] || row.municipio || '').toLowerCase().includes(termo) || 
                         String(row.proposta || '').toLowerCase().includes(termo);
      
      return temContato && matchBusca;
    }).map(row => {
      const execBruta = row.execucaoEnte !== undefined ? row.execucaoEnte : row['Execução informada pelo ente (%)'];
      let execucaoPercentual = "0";
      let valorNumericoExec = 0;

      if (execBruta !== undefined && execBruta !== null && execBruta !== 'ND' && execBruta !== "") {
        const num = Number(execBruta);
        if (!isNaN(num)) {
          valorNumericoExec = num <= 1 ? num * 100 : num;
          execucaoPercentual = Math.round(valorNumericoExec).toString();
        }
      }

      const porteOriginal = row.porte || row['Porte'];
      const porteTexto = porteOriginal && String(porteOriginal).trim() !== "" && String(porteOriginal) !== "nan"
        ? String(porteOriginal).trim()
        : "";

      return {
        ...row,
        dataContatoFormatada: formatarDataBR(row.dataContato || row['Data do contato']),
        conclusaoFormatada: formatarDataBR(row.conclusaoEnte || row['Data/Previsão de conclusão informada pelo ente']),
        inauguracaoFormatada: formatarDataBR(row.inauguracaoEnte || row['Data/Previsão de inauguração informada pelo ente']),
        execucaoEnteAjustada: execucaoPercentual,
        valorExecucaoNum: valorNumericoExec,
        porteTexto: porteTexto
      };
    });
  }, [dados, busca]);

  const kpis = useMemo(() => {
    let totalMunicipios = new Set();
    let somaExecucaoEnte = 0;
    let qtdExecucaoValida = 0;

    dadosFiltrados.forEach(d => {
      const mun = d['Município Convenente'] || d.municipio;
      if (mun) totalMunicipios.add(mun);

      if (d.valorExecucaoNum > 0) {
        somaExecucaoEnte += d.valorExecucaoNum;
        qtdExecucaoValida++;
      }
    });

    const mediaExecucao = qtdExecucaoValida > 0 ? (somaExecucaoEnte / qtdExecucaoValida).toFixed(1) : "0,0";

    return {
      totalRespostas: dadosFiltrados.length,
      municipiosAtendidos: totalMunicipios.size,
      mediaExecucao: String(mediaExecucao).replace('.', ',')
    };
  }, [dadosFiltrados]);

  return (
    <div className="sismob-page-container">
      
      <div className="sismob-header">
        <div className="sismob-title-group">
          <h2>Feedback e Acompanhamento Local</h2>
          <p>Dados informados diretamente pelas entidades convenentes através de formulário.</p>
        </div>
        
        <div className="sismob-actions-group">
          <div className="sismob-search-bar">
            <Search size={18} color="#999" />
            <input 
              type="text" 
              placeholder="Pesquisar por município..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          
          <div className="sismob-upload-wrapper">
            <SpreadsheetUploader onDataLoaded={setDados} />
          </div>
        </div>
      </div>

      <div className="sismob-kpi-grid">
        <div className="sismob-kpi-card">
          <div className="sismob-kpi-title">Formulários Respondidos</div>
          <div className="sismob-kpi-body">
            <div className="sismob-kpi-icon" style={{ color: '#F7941D' }}><MessageSquare size={28} /></div>
            <div className="sismob-kpi-value">{kpis.totalRespostas}</div>
          </div>
          <div className="sismob-kpi-footer">Total de respostas válidas</div>
        </div>

        <div className="sismob-kpi-card">
          <div className="sismob-kpi-title">Municípios Atendidos</div>
          <div className="sismob-kpi-body">
            <div className="sismob-kpi-icon" style={{ color: '#F7941D' }}><MapPin size={28} /></div>
            <div className="sismob-kpi-value">{kpis.municipiosAtendidos}</div>
          </div>
          <div className="sismob-kpi-footer">Prefeituras envolvidas</div>
        </div>

        <div className="sismob-kpi-card">
          <div className="sismob-kpi-title">Média de Execução (Local)</div>
          <div className="sismob-kpi-body">
            <div className="sismob-kpi-icon" style={{ color: '#F7941D' }}><TrendingUp size={28} /></div>
            <div className="sismob-kpi-value">{kpis.mediaExecucao}%</div>
          </div>
          <div className="sismob-kpi-footer">Execução física informada</div>
        </div>
      </div>

      <div className="sismob-table-container">
        <div className="sismob-table-wrapper">
          <table className="sismob-table">
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
                  <td colSpan="6" className="sismob-table-empty">
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
                        {item.porteTexto && <span>{item.porteTexto}</span>}
                      </div>
                    </td>
                    <td>
                      <div className="stack-text">
                        <strong>{item.quemFezContato}</strong>
                        <span className="flex-icon-text">
                          <CalendarCheck size={12} color="#F7941D" /> {item.dataContatoFormatada}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="stack-text">
                        <div className="exec-badge-modern orange">
                          <span className="label">ENTE</span>
                          <span className="value">{item.execucaoEnteAjustada !== '0' ? `${item.execucaoEnteAjustada}%` : 'ND'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="stack-text">
                        <span><strong>Conclusão:</strong> {item.conclusaoFormatada}</span>
                        <span><strong>Inauguração:</strong> {item.inauguracaoFormatada}</span>
                      </div>
                    </td>
                    <td>
                      <div className="obs-text">
                        {item.observacoes || <span className="empty-obs">Sem observações</span>}
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