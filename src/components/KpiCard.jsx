export default function KpiCard({ icon, label, value, sublabel, big }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-body">
        <span className="kpi-icon" aria-hidden="true">
          {icon}
        </span>
        <div className="kpi-value-col">
          <span className={big ? "kpi-value kpi-value-big" : "kpi-value"}>{value}</span>
          {sublabel && <span className="kpi-sublabel">{sublabel}</span>}
        </div>
      </div>
    </div>
  );
}
