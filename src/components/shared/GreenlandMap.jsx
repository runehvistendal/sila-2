import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Approx coordinates for Greenlandic towns
const COORDS = {
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

function getCoords(location) {
  if (!location) return null;
  for (const [name, coords] of Object.entries(COORDS)) {
    if (location.toLowerCase().includes(name.toLowerCase())) return coords;
  }
  return null;
}

const MapPopupContent = ({ cabin }) => {
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const image = cabin.images?.[0];
  const fallback = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=150&fit=crop&q=80';

  React.useEffect(() => {
    if (imageError || !image) {
      setImageUrl(image ? fallback : null);
    } else {
      setImageUrl(image);
    }
  }, [image, fallback, imageError]);

  return (
    <div className="text-sm min-w-[150px]">
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt="" 
          className="w-full h-24 object-cover rounded-lg mb-2" 
          onError={() => setImageError(true)}
        />
      )}
      {!image && (
         <div className="w-full h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg mb-2" />
       )}
       <p className="font-semibold text-foreground">{cabin.title}</p>
       <p className="text-muted-foreground text-xs mb-2">{cabin.location}</p>
       <p className="font-bold text-primary text-sm">{cabin.price_per_night} DKK/nat</p>
       <a href={`/cabins/${cabin.id}`} className="block mt-2 text-xs text-primary font-medium hover:underline">Se detaljer →</a>
      </div>
      );
      };

      export default function GreenlandMap({ cabins = [], height = '400px' }) {
      const pins = (cabins || [])
      .filter(c => c && c.id)
      .map(c => ({ ...c, coords: getCoords(c.location) }))
      .filter(c => c.coords);

      return (
      <div style={{ height }} className="rounded-2xl overflow-hidden border border-border shadow-card">
       <MapContainer
         center={[68, -50]}
         zoom={5}
         style={{ height: '100%', width: '100%' }}
         scrollWheelZoom={false}
       >
         <TileLayer
           attribution='&copy; CartoDB'
           url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
         />
         {pins.map(cabin => (
           <Marker key={cabin.id} position={cabin.coords}>
             <Popup>
               <MapPopupContent cabin={cabin} />
             </Popup>
           </Marker>
         ))}
       </MapContainer>
      </div>
      );
      }