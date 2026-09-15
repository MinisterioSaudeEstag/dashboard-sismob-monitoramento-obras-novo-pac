import { useState } from "react";
import { Info, ChevronDown, ChevronUp, Download } from "lucide-react";
import { exportRowsToCSV } from "../utils/spreadsheet";

const PAGE_SIZE = 5;

const PRIORITY_CLASS = {
  Alta: "badge badge-alta",
  Média: "badge badge-media",
  Baixa: "badge badge-baixa",
};

const extrairAno = (valor) => {
  if (!valor) return "ND";
  if (typeof valor === 'number' && valor > 10000) {
    const d = new Date(1899, 11, 30);
    d.setDate(d.getDate() + Math.floor(valor));
    return d.getFullYear();
  }
  const match = String(valor).match(/\d{4}/);
  return match ? match[0] : valor;
};

const formatarPercentual = (valor) => {
  if (valor === undefined || valor === null || valor === "") return "0%";
  if (String(valor).includes('%')) return valor;
  const num = Number(valor);
  if (!isNaN(num)) {
    return num <= 1 && num > 0 ? `${Math.round(num * 100)}%` : `${Math.round(num)}%`;
  }
  return String(valor);
};

const formatarData = (valor) => {
  if (!valor) return "ND";
  if (typeof valor === 'number' && valor > 10000) {
    const d = new Date(1899, 11, 30);
    d.setDate(d.getDate() + Math.floor(valor));
    return d.toLocaleDateString('pt-BR');
  }
  const str = String(valor).trim();
  const dataObj = new Date(str);
  if (!isNaN(dataObj.getTime())) return dataObj.toLocaleDateString('pt-BR');
  return str;
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
                <td colSpan={9} className="empty-row">
                  Nenhuma proposta encontrada para os filtros selecionados.
                </td>
              </tr>
            )}
            {visibleRows.map((r, i) => {
              const dias = r.diasSemMonitoramento ?? r['Dias sem monitoramento SISMOB'] ?? r['Dias sem monitoramento (SISMOB)'] ?? '0';
              const ano = r.anoRepasse ?? extrairAno(r['Data do repasse']);
              const execSismob = r.execucaoSismob ?? formatarPercentual(r['Execução física (%) SISMOB'] ?? r['Execução física (%) (SISMOB)']);
              const conclusao = r.conclusaoSismob ?? formatarData(r['Data prevista de conclusão SISMOB'] ?? r['Data prevista de conclusão (SISMOB)']);

              return (
                <tr key={r.proposta + i}>
                  <td>{r.proposta || r.Proposta || 'ND'}</td>
                  <td>{r.municipio || r.Município || 'ND'}</td>
                  <td>{r.componente || r.Componente || 'ND'}</td>
                  <td>{r.situacao || r['Situação no SISMOB'] || 'ND'}</td>
                  <td>
                    <span className={PRIORITY_CLASS[r.prioridade] || "badge"}>
                      {r.prioridade || r['Prioridade de contato'] || 'ND'}
                    </span>
                  </td>
                  <td>{dias}</td>
                  <td>{ano}</td>
                  <td>{execSismob}</td>
                  <td>{conclusao}</td>
                </tr>
              );
            })}
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