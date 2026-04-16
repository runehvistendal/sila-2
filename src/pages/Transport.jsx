import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import TransportCard from '@/components/transport/TransportCard';
import TransportFilters from '@/components/transport/TransportFilters';
import ImprovedGreenlandMap from '@/components/shared/ImprovedGreenlandMap';
import RequestTransportCTA from '@/components/transport/RequestTransportCTA';
import { Skeleton } from '@/components/ui/skeleton';
import { Anchor, Grid, Map } from 'lucide-react';

const PRICE_EXAMPLES = {
  'Nuuk': 1500,
  'Ilulissat': 1800,
  'Sisimiut': 1600,
  'Disko Bay': 1900,
  'Kangerlussuaq': 2200,
  'Tasiilaq': 2100,
  'Upernavik': 1700,
  'Qaqortoq': 2400,
  'Narsaq': 2000,
};

const DEFAULT_FILTERS = {
  search: '',
  fromLoc: 'all',
  toLoc: 'all',
  sort: 'date_asc',
  minDate: '',
  maxPrice: '',
  boatType: 'all',
  minSeats: '',
};

export default function Transport() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [view, setView] = useState('grid'); // 'grid' | 'map'

  const { data: transports = [], isLoading } = useQuery({
    queryKey: ['transports'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getActiveTransports', {});
      return res.data.transports;
    },
  });

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase();
    let result = transports.filter((t) => {
      const matchSearch = !q || t.from_location?.toLowerCase().includes(q) || t.to_location?.toLowerCase().includes(q) || t.provider_name?.toLowerCase().includes(q);
      const matchFrom = filters.fromLoc === 'all' || t.from_location === filters.fromLoc;
      const matchTo = filters.toLoc === 'all' || t.to_location === filters.toLoc;
      const matchDate = !filters.minDate || t.departure_date >= filters.minDate;
      const matchPrice = !filters.maxPrice || t.price_per_seat <= Number(filters.maxPrice);
      const matchBoat = filters.boatType === 'all' || t.boat_type === filters.boatType;
      const matchSeats = !filters.minSeats || t.seats_available >= Number(filters.minSeats);
      return matchSearch && matchFrom && matchTo && matchDate && matchPrice && matchBoat && matchSeats;
    });
    if (filters.sort === 'price_asc') result = [...result].sort((a, b) => a.price_per_seat - b.price_per_seat);
    if (filters.sort === 'date_asc') result = [...result].sort((a, b) => new Date(a.departure_date) - new Date(b.departure_date));
    return result;
  }, [transports, filters]);

  // Find return trip for each outbound trip (same provider, reverse route, later date)
  const getReturnTrip = (t) => transports.find(
    (r) => r.provider_email === t.provider_email &&
      r.from_location === t.to_location &&
      r.to_location === t.from_location &&
      r.departure_date >= t.departure_date &&
      r.id !== t.id &&
      r.status === 'scheduled'
  ) || null;

  return (
    <div className="min-h-screen pt-16">
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
             <div>
               <h1 className="text-3xl font-bold text-foreground mb-1">{t('boats_title')}</h1>
               <p className="text-muted-foreground">{t('local_offers')}</p>
             </div>
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                <Grid className="w-4 h-4" />
              </button>
              <button onClick={() => setView('map')} className={`p-2 rounded-lg transition-colors ${view === 'map' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                <Map className="w-4 h-4" />
              </button>
            </div>
          </div>
          <TransportFilters filters={filters} onChange={setFilters} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : view === 'map' ? (
          <ImprovedGreenlandMap transports={filtered} height="600px" />
        ) : filtered.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-6">{filtered.length} {t('routes_found')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
               {filtered.map((t) => (
                 <div key={t.id}>
                   <TransportCard
                     transport={{
                       ...t,
                       round_trip_price: t.round_trip_price || PRICE_EXAMPLES[t.from_location] || PRICE_EXAMPLES[t.to_location] || 1800
                     }}
                     returnTrip={getReturnTrip(t)}
                   />
                 </div>
               ))}
             </div>
            <RequestTransportCTA />
          </>
        ) : (
          <div className="text-center py-24">
            <Anchor className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">{t('no_transport_found')}</p>
            <p className="text-muted-foreground text-sm">{t('try_another_search')}</p>
            <div className="mt-8">
              <RequestTransportCTA />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}