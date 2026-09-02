# SISMOB — Dashboard de Acompanhamento e Monitoramento de Obras

R�plica interativa do painel de referência, construída em **React (Vite) + JavaScript**, com gráficos via **Recharts**, ícones via **lucide-react** e leitura/exportação de planilhas via **SheetJS (xlsx)**.

## ✨ O que o dashboard tem

- 6 cards de indicadores (Total de propostas, Em execução e conclusão, Em início de execução, Proposta em análise, Concluídas, Média de dias sem monitoramento).
- Gráfico de barras "Propostas por prioridade de contato".
- Gráfico de barras horizontais "Propostas por componente".
- Rosca (donut) "Dias sem monitoramento (SISMOB)".
- Rosca "Propostas por situação" (barra lateral).
- Painel de filtros (Ano de repasse, Município, Prioridade de contato, Situação, Componente) com botão "Limpar filtros".
- Tabela "Acompanhamento das propostas" com "Ver mais/Ver menos" e **botão Exportar CSV**.
- Painel de "Ações pendentes" e "Observações e problemas mais recorrentes", calculado automaticamente a partir dos dados.
- **Importação de planilha** (.xlsx, .xls ou .csv) que atualiza todo o dashboard (KPIs, gráficos, tabela e filtros) automaticamente.

Ao carregar pela primeira vez, o dashboard mostra **dados de exemplo** (sintéticos, calibrados para bater com os números do painel de referência) só para você visualizar o layout. Assim que você importar sua planilha real, esses dados de exemplo são substituídos.

## 🚀 Como rodar

Pré-requisitos: [Node.js](https://nodejs.org) 18+ instalado.

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (geralmente `http://localhost:5173`).

Para gerar uma versão de produção (arquivos estáticos, para hospedar em qualquer servidor):

```bash
npm run build
npm run preview   # opcional, para testar o build localmente
```

## 📄 Como formatar sua planilha

O importador aceita `.xlsx`, `.xls` ou `.csv`. Ele lê a **primeira aba** da planilha e espera colunas com estes cabeçalhos (não precisa respeitar maiúsculas/acentos exatamente — o sistema normaliza automaticamente):

| Cabeçalho esperado | Campo |
|---|---|
| PROPOSTA | Número/código da proposta |
| ANO DE REPASSE | Ano de repasse |
| MUNICÍPIO | Município |
| COMPONENTE | Componente (ex.: Unidade Básica de Saúde I) |
| SITUAÇÃO NO SISMOB | Situação (ex.: Em execução e conclusão, Em início de execução, Proposta em análise, Concluída) |
| PRIORIDADE DE CONTATO | Alta / Média / Baixa |
| DIAS SEM MONITORAMENTO (SISMOB) | Número de dias |
| DATA DO REPASSE (ANO) | Ano |
| EXECUÇÃO FÍSICA (%) (SISMOB) | Número (0 a 100) |
| DATA PREVISTA DE CONCLUSÃO (SISMOB) | Data (texto, ex.: 30/05/2026) |

Dica: a forma mais fácil de manter isso atualizado é manter uma planilha mestre (Excel/Google Sheets) com exatamente essas colunas, exportar como `.xlsx` sempre que atualizar os dados e clicar em **"Importar planilha"** no topo do dashboard.

> Se algum cabeçalho não for reconhecido, aquela coluna simplesmente não será usada; se a coluna PROPOSTA não for encontrada em nenhuma linha, o sistema avisa que não conseguiu ler a planilha.

## 📤 Exportar dados

O botão **"Exportar CSV"**, acima da tabela, gera um `.csv` com as propostas atualmente exibidas (respeitando os filtros aplicados), pronto para abrir no Excel/Google Sheets.

## 🗂 Estrutura do projeto

```
src/
  components/        # Componentes de UI (KPI cards, gráficos, tabela, filtros, etc.)
  data/sampleData.js # Gerador dos dados de exemplo (usado até você importar sua planilha)
  utils/
    aggregate.js      # Cálculo de KPIs e agregações para os gráficos
    spreadsheet.js     # Leitura (import) e exportação (CSV) de planilhas
  theme.js            # Paleta de cores usada no painel
  App.jsx             # Composição do dashboard
  index.css           # Estilos globais (replica visual do painel de referência)
```

## 🎨 Personalizar

- **Cores**: edite `src/theme.js`.
- **Layout/estilo**: edite `src/index.css`.
- **Mapeamento de colunas da planilha**: edite `HEADER_MAP` em `src/utils/spreadsheet.js` caso sua planilha use outros nomes de coluna.
