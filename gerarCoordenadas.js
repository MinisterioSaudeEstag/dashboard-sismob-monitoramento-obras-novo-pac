process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import fs from 'fs';

async function gerarCoordenadas() {
  try {
    console.log("Buscando lista de coordenadas dos municípios...");
    
    // O fetch nativo do Node.js é muito mais estável
    const resposta = await fetch('https://raw.githubusercontent.com/kelvins/Municipios-Brasileiros/main/json/municipios.json');
    
    if (!resposta.ok) {
        throw new Error(`Falha no download: ${resposta.status}`);
    }

    // Já converte o download inteiro em JSON de forma segura
    const todosMunicipios = await resposta.json();
    
    // Filtra apenas Pernambuco (código UF: 26)
    const cidadesPE = todosMunicipios.filter(m => m.codigo_uf === 26);
    
    let coordsDict = {};
    cidadesPE.forEach(cidade => {
        coordsDict[cidade.nome] = { lat: cidade.latitude, lng: cidade.longitude };
    });

    const conteudoJS = `export const coordenadasMunicipios = ${JSON.stringify(coordsDict, null, 2)};\n`;
    
    if (!fs.existsSync('./src/utils')){
        fs.mkdirSync('./src/utils', { recursive: true });
    }

    fs.writeFileSync('./src/utils/coordenadasPE.js', conteudoJS);
    console.log("✅ Sucesso Absoluto! O arquivo src/utils/coordenadasPE.js foi gerado.");
    
  } catch (erro) {
    console.error("❌ Erro ao gerar coordenadas:", erro.message);
  }
}

gerarCoordenadas();