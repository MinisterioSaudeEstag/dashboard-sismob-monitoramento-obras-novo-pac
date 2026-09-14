import * as XLSX from 'xlsx';

export const processExcelFile = (file, callback) => {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      const nomePrimeiraAba = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[nomePrimeiraAba];

      const jsonDados = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false, 
        defval: ""  
      });

      const extrairAno = (valor) => {
        if (!valor) return "";
        try {
          const stringVal = String(valor).trim();
          const dataObj = new Date(stringVal);
          if (!isNaN(dataObj.getTime())) {
            return String(dataObj.getFullYear());
          }
          const matchAno = stringVal.match(/\d{4}/);
          return matchAno ? matchAno[0] : stringVal;
        } catch (e) {
          return "";
        }
      };

      const dadosNormalizados = jsonDados.map(row => {
        const dataRepasseBruta = row['Data do repasse'] || row['dataRepasse'] || '';
        
        return {
          ...row,
          diasSemMonitoramento: row['Dias sem monitoramento SISMOB'] || row['Dias sem monitoramento (SISMOB)'] || row['diasSemMonitoramento'] || 0,
          execucaoSismob: row['Execução física (%) SISMOB'] || row['Execução física (%) (SISMOB)'] || row['execucaoSismob'] || '0%',
          anoRepasse: extrairAno(dataRepasseBruta),
          
          quemFezContato: row['Quem fez o contato?'] || row['quemFezContato'] || 'ND',
          execucaoEnte: row['Execução informada pelo ente (%)'] || row['execucaoEnte'] || 'ND',
          conclusaoEnte: row['Data/Previsão de conclusão informada pelo ente'] || row['conclusaoEnte'] || 'ND',
          inauguracaoEnte: row['Data/Previsão de inauguração informada pelo ente'] || row['inauguracaoEnte'] || 'ND'
        };
      });
      
      callback(dadosNormalizados);
    } catch (error) {
      console.error("Erro ao processar a planilha:", error);
      alert("Erro ao ler o arquivo. Verifique se é uma planilha válida.");
    }
  };

  reader.onerror = (error) => {
    console.error("Erro na leitura do arquivo:", error);
  };

  reader.readAsArrayBuffer(file);
};