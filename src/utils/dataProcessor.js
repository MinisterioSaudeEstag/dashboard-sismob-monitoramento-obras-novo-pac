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
      
      callback(jsonDados);
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