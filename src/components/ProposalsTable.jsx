import { useState } from "react";
import { Info, ChevronDown, ChevronUp, Download } from "lucide-react";
import { exportRowsToCSV } from "../utils/spreadsheet";

const PAGE_SIZE = 5;

const PRIORITY_CLASS = {
  Alta: "badge badge-alta",
  Média: "badge badge-media",
  Baixa: "badge badge-baixa",
};

// Função caçadora dinâmica aprimorada para encontrar chaves exatas no objeto
const encontrarValor = (obj, keywords) => {
  if (!obj) return null;
  const chaves = Object.keys(obj);
  for (let chave of chaves) {
    const chaveLower = chave.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (let kw of keywords) {
      const kwLower = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (chaveLower.includes(kwLower)) {
        const val = obj[chave];
        if (val !== undefined && val !== null && val !== "" && val !== "ND") {
          return val;
        }
      }
    }
  }
  return null;
};

// Conversor seguro de número serial do Excel ou String de Data para Ano (YYYY)
const extrairAno = (valor) => {
  if (valor === undefined || valor === null || valor === "") return "ND";
  
  // Se for número serial do Excel (ex: 45828)
  if (typeof valor === 'number' && valor > 10000) {
    const d = new Date(1899, 11, 30);
    d.setDate(d.getDate() + Math.floor(valor));
    return !isNaN(d.getFullYear()) ? String(d.getFullYear()) : "ND";
  }

  const str = String(valor).trim();
  // Se a string contiver uma data em formato ISO ou americano (ex: 2025-06-20 ou 6/20/2025)
  const dataObj = new Date(str);
  if (!isNaN(dataObj.getTime()) && dataObj.getFullYear() > 2000) {
    return String(dataObj.getFullYear());
  }

  // Tenta extrair 4 dígitos de ano por regex
  const match = str.match(/\d{4}/);
  return match ? match[0] : str;
};

// Formatador seguro de Porcentagem (trata decimais como 0.14 -> 14% e inteiros como 14 -> 14%)
const formatarPercentual = (valor) => {
  if (valor === undefined || valor === null || valor === "") return "0%";
  const strVal = String(valor).trim();
  if (strVal.includes('%')) return strVal;
  
  const num = Number(valor);
  if (!isNaN(num)) {
    const finalNum = (num > 0 && num <= 1) ? num * 100 : num;
    return `${Math.round(finalNum)}%`;
  }
  return strVal || "0%";
};

// Conversor seguro de data serial do Excel para formato brasileiro (DD/MM/AAAA)
const formatarData = (valor) => {
  if (valor === undefined || valor === null || valor === "" || valor === "ND") return "ND";
  
  // Se for número serial do Excel (ex: 46281)
  if (typeof valor === 'number' && valor > 10000) {
    const d = new Date(1899, 11, 30);
    d.setDate(d.getDate() + Math.floor(valor));
    return !isNaN(d.getTime()) ? d.toLocaleDateString('pt-BR') : "ND";
  }

  const str = String(valor).trim();
  if (str === "NaT" || str === "NaN") return "ND";

  const dataObj = new Date(str);
  if (!isNaN(dataObj.getTime())) {
    return dataObj.toLocaleDateString('pt-BR');
  }
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
              // Extração robusta garantindo busca por termos específicos da planilha oficial
              const dias = encontrarValor(r, ['dias sem monitoramento']) ?? '0';
              const repasseRaw = encontrarValor(r, ['data do repasse', 'repasse']);
              const ano = extrairAno(repasseRaw);
              const execRaw = encontrarValor(r, ['execução física (%) sismob', 'execução física', 'execucao']);
              const execSismob = formatarPercentual(execRaw);
              const conclusaoRaw = encontrarValor(r, ['data prevista de conclusão sismob', 'data prevista', 'conclusao']);
              const conclusao = formatarData(conclusaoRaw);

              const propostaVal = r.proposta || r.Proposta || encontrarValor(r, ['proposta']) || 'ND';
              const municipioVal = r.municipio || r.Município || encontrarValor(r, ['município']) || 'ND';
              const componenteVal = r.componente || r.Componente || encontrarValor(r, ['componente']) || 'ND';
              const situacaoVal = r.situacao || r['Situação no SISMOB'] || encontrarValor(r, ['situação']) || 'ND';
              const prioridadeVal = r.prioridade || r['Prioridade de contato'] || encontrarValor(r, ['prioridade']) || 'ND';

              return (
                <tr key={propostaVal + i}>
                  <td>{propostaVal}</td>
                  <td>{municipioVal}</td>
                  <td>{componenteVal}</td>
                  <td>{situacaoVal}</td>
                  <td>
                    <span className={PRIORITY_CLASS[prioridadeVal] || "badge"}>
                      {prioridadeVal}
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