import { useMap } from 'react-leaflet';
import { useEffect } from 'react';

export default function MapAttributionController() {
  const map = useMap();

  useEffect(() => {
    if (map && map.attributionControl) {
      map.attributionControl.setPrefix(false);
    }
  }, [map]);

  return null;
}