import React from "react";
import { Download } from "lucide-react";

export default function ProposalsTable({ rows }) {
  const handleExportCSV = () => {
    if (!rows || rows.length === 0) return;
    const headers = [
      "PROPOSTA", "MUNICÍPIO", "DIAS SEM MONITORAMENTO (SISMOB)", 
      "DATA DO REPASSE (ANO)", "EXECUÇÃO FÍSICA (%) (SISMOB)", "DATA PREVISTA DE CONCLUSÃO (SISMOB)"
    ];
    const csvRows = [headers.join(",")];
    rows.forEach(row => {
      const csvRow = [
        row.proposta || row.Proposta || "ND",
        row.municipio || row.Município || "ND",
        row.diasSemMonitoramento,
        row.anoRepasse,
        row.execucaoSismob,
        row.conclusaoSismob
      ];
      csvRows.push(csvRow.join(","));
    });
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "acompanhamento_propostas_sismob.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="table-container" style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #eee' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>Acompanhamento das propostas</h3>
        <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid #E67E22', color: '#E67E22', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f7941d', color: '#fff' }}>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>PROPOSTA / MUNICÍPIO</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>DIAS SEM MONITORAMENTO (SISMOB)</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>DATA DO REPASSE (ANO)</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>EXECUÇÃO FÍSICA (%) (SISMOB)</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>DATA PREVISTA DE CONCLUSÃO (SISMOB)</th>
            </tr>
          </thead>
          <tbody>
            {(!rows || rows.length === 0) ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                  Nenhum dado encontrado.
                </td>
              </tr>
            ) : (
              rows.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <strong style={{ display: 'block', color: '#004b87' }}>{item.proposta || item.Proposta || 'ND'}</strong>
                    <span style={{ color: '#666', fontSize: '12px' }}>{item.municipio || item.Município || 'ND'}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#444' }}>
                    {item.diasSemMonitoramento}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#444' }}>
                    {item.anoRepasse}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: '#FFF3E0', color: '#E67E22', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                      {item.execucaoSismob}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#444' }}>
                    {item.conclusaoSismob}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}