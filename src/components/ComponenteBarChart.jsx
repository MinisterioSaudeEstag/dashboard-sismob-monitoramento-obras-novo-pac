import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Tooltip } from "recharts";
import { COLORS } from "../theme";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#fff', border: '1px solid #eee', padding: '10px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', fontSize: '12px' }}>
        <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#333' }}>{payload[0].payload.label}</p>
        <p style={{ margin: 0, color: '#666' }}>Quantidade: <strong style={{color: COLORS.orange || '#F7941D'}}>{payload[0].value}</strong></p>
      </div>
    );
  }
  return null;
};

export default function ComponenteBarChart({ data }) {
  const sorted = [...data].sort((a, b) => b.valor - a.valor).filter(d => d.valor > 0);
  
  const maxVal = Math.max(...sorted.map((d) => d.valor), 10);
  const niceMax = Math.ceil((maxVal * 1.2)); 

  const formatYAxis = (tickItem) => {
    if (tickItem.length > 22) {
      return tickItem.substring(0, 20) + "...";
    }
    return tickItem;
  };

  return (
    <div className="chart-card">
      <h3 className="chart-title">Propostas por componente</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 10, right: 40, left: 0, bottom: 0 }} 
        >
          <Tooltip cursor={{fill: '#f9f9f9'}} content={<CustomTooltip />} />
          
          <XAxis type="number" domain={[0, niceMax]} hide={true} />
          
          <YAxis
            dataKey="label"
            type="category"
            width={140} 
            tickLine={false}
            axisLine={false} 
            tick={{ fill: "#555", fontSize: 11 }}
            tickFormatter={formatYAxis}
          />
          
          <Bar dataKey="valor" fill={COLORS.orange || "#F7941D"} radius={[0, 4, 4, 0]} barSize={16}>
            <LabelList dataKey="valor" position="right" style={{ fill: "#333", fontWeight: 700, fontSize: 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}