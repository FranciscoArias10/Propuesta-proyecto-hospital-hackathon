import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L from 'leaflet';
import 'leaflet-routing-machine';

// Fix para los iconos de Leaflet en Vite/React
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl      from 'leaflet/dist/images/marker-icon.png';
import shadowUrl    from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// ── Iconos SVG personalizados ──────────────────────────────────────────────────
const createSvgIcon = (color, size = 30) => L.divIcon({
  className: '',
  html: `<svg width="${size}" height="${size * 1.3}" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/></filter>
    <path d="M16 1C8.82 1 3 6.82 3 14c0 9.5 13 27 13 27s13-17.5 13-27C29 6.82 23.18 1 16 1z"
          fill="${color}" stroke="white" stroke-width="2" filter="url(#shadow)"/>
    <circle cx="16" cy="14" r="5.5" fill="white" opacity="0.95"/>
    <text x="16" y="18" text-anchor="middle" font-size="7" fill="${color}" font-weight="bold">H</text>
  </svg>`,
  iconSize:    [size, size * 1.3],
  iconAnchor:  [size / 2, size * 1.3],
  popupAnchor: [0, -size * 1.3],
});

const normalIcon   = createSvgIcon('#3b82f6', 30);
const selectedIcon = createSvgIcon('#10b981', 38);

const userIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:20px;height:20px;
    background:#f59e0b;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 0 0 4px rgba(245,158,11,0.35), 0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize:   [20, 20],
  iconAnchor: [10, 10],
});

// ── FlyTo cuando se selecciona un hospital ────────────────────────────────────
const MapFlyTo = ({ targetHospital }) => {
  const map = useMap();
  useEffect(() => {
    if (!targetHospital?.latitud || !targetHospital?.longitud) return;
    map.flyTo([targetHospital.latitud, targetHospital.longitud], 14, { duration: 1.4 });
  }, [map, targetHospital]);
  return null;
};

// ── Routing: dibuja la ruta de usuario → hospital seleccionado ────────────────
const RoutingControl = ({ userLocation, targetHospital }) => {
  const map = useMap();
  const routingRef = useRef(null);

  useEffect(() => {
    // Limpiar ruta anterior
    if (routingRef.current) {
      try { map.removeControl(routingRef.current); } catch (_) {}
      routingRef.current = null;
    }

    // Necesitamos ambos puntos
    if (!userLocation || !targetHospital?.latitud || !targetHospital?.longitud) return;

    const origin = L.latLng(userLocation.lat, userLocation.lng);
    const dest   = L.latLng(targetHospital.latitud, targetHospital.longitud);

    const control = L.Routing.control({
      waypoints: [origin, dest],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false, // Oculta el panel de instrucciones de texto
      lineOptions: {
        styles: [
          { color: '#10b981', opacity: 0.15, weight: 10 }, // halo verde suave
          { color: '#10b981', opacity: 0.9,  weight: 4  }, // línea verde
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      createMarker: () => null, // No crear marcadores extra (ya los tenemos)
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving',
      }),
    });

    control.on('routesfound', (e) => {
      const dist = (e.routes[0].summary.totalDistance / 1000).toFixed(1);
      const mins = Math.round(e.routes[0].summary.totalTime / 60);
      console.log(`[RUTA] ${dist} km · ~${mins} min`);
    });

    control.on('routingerror', (e) => {
      console.warn('[RUTA] Error de routing:', e.error?.message || e);
    });

    control.addTo(map);
    routingRef.current = control;

    // Cleanup al desmontar
    return () => {
      try { map.removeControl(control); } catch (_) {}
    };
  }, [map, userLocation, targetHospital]);

  return null;
};

// ── Componente principal ───────────────────────────────────────────────────────
const HospitalMap = ({ hospitales = [], userLocation = null, targetHospital = null }) => {
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

        {/* Volar al hospital seleccionado */}
        <MapFlyTo targetHospital={targetHospital} />

        {/* Trazar ruta de usuario al hospital seleccionado */}
        <RoutingControl userLocation={userLocation} targetHospital={targetHospital} />

        {/* Marcador del usuario */}
        {userLocation && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userIcon}
            >
              <Popup>📍 <strong>Tu ubicación</strong></Popup>
            </Marker>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={600}
              pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.08, weight: 1.5, dashArray: '6,4' }}
            />
          </>
        )}

        {/* Marcadores de hospitales — usan las coordenadas reales de Supabase */}
        {hospitales.map((h, index) => {
          // Usar coordenadas de Supabase directamente
          const lat = parseFloat(h.latitud);
          const lng = parseFloat(h.longitud);
          if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

          const isSelected = targetHospital && targetHospital.hospital === h.hospital;
          const copago = h.copago ?? Math.round((1 - h.cobertura) * (h.costoBase || 0));

          return (
            <Marker
              key={`${h.hospital}-${index}`}
              position={[lat, lng]}
              icon={isSelected ? selectedIcon : normalIcon}
              zIndexOffset={isSelected ? 1000 : 0}
            >
              <Popup>
                <div style={{ minWidth: 170, fontFamily: 'system-ui, sans-serif' }}>
                  <div style={{ fontWeight: 700, color: isSelected ? '#10b981' : '#3b82f6', marginBottom: 4 }}>
                    {isSelected ? '✅ ' : '🏥 '}{h.hospital}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{h.especialidad} · {h.ciudad}</div>
                  <div style={{ fontSize: 13 }}>
                    Plan: <strong>{h.plan}</strong>
                  </div>
                  <div style={{ fontSize: 13 }}>
                    Cobertura: <strong style={{ color: '#10b981' }}>{Math.round(h.cobertura * 100)}%</strong>
                  </div>
                  <div style={{ fontSize: 13 }}>
                    Copago: <strong style={{ color: copago === 0 ? '#10b981' : '#f59e0b' }}>${copago}</strong>
                  </div>
                  {h.tiempoEspera && (
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      ⏱ Espera: {h.tiempoEspera}
                    </div>
                  )}
                  {isSelected && userLocation && (
                    <div style={{ marginTop: 6, fontSize: 11, color: '#10b981', fontStyle: 'italic' }}>
                      🗺 Ruta trazada en el mapa
                    </div>
                  )}
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
