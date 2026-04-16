import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown, MapPin } from 'lucide-react';

export default function LocationAutocomplete({ 
  value, 
  onChange, 
  userLat, 
  userLon,
  placeholder = 'Søg efter by eller postnummer...',
  className = ''
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const timeoutRef = useRef(null);

  // Fetch selected location details
  useEffect(() => {
    if (value && value.id) {
      const fetchLocation = async () => {
        try {
          const loc = await base44.entities.Location.get(value.id);
          setSelectedLocation(loc);
        } catch (err) {
          console.error('Error fetching location:', err);
        }
      };
      fetchLocation();
    }
  }, [value]);

  // Search locations on input change
  const handleSearch = async (query) => {
    setInput(query);
    
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await base44.functions.invoke('searchLocations', {
        query,
        userLat,
        userLon,
        limit: 10
      });
      setResults(res.data.locations || []);
      setOpen(true);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const query = e.target.value;
    setInput(query);
    
    // Debounce search
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      handleSearch(query);
    }, 300);
  };

  const handleSelect = (location) => {
    setSelectedLocation(location);
    onChange({ id: location.id });
    setInput('');
    setOpen(false);
    setResults([]);
  };

  const displayText = selectedLocation ? `${selectedLocation.name_dk} (${selectedLocation.postal_code})` : '';

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          placeholder={displayText || placeholder}
          value={input}
          onChange={handleInputChange}
          onFocus={() => input && setOpen(true)}
          className="w-full px-4 py-2 pr-9 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-input rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              Søger...
            </div>
          )}
          {!loading && results.length === 0 && input && (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              Ingen steder fundet
            </div>
          )}
          {results.map((location) => (
            <button
              key={location.id}
              onClick={() => handleSelect(location)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border last:border-0 flex items-center gap-2"
            >
              <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">{location.name_dk}</div>
                <div className="text-xs text-muted-foreground">{location.postal_code} · {location.type}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedLocation && (
        <button
          onClick={() => {
            setSelectedLocation(null);
            onChange(null);
            setInput('');
          }}
          className="text-xs text-muted-foreground hover:text-foreground mt-1"
        >
          Ryd valg
        </button>
      )}
    </div>
  );
}