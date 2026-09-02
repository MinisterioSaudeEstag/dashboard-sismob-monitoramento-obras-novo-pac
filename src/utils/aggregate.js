export function applyFilters(rows, filters) {
  return rows.filter((r) => {
    if (filters.anoRepasse !== "Todos" && String(r.anoRepasse) !== String(filters.anoRepasse)) return false;
    if (filters.municipio !== "Todos" && r.municipio !== filters.municipio) return false;
    if (filters.prioridade !== "Todos" && r.prioridade !== filters.prioridade) return false;
    if (filters.situacao !== "Todos" && r.situacao !== filters.situacao) return false;
    if (filters.componente !== "Todos" && r.componente !== filters.componente) return false;
    return true;
  });
}

export function computeKPIs(rows) {
  const total = rows.length;
  const count = (situacao) => rows.filter((r) => r.situacao === situacao).length;
  const emExecucao = count("Em execução e conclusão");
  const emInicio = count("Em início de execução");
  const emAnalise = count("Proposta em análise");
  const concluidas = count("Concluída");
  const mediaDias = total
    ? Math.round(rows.reduce((acc, r) => acc + (Number(r.diasSemMonitoramento) || 0), 0) / total)
    : 0;

  const pct = (n) => (total ? ((n / total) * 100).toFixed(1).replace(".", ",") : "0,0");

  return {
    total,
    emExecucao,
    emExecucaoPct: pct(emExecucao),
    emInicio,
    emInicioPct: pct(emInicio),
    emAnalise,
    emAnalisePct: pct(emAnalise),
    concluidas,
    concluidasPct: pct(concluidas),
    mediaDias,
  };
}

export function groupCount(rows, field) {
  const map = new Map();
  rows.forEach((r) => {
    const key = r[field] || "Não informado";
    map.set(key, (map.get(key) || 0) + 1);
  });
  return map;
}

export function porPrioridade(rows) {
  const order = ["Alta", "Média", "Baixa"];
  const map = groupCount(rows, "prioridade");
  return order.map((label) => ({ label, valor: map.get(label) || 0 }));
}

export function porComponente(rows) {
  const order = [
    "Unidade Básica de Saúde I",
    "Unidade Básica de Saúde III",
    "Oficina Ortopédica",
    "Centro de Atenção Psicossocial III",
    "Outros",
  ];
  const map = groupCount(rows, "componente");
  const extras = [...map.keys()].filter((k) => !order.includes(k));
  const labels = [...order, ...extras];
  return labels.map((label) => ({ label, valor: map.get(label) || 0 })).filter((d) => d.valor > 0 || order.includes(d.label));
}

export function porSituacao(rows) {
  const order = ["Em execução e conclusão", "Em início de execução", "Proposta em análise", "Concluída"];
  const map = groupCount(rows, "situacao");
  const total = rows.length;
  return order.map((label) => {
    const valor = map.get(label) || 0;
    return { label, valor, pct: total ? ((valor / total) * 100).toFixed(1).replace(".", ",") : "0,0" };
  });
}

export function computeAcoesPendentes(rows) {
  const atualizarSismob = rows.filter((r) => (Number(r.diasSemMonitoramento) || 0) > 30).length;
  const atualizarDataConclusao = rows.filter((r) => !r.dataPrevistaConclusao).length;
  const pedirSuperacaoEtapa = rows.filter((r) => Number(r.execucaoFisica) >= 100 && r.situacao !== "Concluída").length;
  const verificarExecucaoFisica = rows.filter(
    (r) => Number(r.execucaoFisica) === 0 && r.situacao === "Em execução e conclusão"
  ).length;
  const demaisAcoes = rows.filter((r) => r.situacao === "Proposta em análise" && (Number(r.diasSemMonitoramento) || 0) > 15).length;

  return [
    { label: "Atualizar SISMOB 1 vez por mês", count: atualizarSismob },
    { label: "Atualizar data de conclusão", count: atualizarDataConclusao },
    { label: "Pedir superação de etapa", count: pedirSuperacaoEtapa },
    { label: "Verificar execução física", count: verificarExecucaoFisica },
    { label: "Demais ações", count: demaisAcoes },
  ];
}

export function porDiasSemMonitoramento(rows) {
  const buckets = [
    { label: "Até 30 dias", min: 0, max: 30 },
    { label: "31 - 60 dias", min: 31, max: 60 },
    { label: "61 - 90 dias", min: 61, max: 90 },
    { label: "91 - 180 dias", min: 91, max: 180 },
    { label: "+ de 180 dias", min: 181, max: Infinity },
  ];
  const total = rows.length;
  return buckets.map((b) => {
    const valor = rows.filter((r) => {
      const d = Number(r.diasSemMonitoramento) || 0;
      return d >= b.min && d <= b.max;
    }).length;
    return { label: b.label, valor, pct: total ? ((valor / total) * 100).toFixed(1).replace(".", ",") : "0,0" };
  });
}

export function prepararDadosParaMapa(rows) {
  const map = new Map();

  rows.forEach((r) => {
    if (!r.municipio) return;

    const nomeMunicipio = r.municipio.trim();
    
    if (!map.has(nomeMunicipio)) {
      map.set(nomeMunicipio, {
        nome: nomeMunicipio,
        obras: [],
        contagemPrioridades: { 'Alta': 0, 'Média': 0, 'Baixa': 0 },
        totalObras: 0
      });
    }

    const cidadeData = map.get(nomeMunicipio);

    cidadeData.obras.push({
      nomeUnidade: r.nomeUnidade || r.proposta || "Obra sem nome",
      situacao: r.situacao,
      execucaoFisica: r.execucaoFisica || "ND",
      dataPrevisao: r.dataPrevistaConclusao || "ND",

      quemFezContato: r['Quem fez o contato?'] || "Não informado",
      dataContato: r['Data do contato'] || "ND",
      execucaoEnte: r['Execução informada pelo ente (%)'] || "ND",
      conclusaoEnte: r['Data/Previsão de conclusão informada pelo ente'] || "ND",
      inauguracaoEnte: r['Data/Previsão de inauguração informada pelo ente'] || "ND",
    });

    cidadeData.totalObras += 1;

    const pri = r.prioridade;
    if (pri === 'Alta' || pri === 'Média' || pri === 'Baixa') {
      cidadeData.contagemPrioridades[pri] += 1;
    }
  });

  return Array.from(map.values()).map(cidade => {
    let prioridadeGeral = 'Baixa'; 
    if (cidade.contagemPrioridades['Alta'] > 0) {
      prioridadeGeral = 'Alta';
    } else if (cidade.contagemPrioridades['Média'] > 0) {
      prioridadeGeral = 'Média';
    }

    return {
      nome: cidade.nome,
      prioridade: prioridadeGeral,
      obras: cidade.obras,
      totalObras: cidade.totalObras
    };
  });
}