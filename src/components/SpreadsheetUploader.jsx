import { useRef, useState } from "react";
import { UploadCloud, CheckCircle2, XCircle, Clock } from "lucide-react";
import { parseSpreadsheetFile } from "../utils/spreadsheet";

export default function SpreadsheetUploader({ onDataLoaded }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [dataAtualizacao, setDataAtualizacao] = useState(null);

  async function handleFile(file) {
    if (!file) return;
    setLoading(true);
    setStatus(null);
    try {
      const rows = await parseSpreadsheetFile(file, "ISO-8859-1");
      onDataLoaded(rows);
      
      const agora = new Date();
      const dataFormatada = `${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      setDataAtualizacao(dataFormatada);

      setStatus({ type: "success", message: `${rows.length} propostas importadas.` });
      
      setTimeout(() => setStatus(null), 4000);
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Erro ao ler a planilha." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
      
      {dataAtualizacao && (
        <div style={{ 
          display: 'flex', flexDirection: 'column', 
          border: '1px solid #F7941D', borderRadius: '8px', 
          padding: '6px 15px', backgroundColor: '#fff',
          minWidth: '140px'
        }}>
          <span style={{ fontSize: '11px', color: '#666' }}>Última atualização</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#333', fontWeight: '600', fontSize: '13px' }}>
            <Clock size={14} color="#F7941D" />
            {dataAtualizacao}
          </div>
        </div>
      )}

      <div className="uploader" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button 
          className="btn-upload" 
          onClick={() => inputRef.current?.click()} 
          disabled={loading}
          style={{
            backgroundColor: '#F7941D', color: '#fff', border: 'none', 
            padding: '11px 20px', borderRadius: '8px', fontWeight: '600', 
            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(247, 148, 29, 0.2)',
            transition: 'background 0.3s'
          }}
        >
          <UploadCloud size={18} />
          {loading ? "Importando..." : "Importar planilha"}
        </button>
        
        {status && (
          <span style={{ 
            fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', 
            color: status.type === 'success' ? '#2CA02C' : '#D62728',
            fontWeight: '600'
          }}>
            {status.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {status.message}
          </span>
        )}
      </div>
      
    </div>
  );
}