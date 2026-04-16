import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function RequestFilters({ onFilterChange, type = 'transport' }) {
  const [location, setLocation] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [passengers, setPassengers] = React.useState('');

  const handleReset = () => {
    setLocation('');
    setStatus('all');
    setPassengers('');
    onFilterChange({ location: '', status: 'all', passengers: '' });
  };

  const handleFilterChange = () => {
    onFilterChange({ location, status, passengers });
  };

  React.useEffect(() => {
    handleFilterChange();
  }, [location, status, passengers]);

  const LOCATIONS = [
    'Nuuk', 'Ilulissat', 'Sisimiut', 'Qaqortoq', 'Aasiaat',
    'Maniitsoq', 'Tasiilaq', 'Paamiut', 'Nanortalik', 'Uummannaq',
  ];

  return (
    <div className="bg-white rounded-xl border border-border p-4 mb-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Location filter */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
            {type === 'transport' ? 'Afgang fra' : 'Lokation'}
          </label>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Alle steder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Alle steder</SelectItem>
              {LOCATIONS.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status filter */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Alle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="pending">Afventer</SelectItem>
              <SelectItem value="quoted">Tilbud sendt</SelectItem>
              <SelectItem value="accepted">Accepteret</SelectItem>
              <SelectItem value="declined">Afvist</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Passengers/Guests filter */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
            Min. {type === 'transport' ? 'passagerer' : 'gæster'}
          </label>
          <Input
            type="number"
            min="1"
            placeholder="Alle"
            value={passengers}
            onChange={e => setPassengers(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {(location || status !== 'all' || passengers) && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReset}
          className="text-destructive gap-1 h-8"
        >
          <X className="w-3.5 h-3.5" /> Nulstil filtre
        </Button>
      )}
    </div>
  );
}