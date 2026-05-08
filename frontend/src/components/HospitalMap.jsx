import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Fix para los iconos de Leaflet en Vite/React
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const RoutingControl = ({ userLocation, targetHospital }) => {
  const map = useMap();

  useEffect(() => {
    if (!userLocation || !targetHospital || !targetHospital.latitud || !targetHospital.longitud) return;

    const targetLat = parseFloat(targetHospital.latitud);
    const targetLng = parseFloat(targetHospital.longitud);

    if (isNaN(targetLat) || isNaN(targetLng)) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(parseFloat(userLocation.lat), parseFloat(userLocation.lng)),
        L.latLng(parseFloat(targetHospital.latitud), parseFloat(targetHospital.longitud))
      ],
      lineOptions: {
        styles: [{ color: '#3b82f6', weight: 6, opacity: 0.8 }] // Azul brillante para la ruta
      },
      show: false, // Ocultar el panel de instrucciones para no tapar el mapa flotante
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      createMarker: () => null, // Evitar duplicar marcadores de inicio/fin si no queremos
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      })
    }).addTo(map);

    return () => {
      if (map && routingControl) {
        map.removeControl(routingControl);
      }
    };
  }, [map, userLocation, targetHospital]);

  return null;
};

// Sub-componente para hacer zoom automático hacia los dos puntos de la ruta
const MapFlyTo = ({ userLocation, targetHospital }) => {
  const map = useMap();

  useEffect(() => {
    if (!userLocation || !targetHospital || !targetHospital.latitud || !targetHospital.longitud) return;

    const targetLat = parseFloat(targetHospital.latitud);
    const targetLng = parseFloat(targetHospital.longitud);
    if (isNaN(targetLat) || isNaN(targetLng)) return;

    const bounds = L.latLngBounds(
      [parseFloat(userLocation.lat), parseFloat(userLocation.lng)],
      [targetLat, targetLng]
    );
    map.flyToBounds(bounds, { padding: [40, 40], duration: 1.2 });
  }, [map, userLocation, targetHospital]);

  return null;
};

const HospitalMap = ({ hospitales = [], userLocation = null, targetHospital = null }) => {
  const defaultCenter = [-1.801, -79.534]; // Babahoyo

  return (
    <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden' }} className="shadow-inner">
      <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RoutingControl userLocation={userLocation} targetHospital={targetHospital} />
        <MapFlyTo userLocation={userLocation} targetHospital={targetHospital} />
        {hospitales.map((h, index) => {
          if (h.latitud && h.longitud) {
            const lat = parseFloat(h.latitud);
            const lng = parseFloat(h.longitud);
            if (!isNaN(lat) && !isNaN(lng)) {
              return (
                <Marker key={index} position={[lat, lng]}>
                  <Popup>
                    <strong>{h.hospital}</strong><br />
                    Especialidad: {h.especialidad}<br />
                    Copago estimado: <strong>${h.copago}</strong>
                  </Popup>
                </Marker>
              );
            }
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
};

export default HospitalMap;
