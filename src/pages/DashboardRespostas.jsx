import React, { useState, useMemo } from 'react';
import { Search, CalendarCheck, MessageSquare, MapPin, TrendingUp, AlertCircle } from 'lucide-react';
import SpreadsheetUploader from '../components/SpreadsheetUploader';
import DonutCard from '../components/DonutCard'; 

export default function DashboardRespostas({ dados, setDados }) {
  const [busca, setBusca] = useState('');

  const formatarDataBR = (valorData) => {
    if (!valorData || valorData === 'ND') return "Não informada";
    
    try {
      if (typeof valorData === 'number') {
        const dataBase = new Date(1899, 11, 30);
        dataBase.setDate(dataBase.getDate() + Math.floor(valorData));
        if (!isNaN(dataBase.getTime())) {
          return dataBase.toLocaleDateString('pt-BR');
        }
      }

      if (valorData instanceof Date) {
        return valorData.toLocaleDateString('pt-BR');
      }

      const stringData = String(valorData).trim();
      if (!stringData || stringData === 'NaT' || stringData === 'NaN') return "Não informada";

      if (stringData.includes('/') || stringData.includes('-')) {
        const partes = stringData.split(/[/,-]/);
        if (partes.length === 3) {
          let p1 = parseInt(partes[0], 10);
          let p2 = parseInt(partes[1], 10);
          let p3 = parseInt(partes[2], 10);

          if (p3 > 1000) {
            const dia = String(p2).padStart(2, '0');
            const mes = String(p1).padStart(2, '0');
            const ano = p3;
            return `${dia}/${mes}/${ano}`;
          }
          if (p1 > 1000) {
            const ano = p1;
            const mes = String(p2).padStart(2, '0');
            const dia = String(p3).padStart(2, '0');
            return `${dia}/${mes}/${ano}`;
          }
        }
      }

      const dataObj = new Date(stringData);
      if (!isNaN(dataObj.getTime())) {
        return dataObj.toLocaleDateString('pt-BR');
      }

      return stringData;
    } catch (e) {
      return "Não informada";
    }
  };

  const { dadosFiltrados, dadosPendentes } = useMemo(() => {
    if (!dados || dados.length === 0) return { dadosFiltrados: [], dadosPendentes: [] };

    const respondidos = [];
    const pendentes = [];
    const termo = busca.toLowerCase();

    dados.forEach(row => {
      const mun = String(row.municipio || row['Município'] || '').toLowerCase();
      const prop = String(row.proposta || row['Proposta'] || '').toLowerCase();
      
      if (termo && !mun.includes(termo) && !prop.includes(termo)) return;

      const quem = row.quemFezContato || row['Quem fez o contato?'];
      const temContato = quem && quem !== 'Não informado' && quem !== 'ND' && String(quem).toLowerCase() !== 'nan';

      const baseInfo = {
        ...row,
        propostaInfo: row.proposta || row['Proposta'] || 'N/A',
        municipioInfo: row.municipio || row['Município'] || 'ND',
        componenteInfo: row.componente || row['Componente'] || 'ND',
        situacaoInfo: row.situacao || row['Situação no SISMOB'] || 'ND',
        prioridadeInfo: row.prioridade || row['Prioridade de contato'] || 'Média',
        anoRepasseInfo: row.anoRepasse || row['Ano de Repasse'] || 'ND'
      };

      if (temContato) {
        const execBruta = row.execucaoEnte !== undefined ? row.execucaoEnte : row['Execução informada pelo ente (%)'];
        let execucaoPercentual = "0";
        let valorNumericoExec = 0;

        if (execBruta !== undefined && execBruta !== null && execBruta !== 'ND' && execBruta !== "") {
          const num = Number(execBruta);
          if (!isNaN(num)) {
            valorNumericoExec = num <= 1 && num > 0 ? num * 100 : num;
            execucaoPercentual = Math.round(valorNumericoExec).toString();
          }
        }

        const porteOriginal = row.porte || row['Porte'];
        const porteTexto = porteOriginal && String(porteOriginal).trim() !== "" && String(porteOriginal) !== "nan"
          ? `Porte: ${String(porteOriginal).trim()}` : "";

        respondidos.push({
          ...baseInfo,
          dataContatoFormatada: formatarDataBR(row.dataContato || row['Data do contato']),
          conclusaoFormatada: formatarDataBR(row.conclusaoEnte || row['Data/Previsão de conclusão informada pelo ente']),
          inauguracaoFormatada: formatarDataBR(row.inauguracaoEnte || row['Data/Previsão de inauguração informada pelo ente']),
          execucaoEnteAjustada: execucaoPercentual,
          valorExecucaoNum: valorNumericoExec,
          porteTexto: porteTexto,
          observacoesFormatada: row['Observações e problemas'] || row.observacoes || "Sem observações"
        });
      } else {
        pendentes.push(baseInfo);
      }
    });

    return { dadosFiltrados: respondidos, dadosPendentes: pendentes };
  }, [dados, busca]);

  const kpis = useMemo(() => {
    let totalMunicipios = new Set();
    let somaExecucaoEnte = 0;
    let qtdExecucaoValida = 0;

    dadosFiltrados.forEach(d => {
      const mun = d.municipioInfo;
      if (mun && mun !== 'ND') totalMunicipios.add(mun);

      if (d.valorExecucaoNum > 0) {
        somaExecucaoEnte += d.valorExecucaoNum;
        qtdExecucaoValida++;
      }
    });

    const mediaExecucao = qtdExecucaoValida > 0 ? (somaExecucaoEnte / qtdExecucaoValida).toFixed(1) : "0.0";

    return {
      totalRespostas: dadosFiltrados.length,
      municipiosAtendidos: totalMunicipios.size,
      mediaExecucao: String(mediaExecucao).replace('.', ','),
      totalPendentes: dadosPendentes.length
    };
  }, [dadosFiltrados, dadosPendentes]);

  const chartDataPendentes = useMemo(() => {
    const contagem = { Alta: 0, Média: 0, Baixa: 0 };
    dadosPendentes.forEach(d => {
      const p = d.prioridadeInfo || "Média";
      if (contagem[p] !== undefined) contagem[p]++;
      else contagem["Média"]++; 
    });

    return [
      { name: "Alta", value: contagem.Alta },
      { name: "Média", value: contagem.Média },
      { name: "Baixa", value: contagem.Baixa }
    ].filter(item => item.value > 0);
  }, [dadosPendentes]);

  const PRIORIDADE_COLORS = {
    Alta: "#d9534f", 
    Média: "#f0ad4e", 
    Baixa: "#5cb85c"  
  };

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
              placeholder="Pesquisar por município ou proposta..." 
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
          <div className="sismob-kpi-title">Aguardando Resposta</div>
          <div className="sismob-kpi-body">
            <div className="sismob-kpi-icon" style={{ color: '#d9534f' }}><AlertCircle size={28} /></div>
            <div className="sismob-kpi-value" style={{ color: '#d9534f' }}>{kpis.totalPendentes}</div>
          </div>
          <div className="sismob-kpi-footer">Formulários pendentes</div>
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

      <div className="sismob-table-container" style={{ marginBottom: '40px' }}>
        <h3 style={{ padding: '0 20px', color: '#333', marginTop: '20px' }}>✅ Propostas com Formulário Respondido</h3>
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
                    Nenhuma resposta encontrada para os filtros atuais.
                  </td>
                </tr>
              ) : (
                dadosFiltrados.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <div className="stack-text">
                        <strong>{item.propostaInfo}</strong>
                        <span>{item.municipioInfo}</span>
                      </div>
                    </td>
                    <td>
                      <div className="stack-text">
                        <strong>{item.componenteInfo}</strong>
                        {item.porteTexto && <span style={{ color: '#888', fontSize: '11px' }}>{item.porteTexto}</span>}
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
                        {item.observacoesFormatada}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        <div style={{ flex: '1', minWidth: '300px' }}>
          <DonutCard 
            title="Pendências por Prioridade" 
            data={chartDataPendentes} 
            colors={PRIORIDADE_COLORS} 
            centerLabel="Aguardando" 
            size={220} 
          />
        </div>

        <div className="sismob-table-container" style={{ flex: '3', minWidth: '600px' }}>
          <div className="sismob-header" style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
            <div className="sismob-title-group">
              <h3 style={{ color: '#d9534f', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <AlertCircle size={20} /> Formulários Pendentes ({kpis.totalPendentes})
              </h3>
              <p style={{ margin: 0, marginTop: '5px', fontSize: '13px', color: '#666' }}>
                Relação de propostas que ainda não preencheram o formulário de acompanhamento.
              </p>
            </div>
          </div>

          <div className="sismob-table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="sismob-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th>Proposta / Município</th>
                  <th>Componente</th>
                  <th>Ano Repasse</th>
                  <th>Situação no SISMOB</th>
                  <th>Prioridade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dadosPendentes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="sismob-table-empty" style={{ color: '#5cb85c', padding: '40px' }}>
                      Parabéns! Todos os formulários foram respondidos ou não há pendências para o filtro atual.
                    </td>
                  </tr>
                ) : (
                  dadosPendentes.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="stack-text">
                          <strong>{item.propostaInfo}</strong>
                          <span>{item.municipioInfo}</span>
                        </div>
                      </td>
                      <td>{item.componenteInfo}</td>
                      <td>{item.anoRepasseInfo}</td>
                      <td>
                        <span style={{ fontSize: '12px', background: '#f5f5f5', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                          {item.situacaoInfo}
                        </span>
                      </td>
                      <td>
                        <span className={
                          item.prioridadeInfo === 'Alta' ? 'badge badge-alta' :
                          item.prioridadeInfo === 'Média' ? 'badge badge-media' : 'badge badge-baixa'
                        }>
                          {item.prioridadeInfo}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#d9534f', fontWeight: 'bold', fontSize: '11px', background: '#fdf2f2', padding: '4px 8px', borderRadius: '4px', border: '1px solid #f5c6c6' }}>
                          Pendente
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}