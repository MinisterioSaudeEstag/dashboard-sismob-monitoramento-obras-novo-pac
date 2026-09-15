import * as XLSX from "xlsx";

// Mapeia possíveis nomes de coluna (planilha do usuário) -> campo interno.
// Cobre tanto o modelo "de exemplo" (cabeçalhos com sufixo "(SISMOB)" entre
// parênteses) quanto a exportação real do SISMOB/PAC (ex.: "Ano da
// proposta", "Execução física (%) SISMOB", "Dias sem monitoramento SISMOB",
// sem parênteses ao redor de "SISMOB").
const HEADER_MAP = {
  proposta: "proposta",
  "n da proposta": "proposta",
  "numero da proposta": "proposta",

  obra: "nomeObra",
  "nome da obra": "nomeObra",
  "nome da unidade": "nomeObra",

  "ano de repasse": "anoRepasse",
  "ano repasse": "anoRepasse",
  "ano da proposta": "anoRepasse",

  // Data completa do repasse (planilha real) OU ano já calculado (modelo de
  // exemplo) -- ambos convergem para o mesmo campo interno, que depois é
  // convertido para ano com yearFromDateValue().
  "data do repasse (ano)": "dataRepasseRaw",
  "data do repasse": "dataRepasseRaw",

  municipio: "municipio",
  componente: "componente",

  "situacao no sismob": "situacao",
  situacao: "situacao",

  "prioridade de contato": "prioridade",
  prioridade: "prioridade",

  "dias sem monitoramento sismob": "diasSemMonitoramento",
  "dias sem monitoramento (sismob)": "diasSemMonitoramento",
  "dias sem monitoramento": "diasSemMonitoramento",

  "execucao fisica (%) sismob": "execucaoFisica",
  "execucao fisica (%) (sismob)": "execucaoFisica",
  "execucao fisica (%)": "execucaoFisica",
  "execucao fisica": "execucaoFisica",

  "data prevista de conclusao sismob": "dataPrevistaConclusao",
  "data prevista de conclusao (sismob)": "dataPrevistaConclusao",
  "data prevista de conclusao": "dataPrevistaConclusao",
};

function normalizeHeader(h) {
  return String(h)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .trim()
    .toLowerCase();
}

function normalizeRow(rawRow) {
  const out = {};
  Object.entries(rawRow).forEach(([key, value]) => {
    const norm = normalizeHeader(key);
    const field = HEADER_MAP[norm];
    if (field) out[field] = value;
  });
  return out;
}

function coerceNumber(v, fallback = 0) {
  if (v === undefined || v === null || v === "") return fallback;
  if (v instanceof Date) return fallback;
  const n = Number(String(v).replace("%", "").trim().replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

// Base do calendário do Excel (1899-12-30) usada para converter números de
// série (ex.: 46281) em datas reais.
function excelSerialToDate(serial) {
  const ms = Date.UTC(1899, 11, 30) + serial * 86400000;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Extrai o ANO de um valor que pode ser: um objeto Date (quando o SheetJS
 * já reconhece a célula como data), um número de série do Excel, um ano já
 * pronto (ex.: 2025) ou uma string de data em qualquer formato comum.
 */
function yearFromDateValue(value) {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getFullYear();
  }
  if (typeof value === "number") {
    if (value > 10000) {
      const d = excelSerialToDate(value);
      return d ? d.getFullYear() : null;
    }
    if (value >= 1900 && value <= 2100) return Math.round(value);
    return null;
  }
  const str = String(value).trim();
  if (!str) return null;
  const match = str.match(/(\d{4})/);
  if (match) return Number(match[1]);
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d.getFullYear();
}

/**
 * Formata qualquer valor de data (Date, número de série do Excel, string em
 * outro formato) para o padrão brasileiro dd/mm/aaaa. Retorna "" quando não
 * há data (célula vazia), em vez de textos como "ND" ou datas absurdas.
 */
function formatDateBR(value) {
  if (value === undefined || value === null || value === "") return "";

  let d = null;
  if (value instanceof Date) {
    d = value;
  } else if (typeof value === "number") {
    d = value > 10000 ? excelSerialToDate(value) : null;
  } else {
    const str = String(value).trim();
    if (!str) return "";
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) return str; // já está pt-BR
    const parsed = new Date(str);
    d = Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (!d || Number.isNaN(d.getTime())) {
    return typeof value === "string" ? value.trim() : "";
  }

  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// A planilha real do SISMOB usa um vocabulário mais amplo do que o modelo de
// exemplo. Mapeamos os termos mais comuns para as 4 categorias usadas nos
// cards/gráficos; o que não reconhecemos passa direto (aparece na tabela e
// nos gráficos como uma categoria própria, em vez de ser descartado).
function normalizeSituacao(raw) {
  const val = String(raw ?? "").trim();
  // Alguns registros da planilha de origem têm VLOOKUP que não encontrou a
  // proposta na base do SISMOB e retornou "0" (ou vazio) em vez de um texto
  // de situação. Tratamos isso como "não informado" em vez de criar uma
  // categoria "0" no dashboard.
  if (!val || val === "0") return "Proposta em análise";
  const map = {
    "Obra concluída": "Concluída",
    "Em funcionamento": "Concluída",
  };
  return map[val] || val;
}

function normalizePrioridade(raw) {
  const val = String(raw ?? "").trim();
  if (!val) return "Média";
  const norm = val
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (norm === "nao e necessario contato") return "Baixa";
  return val;
}

/**
 * Lê um arquivo (.xlsx, .xls ou .csv) e retorna um array de objetos
 * normalizados para o formato interno usado pelo dashboard.
 */
export async function parseSpreadsheetFile(file) {
  const buffer = await file.arrayBuffer();
  // cellDates: true -> células com formato de data (ex.: numFmt "dd/mm/yyyy")
  // já chegam como objetos Date nativos, em vez de números de série do Excel.
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (!json.length) {
    throw new Error("A planilha está vazia ou não foi possível ler os dados.");
  }

  const rows = json.map((rawRow) => {
    const r = normalizeRow(rawRow);
    const componente = String(r.componente ?? "").trim() || "Outros";

    // "Ano de repasse"/"Ano da proposta" (quando existe) tem prioridade;
    // senão, derivamos o ano a partir da data completa do repasse.
    const anoRepasseColuna = coerceNumber(r.anoRepasse, null);
    const anoDaData = yearFromDateValue(r.dataRepasseRaw);
    const anoRepasse = anoRepasseColuna ?? anoDaData ?? new Date().getFullYear();
    const dataRepasseAno = anoDaData ?? anoRepasseColuna ?? anoRepasse;

    return {
      proposta: String(r.proposta ?? "").trim(),
      nomeObra: String(r.nomeObra ?? "").trim() || componente,
      anoRepasse,
      municipio: String(r.municipio ?? "").trim() || "Não informado",
      componente,
      situacao: normalizeSituacao(r.situacao),
      prioridade: normalizePrioridade(r.prioridade),
      diasSemMonitoramento: coerceNumber(r.diasSemMonitoramento, 0),
      dataRepasseAno,
      execucaoFisica: coerceNumber(r.execucaoFisica, 0),
      dataPrevistaConclusao: formatDateBR(r.dataPrevistaConclusao),
    };
  });

  const missingProposta = rows.filter((r) => !r.proposta).length;
  if (missingProposta === rows.length) {
    throw new Error(
      "Não encontramos a coluna 'PROPOSTA' na planilha. Verifique se os cabeçalhos seguem o padrão do SISMOB (ex.: PROPOSTA, MUNICÍPIO, COMPONENTE, SITUAÇÃO NO SISMOB...)."
    );
  }

  return rows;
}

/**
 * Exporta um array de objetos (linhas da tabela filtrada) para um arquivo CSV
 * e dispara o download no navegador.
 */
export function exportRowsToCSV(rows, filename = "sismob_propostas.csv") {
  const columns = [
    { key: "proposta", label: "PROPOSTA" },
    { key: "anoRepasse", label: "ANO DE REPASSE" },
    { key: "municipio", label: "MUNICÍPIO" },
    { key: "componente", label: "COMPONENTE" },
    { key: "situacao", label: "SITUAÇÃO NO SISMOB" },
    { key: "prioridade", label: "PRIORIDADE DE CONTATO" },
    { key: "diasSemMonitoramento", label: "DIAS SEM MONITORAMENTO (SISMOB)" },
    { key: "dataRepasseAno", label: "DATA DO REPASSE (ANO)" },
    { key: "execucaoFisica", label: "EXECUÇÃO FÍSICA (%) (SISMOB)" },
    { key: "dataPrevistaConclusao", label: "DATA PREVISTA DE CONCLUSÃO (SISMOB)" },
  ];

  const aoa = [
    columns.map((c) => c.label),
    ...rows.map((row) => columns.map((c) => row[c.key])),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  // Adiciona BOM para acentuação correta ao abrir no Excel
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
