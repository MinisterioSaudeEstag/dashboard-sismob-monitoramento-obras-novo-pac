import { useRef, useState } from "react";
import { UploadCloud, CheckCircle2, XCircle } from "lucide-react";
import { parseSpreadsheetFile } from "../utils/spreadsheet";

export default function SpreadsheetUploader({ onDataLoaded }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message }
  const [loading, setLoading] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    setLoading(true);
    setStatus(null);
    try {
      const rows = await parseSpreadsheetFile(file);
      onDataLoaded(rows);
      setStatus({ type: "success", message: `${rows.length} propostas importadas de "${file.name}".` });
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Não foi possível ler a planilha." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="uploader">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button className="btn-upload" onClick={() => inputRef.current?.click()} disabled={loading}>
        <UploadCloud size={16} />
        {loading ? "Importando..." : "Importar planilha"}
      </button>
      {status && (
        <span className={`upload-status upload-status-${status.type}`}>
          {status.type === "success" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          {status.message}
        </span>
      )}
    </div>
  );
}
