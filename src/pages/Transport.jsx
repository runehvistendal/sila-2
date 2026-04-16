import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TransportCard from '@/components/transport/TransportCard';
import TransportFilters from '@/components/transport/TransportFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Anchor } from 'lucide-react';

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
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

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
          <div className="flex items-start justify-between gap-6 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-1">Bådtransport</h1>
              <p className="text-muted-foreground">Lokale tilbyder ledige pladser på deres ruter i Grønland</p>
            </div>
            <a href="/transport-map" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap">
              📍 Se på kort
            </a>
          </div>
          <TransportFilters filters={filters} onChange={setFilters} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-6">{filtered.length} rute{filtered.length !== 1 ? 'r' : ''} fundet</p>
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
          </>
        ) : (
          <div className="text-center py-24">
            <Anchor className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">Ingen transport fundet</p>
            <p className="text-muted-foreground text-sm">Prøv en anden søgning</p>
          </div>
        )}
      </div>
    </div>
  );
}