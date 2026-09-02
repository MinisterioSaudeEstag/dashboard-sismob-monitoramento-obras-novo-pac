export const COLORS = {
  orange: "#F7941D",
  orangeDark: "#E8720C",
  orangeLight: "#FDEBD0",
  navy: "#1F5C8B",
  red: "#E14C3C",
  yellow: "#F4C430",
  green: "#3F9E4D",
  greenLight: "#8DC63F",
  amber: "#F0A32F",
  textDark: "#232323",
  textMuted: "#6B7280",
  bg: "#F3F4F7",
  cardBg: "#FFFFFF",
  border: "#ECECEC",
};

export const SITUACAO_COLORS = {
  "Em execução e conclusão": COLORS.navy,
  "Em início de execução": COLORS.red,
  "Proposta em análise": COLORS.yellow,
  "Concluída": COLORS.green,
};

export const PRIORIDADE_COLORS = {
  Alta: COLORS.red,
  Média: COLORS.yellow,
  Baixa: COLORS.green,
};

export const DIAS_BUCKET_COLORS = {
  "Até 30 dias": COLORS.green,
  "31 - 60 dias": COLORS.greenLight,
  "61 - 90 dias": COLORS.yellow,
  "91 - 180 dias": COLORS.amber,
  "+ de 180 dias": COLORS.red,
};
