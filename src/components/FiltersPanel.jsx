import { Filter, Calendar, MapPin, Flag, ClipboardList, Boxes, RotateCcw, Clock, Building } from "lucide-react";

const DEFAULT_FILTERS = {
  anoRepasse: "Todos",
  municipio: "Todos",
  prioridade: "Todos",
  situacao: "Todos",
  componente: "Todos",
  diasMonitoramento: "Todos",
  porteObra: "Todos",
};

function Select({ icon, label, value, options, onChange }) {
  return (
    <div className="filter-field">
      <label>{label}</label>
      <div className="select-wrap">
        <span className="select-icon">{icon}</span>
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          <option>Todos</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function FiltersPanel({ filters, setFilters, options, anos, modo = "geral" }) {
  const update = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="filters-card">
      <div className="filters-header">
        <Filter size={18} strokeWidth={2.4} />
        <span>FILTROS</span>
      </div>

      {modo === "geral" && (
       <>
          <Select 
            icon={<Calendar size={16} />} 
            label="Ano de repasse" 
            value={filters.anoRepasse} 
            options={anos || []} 
            onChange={update("anoRepasse")} 
          />
          <Select 
            icon={<MapPin size={16} />} 
            label="Município" 
            value={filters.municipio} 
            options={options?.municipios || []} 
            onChange={update("municipio")} 
          />
        </>
      )}

      <Select 
        icon={<Flag size={16} />} 
        label="Prioridade de contato" 
        value={filters.prioridade} 
        options={options?.prioridades || []} 
        onChange={update("prioridade")} 
      />
      <Select 
        icon={<ClipboardList size={16} />} 
        label="Situação" 
        value={filters.situacao} 
        options={options?.situacoes || []} 
        onChange={update("situacao")} 
      />
      <Select 
        icon={<Boxes size={16} />} 
        label="Componente" 
        value={filters.componente} 
        options={options?.componentes || []} 
        onChange={update("componente")} 
      />

      {modo === "mapa" && (
       <>
          <Select 
            icon={<Clock size={16} />} 
            label="Dias sem monitoramento" 
            value={filters.diasMonitoramento} 
            options={["Até 30 dias", "31 a 60 dias", "Mais de 60 dias"]} 
            onChange={update("diasMonitoramento")} 
          />
          <Select 
            icon={<Building size={16} />} 
            label="Porte da Obra" 
            value={filters.porteObra} 
            options={options?.portes || []} 
            onChange={update("porteObra")} 
          />
        </>
      )}

      <button className="btn-clear" onClick={() => setFilters(DEFAULT_FILTERS)}>
        <RotateCcw size={16} />
        LIMPAR FILTROS
      </button>
    </div>
  );
}

export { DEFAULT_FILTERS };