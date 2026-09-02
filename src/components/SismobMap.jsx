import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { coordenadasMunicipios } from '../utils/coordenadasPE';

const criarIcone = (cor) => L.divIcon({
  className: 'custom-pin',
  html: `<div style="background-color: ${cor}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const SismobMap = ({ dadosObrasAgrupados, onSelectMunicipio }) => {
  const centroPE = [-8.35, -37.95];

  const getCorPrioridade = (prioridade) => {
    if (prioridade === 'Alta') return '#E74C3C'; 
    if (prioridade === 'Média') return '#F1C40F'; 
    return '#2ECC71'; 
  };

  return (
    <MapContainer center={centroPE} zoom={7} style={{ height: '100%', minHeight: '600px', width: '100%', borderRadius: '8px' }}>

    <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {dadosObrasAgrupados.map((municipioData, index) => {
        const coords = coordenadasMunicipios[municipioData.nome];
        if (!coords) return null; 

        const corPino = getCorPrioridade(municipioData.prioridade);

        return (
          <Marker 
            key={index} 
            position={[coords.lat, coords.lng]} 
            icon={criarIcone(corPino)}
            eventHandlers={{
              click: () => {
                if (onSelectMunicipio) {
                  onSelectMunicipio(municipioData);
                }
              },
            }}
          >
            <Popup>
              <div className="popup-customizado" style={{ minWidth: '220px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#E67E22', fontSize: '14px', textTransform: 'uppercase' }}>
                  📍 {municipioData.nome} - PE
                </h4>
                
                <div className="popup-conclusao" style={{ marginBottom: '15px' }}>
                   <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#666' }}>Conclusão média das obras</p>
                   <h2 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#333' }}>DADOS INDISPONÍVEIS</h2>
                   <div style={{ height: '8px', background: '#e0e0e0', borderRadius: '4px' }}></div>
                </div>

                <p className="popup-qtd-obras" style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
                  {municipioData.obras.length} obras no município
                </p>
                
                <ul className="popup-lista-obras" style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '150px', overflowY: 'auto' }}>
                  {municipioData.obras.map((obra, idx) => (
                    <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', borderBottom: '1px solid #f0f0f0', paddingBottom: '4px' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }} title={obra.nomeUnidade}>
                        • {obra.nomeUnidade}
                      </span>
                      <span style={{color: '#999', marginLeft: '10px'}}>ND</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default SismobMap;