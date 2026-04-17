import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, LayerGroup, LayersControl } from 'react-leaflet';
import { Eye, EyeOff, Anchor, Home as HomeIcon, Waves } from 'lucide-react';
import MapAttributionController from '@/components/shared/MapAttributionController';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/lib/CurrencyContext';
import { useLanguage } from '@/lib/LanguageContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
});

// Grønlandske by-koordinater
const LOCATIONS = {
  'Nuuk': [64.175, -51.739],
  'Ilulissat': [69.218, -51.098],
  'Sisimiut': [66.940, -53.673],
  'Disko Bay': [69.5, -52.5],
  'Kangerlussuaq': [66.996, -50.621],
  'Tasiilaq': [65.614, -37.636],
  'Upernavik': [72.786, -56.148],
  'Qaqortoq': [60.716, -46.034],
  'Narsaq': [60.912, -46.059]
};

// Cabin icon — blue house pin
const createCabinIcon = () => new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Departure icon — teal anchor circle
const createDepartureIcon = () => {
  const svg = `<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="17" fill="#1a5276" stroke="white" stroke-width="2"/>
    <text x="18" y="24" text-anchor="middle" font-size="16" fill="white">⚓</text>
  </svg>`;
  return new L.DivIcon({
    html: svg,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

// Destination icon — green flag circle
const createDestinationIcon = () => {
  const svg = `<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="17" fill="#1e8449" stroke="white" stroke-width="2"/>
    <text x="18" y="24" text-anchor="middle" font-size="16" fill="white">🏁</text>
  </svg>`;
  return new L.DivIcon({
    html: svg,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

// Boat icon for route start
const createBoatIcon = () => {
  const svg = `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="13" fill="#0077be" stroke="white" stroke-width="2"/>
    <path d="M 14 8 L 18 16 L 10 16 Z" fill="white"/>
    <circle cx="14" cy="18" r="1.5" fill="white"/>
  </svg>`;
  return new L.DivIcon({
    html: svg,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -15],
  });
};

// Beregn kontrolpunkt for kurve (offset mod vest over vandet)
const calculateControlPoint = (from, to) => {
  if (!from || !to) return null;
  const [lat1, lon1] = from;
  const [lat2, lon2] = to;
  
  // Midtpunkt
  const midLat = (lat1 + lat2) / 2;
  const midLon = (lon1 + lon2) / 2;
  
  // Beregn retning af rutelinje
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  
  // Vinkelret vektor (roteret 90 grader) — offset mod vest
  const perpLat = -dLon;
  const perpLon = dLat;
  
  // Normaliser og skalér (offset-størrelse justeres her)
  const len = Math.sqrt(perpLat * perpLat + perpLon * perpLon);
  const offsetFactor = 1.5; // Justér for større/mindre kurve
  const scale = (len > 0) ? (offsetFactor / len) : 0;
  
  return [midLat + perpLat * scale, midLon + perpLon * scale];
};

const CabinPopup = ({ cabin }) => {
  const [imageError, setImageError] = React.useState(false);
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const image = cabin.images?.[0];

  return (
    <div className="text-sm w-48">
      {image && !imageError &&
      <img
        src={image}
        alt=""
        className="w-full h-32 object-cover rounded-lg mb-2"
        onError={() => setImageError(true)} />
      }
      <p className="font-bold text-foreground">{cabin.title}</p>
      <p className="text-muted-foreground text-xs mb-2">{cabin.location}</p>
      <p className="font-semibold text-primary">{formatPrice(cabin.price_per_night)}{t('map_per_night')}</p>
      <a href={`/cabins/${cabin.id}`} className="text-primary text-xs mt-2 font-semibold hover:underline block">
        {t('map_see_details')}
      </a>
    </div>);
};

const TransportHubPopup = ({ location, transports, type = 'departure' }) => {
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const count = transports.length;
  const avgPrice = transports.length > 0
    ? Math.round(transports.reduce((s, tr) => s + (tr.round_trip_price || 0), 0) / count)
    : 0;

  const isDeparture = type === 'departure';
  const label = isDeparture ? t('map_departure_port') : t('map_destination_label');
  const icon = isDeparture ? '⚓' : '🏁';
  const linkParam = isDeparture ? `from=${encodeURIComponent(location)}` : `to=${encodeURIComponent(location)}`;

  return (
    <div className="text-sm w-48">
      <p className="font-bold text-foreground flex items-center gap-1.5">
        <span>{icon}</span> {location}
      </p>
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <p className="text-muted-foreground text-xs mb-2">{count} {t('map_routes_available')}</p>
      {avgPrice > 0 && (
        <p className="text-primary font-semibold text-xs">{t('map_avg_roundtrip')}: {formatPrice(avgPrice)}</p>
      )}
      <a href={`/transport?${linkParam}`} className="text-primary text-xs mt-2 font-semibold hover:underline block">
        {t('map_see_all_routes')}
      </a>
    </div>
  );
};

/**
 * Forbedret Grønlands-kort med lag-filtrering
 * Props:
 *   cabins?: array      — hytter
 *   transports?: array  — sejlture
 *   height?: string     — kort-højde
 */
export default function ImprovedGreenlandMap({ cabins = [], transports = [], height = '500px' }) {
  const { t } = useLanguage();
  const [layers, setLayers] = React.useState({
    cabins: true,
    departures: true,
    destinations: true,
    routes: true,
  });

  const cabinPins = useMemo(() => {
    if (!layers.cabins) return [];
    return (cabins || [])
      .filter((c) => c && c.id && c.location)
      .map((c) => ({ ...c, coords: LOCATIONS[c.location] }))
      .filter((c) => c.coords);
  }, [cabins, layers.cabins]);

  // Afgangshavne (fra)
  const departurePins = useMemo(() => {
    if (!layers.departures) return [];
    const hubs = {};
    (transports || []).forEach((t) => {
      if (!t.from_location) return;
      if (!hubs[t.from_location]) hubs[t.from_location] = [];
      hubs[t.from_location].push(t);
    });
    return Object.entries(hubs)
      .map(([location, ts]) => ({ location, transports: ts, coords: LOCATIONS[location] }))
      .filter((p) => p.coords);
  }, [transports, layers.departures]);

  // Destinationer (til)
  const destinationPins = useMemo(() => {
    if (!layers.destinations) return [];
    const hubs = {};
    (transports || []).forEach((t) => {
      if (!t.to_location) return;
      // Don't duplicate if also a departure hub
      if (!hubs[t.to_location]) hubs[t.to_location] = [];
      hubs[t.to_location].push(t);
    });
    // Exclude locations that are already departure pins
    const departureLocations = new Set(departurePins.map((p) => p.location));
    return Object.entries(hubs)
      .filter(([loc]) => !departureLocations.has(loc))
      .map(([location, ts]) => ({ location, transports: ts, coords: LOCATIONS[location] }))
      .filter((p) => p.coords);
  }, [transports, layers.destinations, departurePins]);

  // Transportruter med kurver
  const routeCurves = useMemo(() => {
    if (!layers.routes) return [];
    return (transports || [])
      .filter((t) => t.from_location && t.to_location && LOCATIONS[t.from_location] && LOCATIONS[t.to_location])
      .map((transport) => {
        const from = LOCATIONS[transport.from_location];
        const to = LOCATIONS[transport.to_location];
        const controlPoint = calculateControlPoint(from, to);
        return { transport, from, to, controlPoint };
      });
  }, [transports, layers.routes]);

  const showTransportLegend = departurePins.length > 0 || destinationPins.length > 0;

  return (
    <div className="space-y-3">
      {/* Lag-toggle og legende */}
      {(cabins.length > 0 || transports.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {cabins.length > 0 && (
            <button
              onClick={() => setLayers((p) => ({ ...p, cabins: !p.cabins }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                layers.cabins ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-border'
              }`}
            >
              <HomeIcon className="w-3.5 h-3.5" />
              {t('map_cabins')} {cabinPins.length > 0 && `(${cabinPins.length})`}
            </button>
          )}
          {transports.length > 0 && (
            <>
              <button
                onClick={() => setLayers((p) => ({ ...p, routes: !p.routes }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  layers.routes ? 'text-white border-transparent' : 'bg-white text-muted-foreground border-border'
                }`}
                style={layers.routes ? { backgroundColor: '#0077be' } : {}}
              >
                <Waves className="w-3.5 h-3.5" />
                Ruter {routeCurves.length > 0 && `(${routeCurves.length})`}
              </button>
              <button
                onClick={() => setLayers((p) => ({ ...p, departures: !p.departures }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  layers.departures ? 'text-white border-transparent' : 'bg-white text-muted-foreground border-border'
                }`}
                style={layers.departures ? { backgroundColor: '#1a5276' } : {}}
              >
                <span>⚓</span>
                {t('map_departures')} {departurePins.length > 0 && `(${departurePins.length})`}
              </button>
              <button
                onClick={() => setLayers((p) => ({ ...p, destinations: !p.destinations }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  layers.destinations ? 'text-white border-transparent' : 'bg-white text-muted-foreground border-border'
                }`}
                style={layers.destinations ? { backgroundColor: '#1e8449' } : {}}
              >
                <span>🏁</span>
                {t('map_destinations')} {destinationPins.length > 0 && `(${destinationPins.length})`}
              </button>
            </>
          )}
        </div>
      )}

      {/* Kort */}
      <div style={{ height }} className="rounded-2xl overflow-hidden border border-border shadow-card">
        <MapContainer
          center={[68, -50]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <MapAttributionController />
          <TileLayer
            attribution='&copy; CartoDB'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* Transportruter (Bezier-lignende kurver) */}
          {routeCurves.map((route, idx) => (
            <LayerGroup key={`route-${idx}`}>
              {/* Kurve fra start til kontrolpunkt */}
              <Polyline
                positions={[route.from, route.controlPoint]}
                pathOptions={{ color: '#0077be', weight: 3, dashArray: '5, 10', opacity: 0.7 }}
                eventHandlers={{
                  click: () => {},
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold text-foreground">{route.transport.from_location} → {route.transport.to_location}</p>
                    <p className="text-xs text-muted-foreground">{route.transport.round_trip_price} DKK</p>
                  </div>
                </Popup>
              </Polyline>

              {/* Kurve fra kontrolpunkt til slutpunkt */}
              <Polyline
                positions={[route.controlPoint, route.to]}
                pathOptions={{ color: '#0077be', weight: 3, dashArray: '5, 10', opacity: 0.7 }}
                eventHandlers={{
                  click: () => {},
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold text-foreground">{route.transport.from_location} → {route.transport.to_location}</p>
                    <p className="text-xs text-muted-foreground">{route.transport.round_trip_price} DKK</p>
                  </div>
                </Popup>
              </Polyline>

              {/* Båd-ikon ved start */}
              <Marker position={route.from} icon={createBoatIcon()}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold text-foreground">{route.transport.from_location}</p>
                    <p className="text-xs text-muted-foreground">{route.transport.round_trip_price} DKK (round trip)</p>
                  </div>
                </Popup>
              </Marker>

              {/* Cirkelmarkør ved slutpunkt */}
              <CircleMarker
                center={route.to}
                radius={6}
                pathOptions={{ color: '#0077be', fill: true, fillColor: '#0077be', fillOpacity: 0.8, weight: 2, opacity: 1 }}
                eventHandlers={{
                  click: () => {},
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold text-foreground">{route.transport.to_location}</p>
                    <p className="text-xs text-muted-foreground">{route.transport.round_trip_price} DKK (round trip)</p>
                  </div>
                </Popup>
              </CircleMarker>
            </LayerGroup>
          ))}

          {/* Hytter */}
          {cabinPins.map((cabin) => (
            <Marker key={`cabin-${cabin.id}`} position={cabin.coords} icon={createCabinIcon()}>
              <Popup><CabinPopup cabin={cabin} /></Popup>
            </Marker>
          ))}

          {/* Afgangshavne */}
          {departurePins.map((pin) => (
            <Marker key={`dep-${pin.location}`} position={pin.coords} icon={createDepartureIcon()}>
              <Popup>
                <TransportHubPopup location={pin.location} transports={pin.transports} type="departure" />
              </Popup>
            </Marker>
          ))}

          {/* Destinationer */}
          {destinationPins.map((pin) => (
            <Marker key={`dst-${pin.location}`} position={pin.coords} icon={createDestinationIcon()}>
              <Popup>
                <TransportHubPopup location={pin.location} transports={pin.transports} type="destination" />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}