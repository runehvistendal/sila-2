import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { GREENLAND_LOCATIONS } from '@/lib/greenlandLocations';
import SearchSuggestions from './SearchSuggestions';

const CITIES = [...new Set(GREENLAND_LOCATIONS.map(l => l.name_dk))].sort();

const AMENITIES = ['Wi-Fi', 'Sauna', 'Toilet', 'Electricity', 'Running water', 'Fireplace', 'Boat access', 'Fishing'];

const selectClass = "h-10 rounded-xl border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground cursor-pointer";

export default function CabinFilters({ filters, onChange, cabins = [] }) {
  const { t } = useLanguage();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const set = (key, val) => onChange({ ...filters, [key]: val });
  const hasActive = filters.location !== 'all' || filters.minPrice || filters.maxPrice || filters.minGuests || filters.amenities?.length > 0 || filters.hostTransport;

  const toggleAmenity = (a) => {
    const cur = filters.amenities || [];
    set('amenities', cur.includes(a) ? cur.filter(x => x !== a) : [...cur, a]);
  };

  const reset = () => onChange({ search: filters.search, location: 'all', sort: 'newest', minPrice: '', maxPrice: '', minGuests: '', amenities: [], hostTransport: false });

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t('search_cabin_placeholder')}
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            className="pl-10 h-10 rounded-xl"
          />
          <SearchSuggestions
            value={filters.search}
            onSelect={(suggestion) => set('search', suggestion)}
            cabins={cabins}
          />
        </div>

        <select
          value={filters.location}
          onChange={(e) => set('location', e.target.value)}
          className={`${selectClass} w-[180px]`}
        >
          <option value="all">{t('all_locations')}</option>
          {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
        </select>

        <select
          value={filters.sort}
          onChange={(e) => set('sort', e.target.value)}
          className={`${selectClass} w-[160px]`}
        >
          <option value="newest">{t('newest_first')}</option>
          <option value="price_asc">{t('price_low_high')}</option>
          <option value="price_desc">{t('price_high_low')}</option>
        </select>

        <button
          className="rounded-xl h-10 px-3 text-sm font-medium border border-input bg-transparent shadow-sm hover:bg-muted flex items-center gap-1.5 whitespace-nowrap"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {t('advanced')}
          {hasActive && <span className="w-2 h-2 rounded-full bg-primary inline-block" />}
        </button>
      </div>

      {showAdvanced && (
        <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">{t('min_price_label')}</label>
              <Input type="number" placeholder="0" value={filters.minPrice} onChange={(e) => set('minPrice', e.target.value)} className="rounded-xl h-9" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">{t('max_price_label')}</label>
              <Input type="number" placeholder="∞" value={filters.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} className="rounded-xl h-9" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">{t('min_guests_label')}</label>
              <Input type="number" placeholder="1" min={1} value={filters.minGuests} onChange={(e) => set('minGuests', e.target.value)} className="rounded-xl h-9" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">{t('check_in_after')}</label>
              <Input type="date" value={filters.checkIn} onChange={(e) => set('checkIn', e.target.value)} className="rounded-xl h-9" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">{t('amenities_label')}</label>
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
          <div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hostTransport || false}
                onChange={(e) => set('hostTransport', e.target.checked)}
                className="w-4 h-4 accent-primary rounded"
              />
              <span className="font-medium text-foreground">{t('host_offers_transport')}</span>
            </label>
          </div>
          {hasActive && (
            <button onClick={reset} className="text-muted-foreground text-sm flex items-center gap-1 h-8 px-2 rounded-lg hover:bg-muted">
              <X className="w-3.5 h-3.5" /> {t('reset_filters')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}