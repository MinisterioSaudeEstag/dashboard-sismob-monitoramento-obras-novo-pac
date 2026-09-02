import { ClipboardEdit, AlertTriangle } from "lucide-react";

export default function ActionsPanel({ acoes, observacoes }) {
  return (
    <div className="actions-card">
      <div className="actions-header">
        <ClipboardEdit size={17} />
        <span>Ações pendentes</span>
      </div>
      <ul className="acoes-list">
        {acoes.map((a) => (
          <li key={a.label}>
            <span className="acoes-count">{a.count}</span>
            <span>{a.label}</span>
          </li>
        ))}
      </ul>

      <div className="observacoes-block">
        <div className="observacoes-header">
          <span>Observações e problemas mais recorrentes</span>
          <AlertTriangle size={18} className="alert-icon" />
        </div>
        <ul className="observacoes-list">
          {observacoes.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
