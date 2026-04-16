import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const LOCATIONS = ['Nuuk', 'Ilulissat', 'Sisimiut', 'Disko Bay', 'Kangerlussuaq', 'Tasiilaq', 'Upernavik', 'Qaqortoq', 'Narsaq'];
const BOAT_TYPES = ['Speedbåd', 'Fiskerbåd', 'Zodiakbåd', 'Kutter', 'Sejlbåd'];

export default function TransportFilters({ filters, onChange }) {
  const { t } = useLanguage();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const set = (key, val) => onChange({ ...filters, [key]: val });
  const hasActive = filters.fromLoc !== 'all' || filters.toLoc !== 'all' || filters.minDate || filters.maxPrice || filters.boatType !== 'all' || filters.minSeats;

  const reset = () => onChange({ search: filters.search, fromLoc: 'all', toLoc: 'all', sort: 'date_asc', minDate: '', maxPrice: '', boatType: 'all', minSeats: '' });

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('search_route_placeholder')}
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            className="pl-10 h-10 rounded-xl"
          />
        </div>
        <Select value={filters.fromLoc} onValueChange={(v) => set('fromLoc', v)}>
          <SelectTrigger className="w-[160px] h-10 rounded-xl">
            <SelectValue placeholder={t('from')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_departures')}</SelectItem>
            {LOCATIONS.map((loc) => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.toLoc} onValueChange={(v) => set('toLoc', v)}>
          <SelectTrigger className="w-[160px] h-10 rounded-xl">
            <SelectValue placeholder={t('to')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_destinations')}</SelectItem>
            {LOCATIONS.map((loc) => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="rounded-xl h-10 gap-1.5" onClick={() => setShowAdvanced(!showAdvanced)}>
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {t('advanced')} {hasActive && <span className="w-2 h-2 rounded-full bg-primary inline-block" />}
        </Button>
      </div>

      {showAdvanced && (
        <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">{t('earliest_date')}</label>
              <Input type="date" value={filters.minDate} onChange={(e) => set('minDate', e.target.value)} className="rounded-xl h-9" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">{t('max_price_seat')}</label>
              <Input type="number" placeholder="∞" value={filters.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} className="rounded-xl h-9" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">{t('min_seats_label')}</label>
              <Input type="number" placeholder="1" min={1} value={filters.minSeats} onChange={(e) => set('minSeats', e.target.value)} className="rounded-xl h-9" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">{t('boat_type_label')}</label>
              <Select value={filters.boatType} onValueChange={(v) => set('boatType', v)}>
                <SelectTrigger className="h-9 rounded-xl">
                  <SelectValue placeholder={t('all_types')} />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="all">{t('all_types')}</SelectItem>
                  {BOAT_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {hasActive && (
            <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground gap-1 h-8">
              <X className="w-3.5 h-3.5" /> {t('reset_filters')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}