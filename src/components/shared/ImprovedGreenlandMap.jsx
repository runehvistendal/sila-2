import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Eye, EyeOff, Anchor, Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
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
  'Narsaq': [60.912, -46.059],
};

// Brugerdefinerede ikoner
const createCabinIcon = () => new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDIiIHZpZXdCb3g9IjAgMCAzMiA0MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iNDIiIHJ4PSI4IiBmaWxsPSIjMDM5QkMxIi8+PHBhdGggZD0iTTEwIDIwSDE2VjI4SDEwVjIwWiIgZmlsbD0id2hpdGUiLz48cGF0aCBkPSJNMTYgMTBMMjYgMjBIMTZWMjhIMTBWMjBMMTYgMTBaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+',
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

const createTransportIcon = () => new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDIiIHZpZXdCb3g9IjAgMCAzMiA0MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iNDIiIHJ4PSI4IiBmaWxsPSIjYWQyNjJjIi8+PHBhdGggZD0iTTEyIDE0SzEyIDEwIDE2IDEwSzIwIDEwIDIwIDE0TTEyIDE4SzEyIDE0TDIwIDE0SzIwIDE4TTEyIDI0TDIwIDI0TTExIDI0UzEwIDI2IDExIDI4UzEzIDMwIDE1IDMwUzE3IDI4IDE4IDI2UzE3IDI0IDE2IDI0IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBmaWxsPSJub25lIi8+PC9zdmc+',
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

const CabinPopup = ({ cabin }) => {
  const [imageError, setImageError] = React.useState(false);
  const image = cabin.images?.[0];

  return (
    <div className="text-sm w-48">
      {image && !imageError && (
        <img
          src={image}
          alt=""
          className="w-full h-32 object-cover rounded-lg mb-2"
          onError={() => setImageError(true)}
        />
      )}
      <p className="font-bold text-foreground">{cabin.title}</p>
      <p className="text-muted-foreground text-xs mb-2">{cabin.location}</p>
      <p className="font-semibold text-primary">{cabin.price_per_night} DKK/nat</p>
      <a href={`/cabins/${cabin.id}`} className="text-primary text-xs mt-2 font-semibold hover:underline block">
        Se detaljer →
      </a>
    </div>
  );
};

const TransportHubPopup = ({ location, transports }) => {
  const count = transports.length;
  const avgPrice = transports.length > 0
    ? Math.round(transports.reduce((s, t) => s + (t.round_trip_price || 0), 0) / count)
    : 0;

  return (
    <div className="text-sm w-48">
      <p className="font-bold text-foreground flex items-center gap-2">
        <Anchor className="w-4 h-4" /> {location}
      </p>
      <p className="text-muted-foreground text-xs mb-2">{count} sejltur tilgængelig</p>
      {avgPrice > 0 && (
        <p className="text-primary font-semibold text-xs">Gennemsnit: {avgPrice} DKK</p>
      )}
      <a href={`/transport?from=${encodeURIComponent(location)}`} className="text-primary text-xs mt-2 font-semibold hover:underline block">
        Se alle ruter →
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
  const [layers, setLayers] = React.useState({
    cabins: true,
    transports: true,
  });

  // Aggregér transport-data til havne
  const transportHubs = useMemo(() => {
    if (!layers.transports) return {};

    const hubs = {};
    (transports || []).forEach((t) => {
      const from = t.from_location;
      if (!from) return;
      if (!hubs[from]) hubs[from] = [];
      hubs[from].push(t);
    });
    return hubs;
  }, [transports, layers.transports]);

  const cabinPins = useMemo(() => {
    if (!layers.cabins) return [];
    return (cabins || [])
      .filter((c) => c && c.id && c.location)
      .map((c) => ({
        ...c,
        coords: LOCATIONS[c.location],
      }))
      .filter((c) => c.coords);
  }, [cabins, layers.cabins]);

  const transportPins = useMemo(() => {
    return Object.entries(transportHubs).map(([location, hubs]) => ({
      location,
      transports: hubs,
      coords: LOCATIONS[location],
    })).filter((p) => p.coords);
  }, [transportHubs]);

  return (
    <div className="space-y-4">
      {/* Toggle-knapper */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={layers.cabins ? 'default' : 'outline'}
          size="sm"
          onClick={() => setLayers((p) => ({ ...p, cabins: !p.cabins }))}
          className="gap-2 rounded-lg"
        >
          {layers.cabins ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          Hytter {cabinPins.length > 0 && `(${cabinPins.length})`}
        </Button>
        <Button
          variant={layers.transports ? 'default' : 'outline'}
          size="sm"
          onClick={() => setLayers((p) => ({ ...p, transports: !p.transports }))}
          className="gap-2 rounded-lg"
        >
          {layers.transports ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          Transport {transportPins.length > 0 && `(${transportPins.length})`}
        </Button>
      </div>

      {/* Kort */}
      <div style={{ height }} className="rounded-2xl overflow-hidden border border-border shadow-card">
        <MapContainer
          center={[68, -50]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Hytter-pins */}
          {cabinPins.map((cabin) => (
            <Marker key={`cabin-${cabin.id}`} position={cabin.coords} icon={createCabinIcon()}>
              <Popup>
                <CabinPopup cabin={cabin} />
              </Popup>
            </Marker>
          ))}

          {/* Transport-hubs */}
          {transportPins.map((pin) => (
            <Marker key={`transport-${pin.location}`} position={pin.coords} icon={createTransportIcon()}>
              <Popup>
                <TransportHubPopup location={pin.location} transports={pin.transports} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Legende */}
      <div className="grid grid-cols-2 gap-3 text-xs bg-muted rounded-lg p-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-8 bg-primary rounded-sm flex items-center justify-center">
            <HomeIcon className="w-3 h-3 text-white" />
          </div>
          <span className="text-foreground font-medium">Hytter</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-8 bg-accent rounded-sm flex items-center justify-center">
            <Anchor className="w-3 h-3 text-white" />
          </div>
          <span className="text-foreground font-medium">Transport-haver</span>
        </div>
      </div>
    </div>
  );
}