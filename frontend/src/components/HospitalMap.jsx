import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para los iconos de Leaflet en Vite/React
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// ── Coordenadas estáticas de los hospitales conocidos ──────────────────────────
export const HOSPITAL_COORDS = {
  // Quito
  'Hospital Metropolitano':        { lat: -0.1897,  lng: -78.4843 },
  'Hospital Eugenio Espejo':       { lat: -0.2078,  lng: -78.5001 },
  'Hospital Gral. Martín Icaza':   { lat: -1.7956,  lng: -79.5339 },
  'Hospital de Especialidades Eugenio Espejo': { lat: -0.2078, lng: -78.5001 },
  'Hospital Gral. Pablo Arturo Suárez': { lat: -0.1212, lng: -78.5038 },
  'Clínica San Pablo':             { lat: -0.2060,  lng: -78.4833 },
  'Hospital de los Valles':        { lat: -0.2730,  lng: -78.4500 },

  // Guayaquil
  'Hospital Alcívar':              { lat: -2.1741,  lng: -79.9032 },
  'OmniHospital':                  { lat: -2.1342,  lng: -79.9124 },
  'Hospital Luis Vernaza':         { lat: -2.1951,  lng: -79.8816 },
  'Hospital Clínica Kennedy':      { lat: -2.1569,  lng: -79.9009 },
  'Hospital Universitario':        { lat: -2.2099,  lng: -79.9077 },

  // Babahoyo
  'Hospital IESS Babahoyo':        { lat: -1.8025,  lng: -79.5318 },

  // Cuenca
  'Hospital José Carrasco Arteaga': { lat: -2.9181, lng: -79.0100 },
  'Hospital del Río':              { lat: -2.9061,  lng: -79.0197 },

  // Manta / Costa
  'Hospital General IESS Manta':   { lat: -0.9592,  lng: -80.7197 },

  // Ambato
  'Hospital IESS Ambato':          { lat: -1.2399,  lng: -78.6268 },

  // Loja
  'Hospital Isidro Ayora':         { lat: -3.9955,  lng: -79.2027 },

  // Riobamba
  'Hospital General IESS Riobamba': { lat: -1.6533, lng: -78.6503 },

  // Teodoro Maldonado (IESS Guayaquil)
  'Hosp. Teodoro Maldonado':       { lat: -2.2004,  lng: -79.9042 },
  'Hospital Teodoro Maldonado Carbo': { lat: -2.2004, lng: -79.9042 },
};

// Coordenadas por defecto si el nombre no coincide exactamente (búsqueda parcial)
function findCoords(hospitalName) {
  if (!hospitalName) return null;
  const key = Object.keys(HOSPITAL_COORDS).find(k =>
    hospitalName.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(hospitalName.toLowerCase())
  );
  return key ? HOSPITAL_COORDS[key] : null;
}

// ── Iconos personalizados SVG ──────────────────────────────────────────────────
const createSvgIcon = (color, size = 32) => L.divIcon({
  className: '',
  html: `<svg width="${size}" height="${size}" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C9.373 0 4 5.373 4 12c0 8 12 28 12 28s12-20 12-28C28 5.373 22.627 0 16 0z" fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="16" cy="12" r="5" fill="white" opacity="0.9"/>
  </svg>`,
  iconSize: [size, size * 1.25],
  iconAnchor: [size / 2, size * 1.25],
  popupAnchor: [0, -size * 1.25],
});

const normalIcon   = createSvgIcon('#3b82f6', 30); // azul
const selectedIcon = createSvgIcon('#10b981', 38); // verde esmeralda, más grande

// ── Componente que hace flyTo cuando se selecciona un hospital ─────────────────
const MapFlyTo = ({ targetHospital }) => {
  const map = useMap();
  useEffect(() => {
    if (!targetHospital) return;
    const coords = findCoords(targetHospital.hospital);
    if (coords) {
      map.flyTo([coords.lat, coords.lng], 14, { duration: 1.4 });
    }
  }, [map, targetHospital]);
  return null;
};

// ── Componente principal ───────────────────────────────────────────────────────
const HospitalMap = ({ hospitales = [], userLocation = null, targetHospital = null }) => {
  // Centro de Ecuador
  const ecuadorCenter = [-1.8312, -78.1834];

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={ecuadorCenter}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapFlyTo targetHospital={targetHospital} />

        {/* Marcador de ubicación del usuario */}
        {userLocation && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={L.divIcon({
                className: '',
                html: `<div style="width:18px;height:18px;background:#f59e0b;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(245,158,11,0.8)"></div>`,
                iconSize: [18, 18],
                iconAnchor: [9, 9],
              })}
            >
              <Popup>📍 Tu ubicación</Popup>
            </Marker>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={800}
              pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.1, weight: 1 }}
            />
          </>
        )}

        {/* Marcadores de hospitales */}
        {hospitales.map((h, index) => {
          const coords = findCoords(h.hospital);
          if (!coords) return null;
          const isSelected = targetHospital && targetHospital.hospital === h.hospital;
          const copagoPct = Math.round((1 - h.cobertura) * (h.costoBase || 0));

          return (
            <Marker
              key={index}
              position={[coords.lat, coords.lng]}
              icon={isSelected ? selectedIcon : normalIcon}
              zIndexOffset={isSelected ? 1000 : 0}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong style={{ color: isSelected ? '#10b981' : '#3b82f6' }}>
                    {isSelected ? '✅ ' : '🏥 '}{h.hospital}
                  </strong>
                  <br />
                  <span style={{ fontSize: 12, color: '#64748b' }}>{h.especialidad}</span>
                  <br />
                  <span>Plan: <strong>{h.plan}</strong></span>
                  <br />
                  <span>Cobertura: <strong>{Math.round(h.cobertura * 100)}%</strong></span>
                  <br />
                  <span>Copago estimado: <strong style={{ color: '#10b981' }}>${copagoPct}</strong></span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default HospitalMap;
