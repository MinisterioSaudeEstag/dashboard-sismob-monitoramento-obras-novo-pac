// Dados de amostra (sintéticos) usados apenas até que o usuário importe sua
// própria planilha. As proporções foram calibradas para refletir o painel
// de referência (388 propostas no total).

const MUNICIPIOS = [
  "Recife",
  "Olinda",
  "Jaboatão dos Guararapes",
  "Caruaru",
  "Petrolina",
  "Garanhuns",
  "Abreu e Lima",
  "Afogados da Ingazeira",
  "Vitória de Santo Antão",
  "Serra Talhada",
  "Arcoverde",
  "Gravatá",
  "Paulista",
  "Igarassu",
  "Camaragibe",
];

const COMPONENTES = [
  "Unidade Básica de Saúde I",
  "Unidade Básica de Saúde III",
  "Oficina Ortopédica",
  "Centro de Atenção Psicossocial III",
  "Outros",
];

const SITUACOES = [
  "Em execução e conclusão",
  "Em início de execução",
  "Proposta em análise",
  "Concluída",
];

const PRIORIDADES = ["Alta", "Média", "Baixa"];

// Contagens-alvo (iguais às do painel de referência)
const SITUACAO_COUNTS = { "Em execução e conclusão": 109, "Em início de execução": 196, "Proposta em análise": 51, Concluída: 32 };
const PRIORIDADE_COUNTS = { Alta: 172, Média: 105, Baixa: 111 };
const COMPONENTE_COUNTS = {
  "Unidade Básica de Saúde I": 213,
  "Unidade Básica de Saúde III": 67,
  "Oficina Ortopédica": 28,
  "Centro de Atenção Psicossocial III": 22,
  Outros: 58,
};

const TOTAL = 388;

// PRNG determinístico (mesma seed => mesmos dados a cada carregamento)
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260520);

function buildBucketArray(counts, total) {
  const arr = [];
  Object.entries(counts).forEach(([label, count]) => {
    for (let i = 0; i < count; i++) arr.push(label);
  });
  while (arr.length < total) arr.push(arr[arr.length - 1]);
  return shuffle(arr.slice(0, total));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr) {
  return arr[Math.floor(rand() * arr.length)];
}

function pad(n, len) {
  return String(n).padStart(len, "0");
}

function randomDateBetween(startYear, endYear) {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 28).getTime();
  const t = start + rand() * (end - start);
  const d = new Date(t);
  return `${pad(d.getDate(), 2)}/${pad(d.getMonth() + 1, 2)}/${d.getFullYear()}`;
}

function diasBucketValue(bucket) {
  switch (bucket) {
    case "Até 30 dias":
      return Math.floor(rand() * 30) + 1;
    case "31 - 60 dias":
      return Math.floor(rand() * 30) + 31;
    case "61 - 90 dias":
      return Math.floor(rand() * 30) + 61;
    case "91 - 180 dias":
      return Math.floor(rand() * 90) + 91;
    default:
      return Math.floor(rand() * 200) + 181;
  }
}

const DIAS_BUCKET_COUNTS = {
  "Até 30 dias": 98,
  "31 - 60 dias": 93,
  "61 - 90 dias": 76,
  "91 - 180 dias": 79,
  "+ de 180 dias": 42,
};

export function generateSampleData() {
  const situacoes = buildBucketArray(SITUACAO_COUNTS, TOTAL);
  const prioridades = buildBucketArray(PRIORIDADE_COUNTS, TOTAL);
  const componentes = buildBucketArray(COMPONENTE_COUNTS, TOTAL);
  const diasBuckets = buildBucketArray(DIAS_BUCKET_COUNTS, TOTAL);

  const rows = [];
  for (let i = 0; i < TOTAL; i++) {
    const anoRepasse = pick([2024, 2025]);
    const municipio = pick(MUNICIPIOS);
    const situacao = situacoes[i];
    const diasSemMonitoramento = diasBucketValue(diasBuckets[i]);

    let execucaoFisica;
    if (situacao === "Concluída") execucaoFisica = 100;
    else if (situacao === "Em execução e conclusão") execucaoFisica = Math.floor(rand() * 40) + 60;
    else if (situacao === "Em início de execução") execucaoFisica = Math.floor(rand() * 40) + 1;
    else execucaoFisica = 0;

    const proposta = `${anoRepasse}${pad(Math.floor(rand() * 99), 2)}${pad(i + 1, 3)}00012${pad((i * 7) % 1000, 4)}`;

    rows.push({
      proposta,
      anoRepasse,
      municipio,
      componente: componentes[i],
      situacao,
      prioridade: prioridades[i],
      diasSemMonitoramento,
      dataRepasseAno: anoRepasse + (rand() > 0.5 ? 1 : 0),
      execucaoFisica,
      dataPrevistaConclusao: randomDateBetween(2025, 2026),
    });
  }
  return rows;
}

export const FILTER_OPTIONS = {
  municipios: MUNICIPIOS,
  componentes: COMPONENTES,
  situacoes: SITUACOES,
  prioridades: PRIORIDADES,
};
