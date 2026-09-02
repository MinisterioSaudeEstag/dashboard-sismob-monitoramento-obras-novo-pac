import { useState } from "react";
import { Info, ChevronDown, ChevronUp, Download } from "lucide-react";
import { exportRowsToCSV } from "../utils/spreadsheet";

const PAGE_SIZE = 5;

const PRIORITY_CLASS = {
  Alta: "badge badge-alta",
  Média: "badge badge-media",
  Baixa: "badge badge-baixa",
};

export default function ProposalsTable({ rows }) {
  const [expanded, setExpanded] = useState(false);
  const visibleRows = expanded ? rows : rows.slice(0, PAGE_SIZE);

  return (
    <div className="table-card">
      <div className="table-header">
        <h3 className="chart-title">
          Acompanhamento das propostas <Info size={14} className="info-icon" />
        </h3>
        <button className="btn-export" onClick={() => exportRowsToCSV(rows)}>
          <Download size={15} />
          Exportar CSV
        </button>
      </div>

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
                  Nenhuma proposta encontrada para os filtros selecionados.
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

      {rows.length > PAGE_SIZE && (
        <button className="btn-ver-mais" onClick={() => setExpanded((e) => !e)}>
          {expanded ? "Ver menos" : "Ver mais"}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      )}
    </div>
  );
}
