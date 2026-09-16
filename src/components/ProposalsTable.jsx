import { useMemo, useState } from "react";
import { Info, ChevronDown, ChevronUp, Download, Search, X } from "lucide-react";
import { exportRowsToCSV } from "../utils/spreadsheet";

const PAGE_SIZE = 5;

const PRIORITY_CLASS = {
  Alta: "badge badge-alta",
  Média: "badge badge-media",
  Baixa: "badge badge-baixa",
};

function normalizarBusca(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function linhaCasaComBusca(r, termoNormalizado) {
  const campos = [
    r.proposta,
    r.municipio,
    r.componente,
    r.situacao,
    r.prioridade,
    r.anoRepasse,
    r.dataRepasseAno,
    r.dataPrevistaConclusao,
  ];
  return campos.some((campo) => normalizarBusca(campo).includes(termoNormalizado));
}

export default function ProposalsTable({ rows }) {
  const [expanded, setExpanded] = useState(false);
  const [busca, setBusca] = useState("");

  const rowsFiltradas = useMemo(() => {
    const termo = normalizarBusca(busca).trim();
    if (!termo) return rows;
    return rows.filter((r) => linhaCasaComBusca(r, termo));
  }, [rows, busca]);

  const visibleRows = expanded ? rowsFiltradas : rowsFiltradas.slice(0, PAGE_SIZE);

  function handleBuscaChange(valor) {
    setBusca(valor);
    setExpanded(false); 
  }

  return (
    <div className="table-card">
      <div className="table-header">
        <h3 className="chart-title">
          Acompanhamento das propostas <Info size={14} className="info-icon" />
        </h3>
        <button className="btn-export" onClick={() => exportRowsToCSV(rowsFiltradas)}>
          <Download size={15} />
          Exportar CSV
        </button>
      </div>

      <div className="table-search">
        <Search size={15} className="table-search-icon" />
        <input
          type="text"
          placeholder="Buscar por proposta, município, componente, situação..."
          value={busca}
          onChange={(e) => handleBuscaChange(e.target.value)}
        />
        {busca && (
          <button
            type="button"
            className="table-search-clear"
            onClick={() => handleBuscaChange("")}
            aria-label="Limpar busca"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {busca && (
        <div className="table-search-summary">
          {rowsFiltradas.length}{" "}
          {rowsFiltradas.length === 1 ? "resultado encontrado" : "resultados encontrados"} para "{busca}"
        </div>
      )}

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>PROPOSTA</th>
              <th>ANO DE REPASSE</th>
              <th>MUNICÍPIO</th>
              <th>COMPONENTE</th>
              <th>SITUAÇÃO NO SISMOB</th>
              <th>PRIORIDADE DE CONTATO</th>
              <th>DIAS SEM MONITORAMENTO (SISMOB)</th>
              <th>DATA DO REPASSE (ANO)</th>
              <th>EXECUÇÃO FÍSICA (%) (SISMOB)</th>
              <th>DATA PREVISTA DE CONCLUSÃO (SISMOB)</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={10} className="empty-row">
                  {busca
                    ? "Nenhuma proposta encontrada para essa busca."
                    : "Nenhuma proposta encontrada para os filtros selecionados."}
                </td>
              </tr>
            )}
            {visibleRows.map((r, i) => (
              <tr key={r.proposta + i}>
                <td>{r.proposta}</td>
                <td>{r.anoRepasse}</td>
                <td>{r.municipio}</td>
                <td>{r.componente}</td>
                <td>{r.situacao}</td>
                <td>
                  <span className={PRIORITY_CLASS[r.prioridade] || "badge"}>{r.prioridade}</span>
                </td>
                <td>{r.diasSemMonitoramento}</td>
                <td>{r.dataRepasseAno}</td>
                <td>{r.execucaoFisica}%</td>
                <td>{r.dataPrevistaConclusao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rowsFiltradas.length > PAGE_SIZE && (
        <button className="btn-ver-mais" onClick={() => setExpanded((e) => !e)}>
          {expanded ? "Ver menos" : "Ver mais"}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      )}
    </div>
  );
}