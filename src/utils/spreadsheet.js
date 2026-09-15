import * as XLSX from "xlsx";

// Mapeia todas as variações de cabeçalhos da planilha unificada (SISMOB + Respostas)
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

  municipio: "municipio",
  "municipio convenente": "municipio",
  componente: "componente",
  porte: "porte",

  "situacao no sismob": "situacao",
  situacao: "situacao",

  "prioridade de contato": "prioridade",
  prioridade: "prioridade",

  "dias sem monitoramento sismob": "diasSemMonitoramento",
  "dias sem monitoramento (sismob)": "diasSemMonitoramento",
  "dias sem monitoramento": "diasSemMonitoramento",

  "data do repasse": "dataRepasseRaw",
  "data do repasse (ano)": "dataRepasseRaw",

  "execucao fisica (%) sismob": "execucaoFisica",
  "execucao fisica (%) (sismob)": "execucaoFisica",
  "execucao fisica (%)": "execucaoFisica",
  "execucao fisica": "execucaoFisica",

  "data prevista de conclusao sismob": "dataPrevistaConclusao",
  "data prevista de conclusão (sismob)": "dataPrevistaConclusao",
  "data prevista de conclusao": "dataPrevistaConclusao",

  // Aba de Respostas e Acompanhamento Local
  "quem fez o contato?": "quemFezContato",
  "quem fez o contato": "quemFezContato",
  "contato por": "quemFezContato",
  "data do contato": "dataContato",
  
  "execucao informada pelo ente (%)": "execucaoEnte",
  "execucao informada pelo ente": "execucaoEnte",

  "data/previsao de conclusao informada pelo ente": "conclusaoEnte",
  "data de conclusao informada pelo ente": "conclusaoEnte",
  "previsao de conclusao informada pelo ente": "conclusaoEnte",
  "prev. conclusao ente": "conclusaoEnte",

  "data/previsao de inauguracao informada pelo ente": "inauguracaoEnte",
  "data de inauguracao informada pelo ente": "inauguracaoEnte",
  "previsao de inauguracao informada pelo ente": "inauguracaoEnte",
  "prev. inauguracao ente": "inauguracaoEnte",
};

function normalizeHeader(h) {
  return String(h)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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

// Converte número de série do Excel (ex: 45828 ou 46077) em data real
function excelSerialToDate(serial) {
  const ms = Date.UTC(1899, 11, 30) + serial * 86400000;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Extrai o ANO de forma segura (lida com datas Date, números de série e strings)
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

// Formata qualquer data para o padrão brasileiro DD/MM/AAAA
function formatDateBR(value) {
  if (value === undefined || value === null || value === "" || value === "ND") return "";

  let d = null;
  if (value instanceof Date) {
    d = value;
  } else if (typeof value === "number") {
    d = value > 10000 ? excelSerialToDate(value) : null;
  } else {
    const str = String(value).trim();
    if (!str || str === "NaT" || str === "NaN") return "";
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) return str;
    const parsed = new Date(str);
    d = Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (!d || Number.isNaN(d.getTime())) {
    return typeof value === "string" ? value.trim() : "";
  }

  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function normalizeSituacao(raw) {
  const val = String(raw ?? "").trim();
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

export async function parseSpreadsheetFile(file) {
  const buffer = await file.arrayBuffer();
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

    const anoRepasseColuna = coerceNumber(r.anoRepasse, null);
    const anoDaData = yearFromDateValue(r.dataRepasseRaw);
    const anoRepasse = anoRepasseColuna ?? anoDaData ?? new Date().getFullYear();
    const dataRepasseAno = anoDaData ?? anoRepasseColuna ?? anoRepasse;

    // Tratamento rigoroso da Execução Física do SISMOB (ex: 14 ou 0.14 vira 14)
    let execFisicaNum = coerceNumber(r.execucaoFisica, 0);
    if (execFisicaNum > 0 && execFisicaNum <= 1) {
      execFisicaNum = Math.round(execFisicaNum * 100);
    } else {
      execFisicaNum = Math.round(execFisicaNum);
    }

    // Tratamento da Execução do Ente
    const execEnteVal =
      r.execucaoEnte !== undefined &&
      r.execucaoEnte !== null &&
      String(r.execucaoEnte).trim() !== ""
        ? coerceNumber(r.execucaoEnte, "ND")
        : "ND";

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
      execucaoFisica: execFisicaNum,
      dataPrevistaConclusao: formatDateBR(r.dataPrevistaConclusao) || "ND",

      // Informações da aba de respostas integradas
      quemFezContato: String(r.quemFezContato ?? "").trim() || "Não informado",
      dataContato: formatDateBR(r.dataContato) || String(r.dataContato ?? "").trim() || "ND",
      execucaoEnte: execEnteVal,
      conclusaoEnte: formatDateBR(r.conclusaoEnte) || String(r.conclusaoEnte ?? "").trim() || "ND",
      inauguracaoEnte: formatDateBR(r.inauguracaoEnte) || String(r.inauguracaoEnte ?? "").trim() || "ND",
    };
  });

  const missingProposta = rows.filter((r) => !r.proposta).length;
  if (missingProposta === rows.length) {
    throw new Error(
      "Não encontramos a coluna 'PROPOSTA' na planilha. Verifique se os cabeçalhos seguem o padrão do SISMOB."
    );
  }

  return rows;
}

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
    { key: "quemFezContato", label: "QUEM FEZ O CONTATO?" },
    { key: "dataContato", label: "DATA DO CONTATO" },
    { key: "execucaoEnte", label: "EXECUÇÃO INFORMADA PELO ENTE (%)" },
    { key: "conclusaoEnte", label: "PREV. CONCLUSÃO ENTE" },
    { key: "inauguracaoEnte", label: "PREV. INAUGURAÇÃO ENTE" },
  ];

  const aoa = [
    columns.map((c) => c.label),
    ...rows.map((row) => columns.map((c) => row[c.key])),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
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