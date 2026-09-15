import * as XLSX from 'xlsx';

export const processExcelFile = (file, callback) => {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });

      const nomePrimeiraAba = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[nomePrimeiraAba];

      const jsonDados = XLSX.utils.sheet_to_json(worksheet, { 
        raw: true, 
        defval: ""  
      });

      const extrairAno = (valor) => {
        if (!valor) return "ND";
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
        if (!valor) return "ND";
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
        const num = Number(valor);
        if (!isNaN(num)) {
          const finalNum = num <= 1 && num > 0 ? num * 100 : num;
          return `${Math.round(finalNum)}%`;
        }
        return String(valor);
      };

      const dadosNormalizados = jsonDados.map(row => {
        return {
          ...row,
          diasSemMonitoramento: row['Dias sem monitoramento SISMOB'] || row['Dias sem monitoramento (SISMOB)'] || 0,
          execucaoSismob: formatarExecucao(row['Execução física (%) SISMOB'] || row['Execução física (%) (SISMOB)']),
          anoRepasse: extrairAno(row['Data do repasse'] || row['Data do repasse (ano)']),
          conclusaoSismob: formatarData(row['Data prevista de conclusão SISMOB'] || row['Data prevista de conclusão (SISMOB)']),
          
          quemFezContato: row['Quem fez o contato?'] || 'ND',
          execucaoEnte: row['Execução informada pelo ente (%)'] || 'ND',
          conclusaoEnte: row['Data/Previsão de conclusão informada pelo ente'] || 'ND',
          inauguracaoEnte: row['Data/Previsão de inauguração informada pelo ente'] || 'ND',
          dataContato: row['Data do contato'] || ''
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