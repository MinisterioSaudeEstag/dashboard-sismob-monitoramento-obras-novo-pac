import { useMemo, useState, useEffect } from "react";
import { FileText, HardHat, BarChart3, Search, CheckCircle2, Clock, CalendarClock } from "lucide-react";

import { FILTER_OPTIONS } from "../data/sampleData";
import FiltersPanel, { DEFAULT_FILTERS } from "../components/FiltersPanel";
import KpiCard from "../components/KpiCard";
import PrioridadeBarChart from "../components/PrioridadeBarChart";
import ComponenteBarChart from "../components/ComponenteBarChart";
import DonutCard from "../components/DonutCard";
import ProposalsTable from "../components/ProposalsTable";
import ActionsPanel from "../components/ActionsPanel";
import SpreadsheetUploader from "../components/SpreadsheetUploader";

import {
  applyFilters,
  computeKPIs,
  porPrioridade,
  porComponente,
  porSituacao,
  porDiasSemMonitoramento,
  computeAcoesPendentes,
} from "../utils/aggregate";
import { SITUACAO_COLORS, DIAS_BUCKET_COLORS } from "../theme";

const OBSERVACOES = [
  "Atraso na atualização do SISMOB;",
  "Datas de conclusão desatualizadas;",
  "Execução física divergente da informada pelo ente;",
  "Necessidade de superação de etapa.",
];

function formatTimestamp(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function DashboardGeral({ dadosPlanilha, setDadosPlanilha, options, setOptions }) {
  
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  const anos = useMemo(() => {
    const set = new Set(dadosPlanilha.map((r) => String(r.anoRepasse)));
    return [...set].sort();
  }, [dadosPlanilha]);

  useEffect(() => {
    if (dadosPlanilha.length > 0) {
      const municipios = [...new Set(dadosPlanilha.map((r) => r.municipio))].sort();
      const componentes = [...new Set(dadosPlanilha.map((r) => r.componente))].sort();
      const situacoes = [...new Set(dadosPlanilha.map((r) => r.situacao))];
      const portes = [...new Set(dadosPlanilha.map((r) => r.porte))].filter(Boolean); 
      
      setOptions({
        municipios,
        componentes,
        situacoes,
        portes,
        prioridades: FILTER_OPTIONS.prioridades
      });
    }
  }, [dadosPlanilha, setOptions]);

  const filteredRows = useMemo(() => applyFilters(dadosPlanilha, filters), [dadosPlanilha, filters]);

  const kpis = useMemo(() => computeKPIs(filteredRows), [filteredRows]);
  const dataPrioridade = useMemo(() => porPrioridade(filteredRows), [filteredRows]);
  const dataComponente = useMemo(() => porComponente(filteredRows), [filteredRows]);
  const dataSituacao = useMemo(() => porSituacao(filteredRows), [filteredRows]);
  const dataDias = useMemo(() => porDiasSemMonitoramento(filteredRows), [filteredRows]);
  const acoesPendentes = useMemo(() => computeAcoesPendentes(filteredRows), [filteredRows]);

  function handleDataLoaded(rows) {
    setDadosPlanilha(rows);
    setFilters(DEFAULT_FILTERS);
    setLastUpdated(new Date());
  }

  return (
    <div className="page">
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="brand">
            <div className="brand-mark">
              <span className="brand-mark-bar bar1" />
              <span className="brand-mark-bar bar2" />
            </div>
            <div>
              <div className="brand-title">SISMOB</div>
              <div className="brand-subtitle">Sistema de Monitoramento de Obras</div>
            </div>
          </div>

          <div className="header-titles">
            <h1>Acompanhamento e Monitoramento de Obras</h1>
            <p>Visão geral das propostas e obras registradas no SISMOB</p>
          </div>

          <div className="header-actions">
            <SpreadsheetUploader onDataLoaded={handleDataLoaded} />
            <div className="last-update-badge">
              <span className="last-update-label">Última atualização</span>
              <span className="last-update-value">
                <CalendarClock size={14} />
                {formatTimestamp(lastUpdated)}
              </span>
            </div>
          </div>
        </header>

        <div className="dashboard-layout">
          <aside className="sidebar">
            <FiltersPanel filters={filters} setFilters={setFilters} options={options} anos={anos} modo="geral" />

            <DonutCard
              title="Propostas por situação"
              data={dataSituacao}
              colors={SITUACAO_COLORS}
              centerLabel="Total de propostas"
              size={190}
            />
          </aside>

          <main className="main">
            <section className="kpi-row">
              <KpiCard icon={<FileText size={30} color="#F7941D" />} label="Total de propostas" value={kpis.total} big />
              <KpiCard icon={<HardHat size={28} color="#F7941D" />} label="Em execução e conclusão" value={kpis.emExecucao} sublabel={`${kpis.emExecucaoPct}% do total`} />
              <KpiCard icon={<BarChart3 size={28} color="#F7941D" />} label="Em início de execução" value={kpis.emInicio} sublabel={`${kpis.emInicioPct}% do total`} />
              <KpiCard icon={<Search size={28} color="#F7941D" />} label="Proposta em análise" value={kpis.emAnalise} sublabel={`${kpis.emAnalisePct}% do total`} />
              <KpiCard icon={<CheckCircle2 size={28} color="#F7941D" />} label="Concluídas" value={kpis.concluidas} sublabel={`${kpis.concluidasPct}% do total`} />
              <KpiCard icon={<Clock size={28} color="#F7941D" />} label="Média dias sem monitoramento" value={kpis.mediaDias} sublabel="dias" />
            </section>

            <section className="charts-row">
              <PrioridadeBarChart data={dataPrioridade} />
              <ComponenteBarChart data={dataComponente} />
              <DonutCard title="Dias sem monitoramento (SISMOB)" data={dataDias} colors={DIAS_BUCKET_COLORS} centerLabel="Total de propostas" size={170} />
            </section>

            <section className="bottom-row">
              <ProposalsTable rows={filteredRows} />
              <ActionsPanel acoes={acoesPendentes} observacoes={OBSERVACOES} />
            </section>
          </main>
        </div>

        <footer className="dashboard-footer">
          <div className="footer-icon">
            <FileText size={16} />
          </div>
          <div>
            <div className="footer-title">Fonte: SISMOB</div>
            <div className="footer-subtitle">Dados referentes às propostas e obras</div>
          </div>
        </footer>
      </div>
    </div>
  );
}