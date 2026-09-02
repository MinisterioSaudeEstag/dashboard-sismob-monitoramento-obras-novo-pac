import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function DonutCard({ title, data, colors, centerLabel, size = 200, legendCols = 1 }) {
  const total = data.reduce((acc, d) => acc + d.valor, 0);

  return (
    <div className="chart-card donut-card">
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="donut-content" style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
        
        <div className="donut-chart-wrap" style={{ width: size, height: size, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="valor"
                nameKey="label"
                innerRadius="62%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                stroke="#fff"
                strokeWidth={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.label} fill={colors[entry.label] || "#ccc"} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <span className="donut-center-value" style={{ display: 'block', fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{total}</span>
            <span className="donut-center-label" style={{ display: 'block', fontSize: '11px', color: '#666', lineHeight: '1.2' }}>{centerLabel}</span>
          </div>
        </div>

        <ul className={`donut-legend legend-cols-${legendCols}`} style={{ listStyle: 'none', padding: 0, margin: 0, minWidth: '150px' }}>
          {data.map((d) => (
            <li key={d.label} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px', gap: '8px' }}>
              
              <span className="legend-dot" style={{ backgroundColor: colors[d.label] || "#ccc", minWidth: '12px', height: '12px', borderRadius: '50%', display: 'inline-block', marginTop: '2px' }} />
              
              <span className="legend-text" style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="legend-label" style={{ fontSize: '12px', color: '#444', fontWeight: 500, lineHeight: '1.2' }}>
                  {d.label}
                </span>
                <span className="legend-value" style={{ fontSize: '11px', color: '#888', marginTop: '3px' }}>
                  {d.pct}% ({d.valor})
                </span>
              </span>

            </li>
          ))}
        </ul>
        
      </div>
    </div>
  );
}