import * as XLSX from "xlsx";

const HEADER_MAP = {
  proposta: "proposta",
  "n da proposta": "proposta",
  "numero da proposta": "proposta",
  "ano de repasse": "anoRepasse",
  "ano repasse": "anoRepasse",
  municipio: "municipio",
  componente: "componente",
  "situacao no sismob": "situacao",
  situacao: "situacao",
  "prioridade de contato": "prioridade",
  prioridade: "prioridade",
  "dias sem monitoramento (sismob)": "diasSemMonitoramento",
  "dias sem monitoramento": "diasSemMonitoramento",
  "data do repasse (ano)": "dataRepasseAno",
  "data do repasse": "dataRepasseAno",
  "execucao fisica (%) (sismob)": "execucaoFisica",
  "execucao fisica (%)": "execucaoFisica",
  "execucao fisica": "execucaoFisica",
  "data prevista de conclusao (sismob)": "dataPrevistaConclusao",
  "data prevista de conclusao": "dataPrevistaConclusao",

  "quem fez o contato?": "quemFezContato",
  "quem fez o contato": "quemFezContato",
  "contato por": "quemFezContato",
  "data do contato": "dataContato",
  "execucao informada pelo ente (%)": "execucaoEnte",
  "execucao informada pelo ente": "execucaoEnte",
  "data/previsao de conclusao informada pelo ente": "conclusaoEnte",
  "data de conclusao informada pelo ente": "conclusaoEnte",
  "previsao de conclusao informada pelo ente": "conclusaoEnte",
  "data/previsao de inauguracao informada pelo ente": "inauguracaoEnte",
  "data de inauguracao informada pelo ente": "inauguracaoEnte",
  "previsao de inauguracao informada pelo ente": "inauguracaoEnte",
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
  const n = Number(String(v).replace("%", "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

export async function parseSpreadsheetFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (!json.length) {
    throw new Error("A planilha está vazia ou não foi possível ler os dados.");
  }

  const rows = json.map((rawRow) => {
    const r = normalizeRow(rawRow);

    const execEnteVal =
      r.execucaoEnte !== undefined &&
      r.execucaoEnte !== null &&
      String(r.execucaoEnte).trim() !== ""
        ? coerceNumber(r.execucaoEnte, "ND")
        : "ND";

    return {
      proposta: String(r.proposta ?? "").trim(),
      anoRepasse: coerceNumber(r.anoRepasse, new Date().getFullYear()),
      municipio: String(r.municipio ?? "").trim() || "Não informado",
      componente: String(r.componente ?? "").trim() || "Outros",
      situacao: String(r.situacao ?? "").trim() || "Proposta em análise",
      prioridade: String(r.prioridade ?? "").trim() || "Média",
      diasSemMonitoramento: coerceNumber(r.diasSemMonitoramento, 0),
      dataRepasseAno: coerceNumber(r.dataRepasseAno, new Date().getFullYear()),
      execucaoFisica: coerceNumber(r.execucaoFisica, 0),
      dataPrevistaConclusao: String(r.dataPrevistaConclusao ?? "").trim(),

      quemFezContato: String(r.quemFezContato ?? "").trim() || "Não informado",
      dataContato: String(r.dataContato ?? "").trim() || "ND",
      execucaoEnte: execEnteVal,
      conclusaoEnte: String(r.conclusaoEnte ?? "").trim() || "ND",
      inauguracaoEnte: String(r.inauguracaoEnte ?? "").trim() || "ND",
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