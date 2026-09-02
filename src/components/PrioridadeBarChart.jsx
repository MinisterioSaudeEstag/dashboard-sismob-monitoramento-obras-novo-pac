import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, Cell } from "recharts";
import { PRIORIDADE_COLORS } from "../theme";

export default function PrioridadeBarChart({ data }) {
  return (
    <div className="chart-card">
      <h3 className="chart-title">Propostas por prioridade de contato</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 24, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid vertical={false} stroke="#EEE" />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#DDD" }} tick={{ fill: "#555", fontSize: 13 }} />
          <YAxis
            tickLine={false}
            axisLine={{ stroke: "#DDD" }}
            tick={{ fill: "#555", fontSize: 12 }}
            label={{ value: "Quantidade de propostas", angle: -90, position: "insideLeft", fill: "#666", fontSize: 12 }}
          />
          <Bar dataKey="valor" radius={[3, 3, 0, 0]} maxBarSize={90}>
            {data.map((entry) => (
              <Cell key={entry.label} fill={PRIORIDADE_COLORS[entry.label] || "#F7941D"} />
            ))}
            <LabelList dataKey="valor" position="top" style={{ fill: "#333", fontWeight: 700, fontSize: 14 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
