import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const LOCATIONS = ['Nuuk', 'Ilulissat', 'Sisimiut', 'Disko Bay', 'Kangerlussuaq', 'Tasiilaq', 'Upernavik', 'Qaqortoq', 'Narsaq'];
const AMENITIES = ['Wi-Fi', 'Sauna', 'Toilet', 'Electricity', 'Running water', 'Fireplace', 'Boat access', 'Fishing'];

export default function CabinFilters({ filters, onChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const set = (key, val) => onChange({ ...filters, [key]: val });
  const hasActive = filters.location !== 'all' || filters.minPrice || filters.maxPrice || filters.minGuests || filters.amenities?.length > 0;

  const toggleAmenity = (a) => {
    const cur = filters.amenities || [];
    set('amenities', cur.includes(a) ? cur.filter(x => x !== a) : [...cur, a]);
  };

  const reset = () => onChange({ search: filters.search, location: 'all', sort: 'newest', minPrice: '', maxPrice: '', minGuests: '', amenities: [] });

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Søg på navn, sted eller facilitet..."
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            className="pl-10 h-10 rounded-xl"
          />
        </div>
        <Select value={filters.location} onValueChange={(v) => set('location', v)}>
          <SelectTrigger className="w-[180px] h-10 rounded-xl">
            <SelectValue placeholder="Alle steder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle steder</SelectItem>
            {LOCATIONS.map((loc) => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.sort} onValueChange={(v) => set('sort', v)}>
          <SelectTrigger className="w-[160px] h-10 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Nyeste først</SelectItem>
            <SelectItem value="price_asc">Pris: lav til høj</SelectItem>
            <SelectItem value="price_desc">Pris: høj til lav</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="rounded-xl h-10 gap-1.5" onClick={() => setShowAdvanced(!showAdvanced)}>
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Avanceret {hasActive && <span className="w-2 h-2 rounded-full bg-primary inline-block" />}
        </Button>
      </div>

      {showAdvanced && (
        <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Min pris (DKK/nat)</label>
              <Input type="number" placeholder="0" value={filters.minPrice} onChange={(e) => set('minPrice', e.target.value)} className="rounded-xl h-9" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Max pris (DKK/nat)</label>
              <Input type="number" placeholder="∞" value={filters.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} className="rounded-xl h-9" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Min. gæster</label>
              <Input type="number" placeholder="1" min={1} value={filters.minGuests} onChange={(e) => set('minGuests', e.target.value)} className="rounded-xl h-9" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Indflytning efter</label>
              <Input type="date" value={filters.checkIn} onChange={(e) => set('checkIn', e.target.value)} className="rounded-xl h-9" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Faciliteter</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => (
                <button
                  key={a}
                  onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${(filters.amenities || []).includes(a) ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-border hover:border-primary'}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          {hasActive && (
            <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground gap-1 h-8">
              <X className="w-3.5 h-3.5" /> Nulstil filtre
            </Button>
          )}
        </div>
      )}
    </div>
  );
}