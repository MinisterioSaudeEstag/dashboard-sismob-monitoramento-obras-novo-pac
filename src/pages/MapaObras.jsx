import React, { useState, useMemo } from 'react';
import FiltersPanel, { DEFAULT_FILTERS } from '../components/FiltersPanel';
import SismobMap from '../components/SismobMap';
import { Building2, HardHat, PieChart, CalendarDays, MapPin } from 'lucide-react';
import { applyFilters, prepararDadosParaMapa } from '../utils/aggregate';

function pick(obj, ...keys) {
  for (const key of keys) {
    const v = obj?.[key];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

function formatarDataExibicao(valor) {
  if (valor === undefined || valor === null || valor === '') return 'Não informada';
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return 'Não informada';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(valor.getDate())}/${pad(valor.getMonth() + 1)}/${valor.getFullYear()}`;
  }
  const str = String(valor).trim();
  if (!str) return 'Não informada';
  return str.split('T')[0];
}

const SITUACAO_DOT_COLORS = {
  'Em execução e conclusão': '#1F5C8B',
  'Em início de execução': '#E14C3C',
  'Proposta em análise': '#F4C430',
  'Concluída': '#3F9E4D',
  'Em ação preparatória': '#F4C430',
  'Obra paralisada': '#E14C3C',
};

export default function MapaObras({ dadosPlanilha = [], opcoesFiltros }) {
  const [filtros, setFiltros] = useState(DEFAULT_FILTERS);
  const [municipioSelecionado, setMunicipioSelecionado] = useState(null);

  const dadosProcessados = useMemo(() => {
    if (!dadosPlanilha || !dadosPlanilha.length) return [];

    return dadosPlanilha.map((obra) => {
      const nomeUnidade = pick(obra, 'nomeObra', 'Nome da unidade') || 'Unidade sem nome';
      const situacao = pick(obra, 'situacao', 'Situação no SISMOB', 'Situação') || 'Sem situação';
      const proposta = pick(obra, 'proposta', 'Proposta') || 'N/A';

      const execucaoRaw = pick(
        obra,
        'execucaoFisica',
        'execucaoEnte',
        'Execução informada pelo ente (%)'
      );
      let execucaoNum = 0;
      let execucaoFormatada = 'ND';
      let execucaoDisponivel = false;
      if (execucaoRaw !== undefined) {
        const num = Number(execucaoRaw);
        if (!Number.isNaN(num)) {
          execucaoNum = num > 0 && num <= 1 ? num * 100 : num;
          execucaoFormatada = `${Math.round(execucaoNum)}%`;
          execucaoDisponivel = true;
        }
      }

      const quemFezContato = pick(obra, 'quemFezContato', 'Quem fez o contato?') || 'Não informado';
      const dataContatoRaw = pick(obra, 'dataContato', 'Data do contato');
      const conclusaoEnteRaw = pick(
        obra,
        'conclusaoInformadaEnte',
        'Data/Previsão de conclusão informada pelo ente'
      );
      const inauguracaoEnteRaw = pick(
        obra,
        'inauguracaoInformadaEnte',
        'Data/Previsão de inauguração informada pelo ente'
      );

      return {
        ...obra,
        nomeUnidade,
        situacao,
        proposta,
        execucaoEnte: execucaoFormatada,
        _execucaoValorNumerico: execucaoNum,
        _execucaoDisponivel: execucaoDisponivel,
        quemFezContato,
        dataContato: formatarDataExibicao(dataContatoRaw),
        conclusaoEnte: formatarDataExibicao(conclusaoEnteRaw),
        inauguracaoEnte: formatarDataExibicao(inauguracaoEnteRaw),
      };
    });
  }, [dadosPlanilha]);

  const dadosFiltrados = useMemo(() => {
    return applyFilters(dadosProcessados, filtros);
  }, [dadosProcessados, filtros]);

  const dadosObrasAgrupados = useMemo(() => {
    return prepararDadosParaMapa(dadosFiltrados);
  }, [dadosFiltrados]);

  const resumoGeral = useMemo(() => {
    const totalObras = dadosFiltrados.length;
    const totalMunicipios = dadosObrasAgrupados.length;

    const somaDias = dadosFiltrados.reduce((acc, r) => acc + (Number(r.diasSemMonitoramento) || 0), 0);
    const diasMedios = totalObras > 0 ? Math.round(somaDias / totalObras) : 0;

    const obrasComExecucao = dadosFiltrados.filter((r) => r._execucaoDisponivel);
    let conclusaoMediaGeral = 'ND';

    if (obrasComExecucao.length > 0) {
      const somaExecucao = obrasComExecucao.reduce((acc, r) => acc + r._execucaoValorNumerico, 0);
      conclusaoMediaGeral = `${Math.round(somaExecucao / obrasComExecucao.length)}%`;
    }

    return {
      totalMunicipios,
      totalObras,
      conclusaoMediaGeral,
      diasMediosSemMonitoramento: diasMedios,
    };
  }, [dadosFiltrados, dadosObrasAgrupados]);

  const municipioAtualNoMapa = useMemo(() => {
    if (!municipioSelecionado) return null;
    return dadosObrasAgrupados.find((m) => m.nome === municipioSelecionado.nome) || null;
  }, [dadosObrasAgrupados, municipioSelecionado]);

  return (
    <div className="mapa-obras-container" style={{ display: 'flex', gap: '20px', padding: '20px' }}>

      <aside className="mapa-sidebar-left" style={{ width: '300px', flexShrink: 0 }}>
        <FiltersPanel
          modo="mapa"
          filters={filtros}
          setFilters={setFiltros}
          options={opcoesFiltros}
        />
      </aside>

      <main className="mapa-main-content" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="mapa-wrapper" style={{ background: '#fff', borderRadius: '8px', padding: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', height: '100%' }}>
          <SismobMap
            dadosObrasAgrupados={dadosObrasAgrupados}
            onSelectMunicipio={(municipio) => setMunicipioSelecionado(municipio)}
          />
        </div>
      </main>

      <aside className="mapa-sidebar-right" style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div className="resumo-card" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ color: '#E67E22', fontSize: '14px', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            RESUMO DOS MUNICÍPIOS
          </h4>

          <div className="resumo-item" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <Building2 size={24} color="#E67E22" />
            <div>
              <strong style={{ fontSize: '18px', display: 'block' }}>{resumoGeral.totalMunicipios}</strong>
              <span style={{ fontSize: '12px', color: '#666' }}>Municípios com obras</span>
            </div>
          </div>

          <div className="resumo-item" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <HardHat size={24} color="#E67E22" />
            <div>
              <strong style={{ fontSize: '18px', display: 'block' }}>{resumoGeral.totalObras}</strong>
              <span style={{ fontSize: '12px', color: '#666' }}>Total de obras</span>
            </div>
          </div>

          <div className="resumo-item" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <PieChart size={24} color="#E67E22" />
            <div>
              <strong style={{ fontSize: '18px', display: 'block', color: '#333' }}>{resumoGeral.conclusaoMediaGeral}</strong>
              <span style={{ fontSize: '12px', color: '#666' }}>Conclusão média geral</span>
            </div>
          </div>

          <div className="resumo-item" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <CalendarDays size={24} color="#E67E22" />
            <div>
              <strong style={{ fontSize: '18px', display: 'block' }}>{resumoGeral.diasMediosSemMonitoramento}</strong>
              <span style={{ fontSize: '12px', color: '#666' }}>Dias médios sem monitoramento</span>
            </div>
          </div>
        </div>

        <div className="detalhes-municipio-card" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flexGrow: 1 }}>
          {!municipioAtualNoMapa ? (
            <div style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>
              <MapPin size={32} style={{ margin: '0 auto', opacity: 0.5 }} />
              <p style={{ marginTop: '10px', fontSize: '14px' }}>Clique em um município no mapa para visualizar os detalhes das obras.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                <h4 style={{ color: '#E67E22', fontSize: '14px', textTransform: 'uppercase' }}>
                  OBRAS EM {municipioAtualNoMapa.nome} - PE
                </h4>
                <span style={{ fontSize: '12px', color: '#666' }}>{municipioAtualNoMapa.obras?.length || 0} obras</span>
              </div>

              <div className="lista-obras-lateral" style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '500px', overflowY: 'auto', paddingRight: '5px' }}>
                {municipioAtualNoMapa.obras?.map((obra, index) => (
                  <div key={index} className="obra-item" style={{ borderBottom: '2px dashed #eee', paddingBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <strong style={{ fontSize: '14px', color: '#333' }}>{obra.nomeUnidade}</strong>
                      <strong style={{ fontSize: '14px', color: '#E67E22' }}>
                        {obra.execucaoEnte}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666', marginBottom: '10px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: SITUACAO_DOT_COLORS[obra.situacao] || '#ccc',
                          }}
                        ></div>
                        {obra.situacao || 'Sem situação'}
                      </span>
                      <span style={{ fontSize: '10px', color: '#888' }}>Prop: {obra.proposta || 'N/A'}</span>
                    </div>

                    <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Informações do Município
                      </h5>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                        <div>
                          <span style={{ color: '#666', display: 'block', fontSize: '10px' }}>Contato feito por:</span>
                          <strong>{obra.quemFezContato}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#666', display: 'block', fontSize: '10px' }}>Data do contato:</span>
                          <strong>{obra.dataContato}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#666', display: 'block', fontSize: '10px' }}>Prev. Conclusão:</span>
                          <strong>{obra.conclusaoEnte}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#666', display: 'block', fontSize: '10px' }}>Prev. Inauguração:</span>
                          <strong>{obra.inauguracaoEnte}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </aside>
    </div>
  );
}
