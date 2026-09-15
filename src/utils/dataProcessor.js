import * as XLSX from 'xlsx';

export const processExcelFile = (file, callback) => {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { 
        type: 'array', 
        cellDates: true,
        cellStyles: true,
        cellFormula: false 
      });

      const nomePrimeiraAba = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[nomePrimeiraAba];

      const jsonDados = XLSX.utils.sheet_to_json(worksheet, { 
        raw: true, 
        defval: ""  
      });

      const getVal = (row, keywords) => {
        const chaves = Object.keys(row);
        for (let chave of chaves) {
          const chaveLimpa = chave.trim().toLowerCase();
          for (let keyword of keywords) {
            if (chaveLimpa.includes(keyword.trim().toLowerCase())) {
              return row[chave] !== "" ? row[chave] : undefined;
            }
          }
        }
        return undefined;
      };

      const extrairAno = (valor) => {
        if (valor === undefined || valor === null || valor === "") return "ND";
        if (valor instanceof Date) return String(valor.getFullYear());
        
        if (typeof valor === 'number' || !isNaN(Number(valor))) {
          const num = Number(valor);
          if (num > 10000) { 
            const dataBase = new Date(1899, 11, 30);
            dataBase.setDate(dataBase.getDate() + Math.floor(num));
            return String(dataBase.getFullYear());
          }
        }
        const str = String(valor).trim();
        const matchAno = str.match(/\d{4}/);
        return matchAno ? matchAno[0] : "ND";
      };

      const formatarData = (valor) => {
        if (valor === undefined || valor === null || valor === "") return "ND";
        if (valor instanceof Date) return valor.toLocaleDateString('pt-BR');
        
        if (typeof valor === 'number' || !isNaN(Number(valor))) {
          const num = Number(valor);
          if (num > 10000) {
            const dataBase = new Date(1899, 11, 30);
            dataBase.setDate(dataBase.getDate() + Math.floor(num));
            return dataBase.toLocaleDateString('pt-BR');
          }
        }
        const str = String(valor).trim();
        const dataObj = new Date(str);
        if (!isNaN(dataObj.getTime())) return dataObj.toLocaleDateString('pt-BR');
        return str;
      };

      const formatarExecucao = (valor) => {
        if (valor === undefined || valor === null || valor === "") return "0%";
        const strVal = String(valor).trim();
        if (strVal.includes('%')) return strVal;
        
        const num = Number(valor);
        if (!isNaN(num)) {
          const finalNum = (num > 0 && num <= 1) ? num * 100 : num;
          return `${Math.round(finalNum)}%`;
        }
        return "0%";
      };

      const dadosNormalizados = jsonDados.map(row => {
        
        const diasRaw = getVal(row, ['dias sem monitoramento sismob']);
        const execSismobRaw = getVal(row, ['execução física (%) sismob']);
        const dataRepasseRaw = getVal(row, ['data do repasse']);
        const conclusaoSismobRaw = getVal(row, ['data prevista de conclusão sismob']);

        return {
          ...row,
          proposta: getVal(row, ['proposta']),
          municipio: getVal(row, ['município', 'municipio']),
          componente: getVal(row, ['componente']),
          situacao: getVal(row, ['situação no sismob']),
          prioridade: getVal(row, ['prioridade de contato']),
          porte: getVal(row, ['porte']),

          diasSemMonitoramento: diasRaw !== undefined ? diasRaw : 0,
          execucaoSismob: formatarExecucao(execSismobRaw),
          anoRepasse: extrairAno(dataRepasseRaw),
          conclusaoSismob: formatarData(conclusaoSismobRaw),
          
          quemFezContato: getVal(row, ['quem fez o contato']) || 'ND',
          execucaoEnte: getVal(row, ['execução informada pelo ente']) || 'ND',
          conclusaoEnte: getVal(row, ['previsão de conclusão informada']) || 'ND',
          inauguracaoEnte: getVal(row, ['previsão de inauguração informada']) || 'ND',
          dataContato: getVal(row, ['data do contato']) || ''
        };
      });
      
      callback(dadosNormalizados);
    } catch (error) {
      console.error("Erro ao processar a planilha:", error);
      alert("Erro ao ler o arquivo.");
    }
  };

  reader.readAsArrayBuffer(file);
};