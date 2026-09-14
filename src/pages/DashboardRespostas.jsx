import React, { useState, useMemo } from 'react';
import { MessageSquare, Search, UploadCloud, Calendar, User, FileText } from 'lucide-react';

export default function DashboardRespostas({ dados = [], setDados }) {
  const [busca, setBusca] = useState('');

  const formatarDataBR = (valorData) => {
    if (!valorData) return "Data não informada";
    
    if (typeof valorData === 'number') {
      const dataBase = new Date(1899, 11, 30);
      dataBase.setDate(dataBase.getDate() + valorData);
      return dataBase.toLocaleDateString('pt-BR');
    }

    const dataObj = new Date(valorData);
    if (!isNaN(dataObj.getTime())) {
      return dataObj.toLocaleDateString('pt-BR');
    }

    return String(valorData);
  };

  const dadosFormatados = useMemo(() => {
    if (!dados || !dados.length) return [];

    return dados.map((item) => {
      const execBruta = item['Execução informada pelo ente (%)'];
      let execucaoPercentual = "0%";
      let valorNumericoExec = 0;

      if (execBruta !== undefined && execBruta !== null && execBruta !== "") {
        const num = Number(execBruta);
        if (!isNaN(num)) {
          valorNumericoExec = num <= 1 ? num * 100 : num;
          execucaoPercentual = `${Math.round(valorNumericoExec)}%`;
        }
      }

      const porteOriginal = item['Porte'] || item['porte'];
      const porteTexto = porteOriginal && String(porteOriginal).trim() !== "" 
        ? `Porte: ${porteOriginal}` 
        : "Porte não informado";

      return {
        ...item,
        proposta: item['Proposta'] || item['proposta'] || 'N/A',
        municipio: item['Município'] || item['município'] || 'Não informado',
        componente: item['Componente'] || item['componente'] || 'Componente não informado',
        porteTexto: porteTexto,
        quemContato: item['Quem fez o contato?'] || item['quemContato'] || 'Não informado',

        dataContatoFormatada: formatarDataBR(item['Data do contato']),
        execucaoFormatada: execucaoPercentual,
        valorExecucaoNum: valorNumericoExec,

        conclusaoFormatada: formatarDataBR(item['Data/Previsão de conclusão informada pelo ente']),
        inauguracaoFormatada: formatarDataBR(item['Data/Previsão de inauguração informada pelo ente']),
        observacoes: item['Observações e problemas'] || item['observacoes'] || 'Sem observações'
      };
    });
  }, [dados]);

  const dadosFiltrados = useMemo(() => {
    if (!busca.trim()) return dadosFormatados;
    const termo = busca.toLowerCase();
    return dadosFormatados.filter(item => 
      String(item.municipio).toLowerCase().includes(termo) ||
      String(item.proposta).toLowerCase().includes(termo)
    );
  }, [dadosFormatados, busca]);

  const mediaExecucaoLocal = useMemo(() => {
    if (!dadosFormatados.length) return "0%";
    const validas = dadosFormatados.filter(i => i.valorExecucaoNum > 0);
    if (!validas.length) return "0%";
    
    const soma = validas.reduce((acc, curr) => acc + curr.valorExecucaoNum, 0);
    return `${Math.round(soma / validas.length)}%`;
  }, [dadosFormatados]);

  const totalMunicipiosAtendidos = useMemo(() => {
    const municipios = new Set(dadosFormatados.map(i => i.municipio));
    return municipios.size;
  }, [dadosFormatados]);

  return (
    <div style={{ padding: '30px', backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: '#002B5E', fontSize: '22px', fontWeight: '700', margin: '0 0 6px 0' }}>
          Feedback e Acompanhamento Local
        </h2>
        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
          Dados informados diretamente pelas entidades conveniadas através de formulário.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <span style={{ color: '#666', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Formulários Respondidos</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MessageSquare size={26} color="#E67E22" />
            <strong style={{ fontSize: '26px', color: '#333' }}>{dadosFormatados.length}</strong>
          </div>
          <span style={{ fontSize: '11px', color: '#999', marginTop: '6px', display: 'block' }}>Total de respostas válidas</span>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <span style={{ color: '#666', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Municípios Atendidos</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MapPin size={26} color="#002B5E" />
            <strong style={{ fontSize: '26px', color: '#333' }}>{totalMunicipiosAtendidos}</strong>
          </div>
          <span style={{ fontSize: '11px', color: '#999', marginTop: '6px', display: 'block' }}>Prefeituras envolvidas</span>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: '4px solid #E67E22' }}>
          <span style={{ color: '#666', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Média de Execução (Local)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '26px', fontWeight: 'bold', color: '#E67E22' }}>{mediaExecucaoLocal}</span>
          </div>
          <span style={{ fontSize: '11px', color: '#999', marginTop: '6px', display: 'block' }}>Execução física informada</span>
        </div>

      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '25px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} color="#888" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Pesquisar por município ou proposta..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 42px', borderRadius: '8px',
              border: '1px solid #ccc', outline: 'none', fontSize: '14px', background: '#fff'
            }}
          />
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f1f3f5', color: '#495057', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '14px 16px' }}>PROPOSTA / MUNICÍPIO</th>
                <th style={{ padding: '14px 16px' }}>COMPONENTE / PORTE</th>
                <th style={{ padding: '14px 16px' }}>CONTATO (QUEM / DATA)</th>
                <th style={{ padding: '14px 16px' }}>EXECUÇÃO OBRAS</th>
                <th style={{ padding: '14px 16px' }}>PREVISÕES (ENTE)</th>
                <th style={{ padding: '14px 16px' }}>OBSERVAÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {dadosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                dadosFiltrados.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    
                    <td style={{ padding: '14px 16px' }}>
                      <strong style={{ color: '#002B5E', display: 'block', fontSize: '13px' }}>{item.proposta}</strong>
                      <span style={{ color: '#666', fontSize: '12px' }}>{item.municipio}</span>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'block', color: '#333', fontWeight: '500' }}>{item.componente}</span>
                      <span style={{ color: '#888', fontSize: '11px', fontStyle: 'italic' }}>{item.porteTexto}</span>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#333', marginBottom: '2px' }}>
                        <User size={14} color="#666" />
                        <span>{item.quemContato}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', fontSize: '12px' }}>
                        <Calendar size={14} color="#666" />
                        <span>{item.dataContatoFormatada}</span>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'inline-block', background: '#FFF3E0', color: '#E67E22', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', border: '1px solid #ffe0b2' }}>
                        ENTE: {item.execucaoFormatada}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', fontSize: '12px', color: '#444', lineHeight: '1.4' }}>
                      <div><strong>Conclusão:</strong> {item.conclusaoFormatada}</div>
                      <div><strong>Inauguração:</strong> {item.inauguracaoFormatada}</div>
                    </td>

                    <td style={{ padding: '14px 16px', color: '#666', fontSize: '12px' }}>
                      {item.observacoes}
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