import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Home as HomeIcon } from 'lucide-react';
import { useCurrency } from '@/lib/CurrencyContext';
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

const CabinPopup = ({ cabin }) => {
  const [imageError, setImageError] = React.useState(false);
  const { formatPrice } = useCurrency();
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
      <p className="font-semibold text-primary">{formatPrice(cabin.price_per_night)}/nat</p>
      <a href={`/cabins/${cabin.id}`} className="text-primary text-xs mt-2 font-semibold hover:underline block">
        Se detaljer →
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
  const cabinPins = useMemo(() => {
    return (cabins || [])
      .filter((c) => c && c.id && c.location)
      .map((c) => ({
        ...c,
        coords: LOCATIONS[c.location],
      }))
      .filter((c) => c.coords);
  }, [cabins]);

  return (
    <div className="space-y-4">
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
        </MapContainer>
      </div>

      {/* Legende */}
      <div className="flex gap-3 text-xs bg-muted rounded-lg p-3 w-fit">
        <div className="flex items-center gap-2">
          <div className="w-6 h-8 bg-primary rounded-sm flex items-center justify-center">
            <HomeIcon className="w-3 h-3 text-white" />
          </div>
          <span className="text-foreground font-medium">Hytter</span>
        </div>
      </div>
    </div>
  );
}