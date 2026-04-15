import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CabinCard from '@/components/cabins/CabinCard';
import CabinFilters from '@/components/cabins/CabinFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Home } from 'lucide-react';

const DEFAULT_FILTERS = {
  search: '',
  location: 'all',
  sort: 'newest',
  minPrice: '',
  maxPrice: '',
  minGuests: '',
  checkIn: '',
  amenities: [],
  hostTransport: false,
};

export default function Cabins() {
  const urlParams = new URLSearchParams(window.location.search);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, search: urlParams.get('q') || '' });

  const { data: rawCabins = [], isLoading } = useQuery({
    queryKey: ['cabins'],
    queryFn: async () => {
      const res = await base44.functions.invoke('listCabins', { sort: '-created_date', limit: 60 });
      return res.data.cabins || [];
    },
  });

  const cabins = useMemo(() => {
    if (!Array.isArray(rawCabins)) return [];
    return rawCabins.filter(c => c && typeof c === 'object' && c.id);
  }, [rawCabins]);

  const filtered = useMemo(() => {
    if (!Array.isArray(cabins) || cabins.length === 0) return [];
    let result = cabins.filter((c) => {
      const q = filters.search.toLowerCase();
      const matchSearch = !q || c.title?.toLowerCase().includes(q) || c.location?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.amenities?.some(a => a.toLowerCase().includes(q));
      const matchLoc = filters.location === 'all' || c.location === filters.location;
      const matchMin = !filters.minPrice || c.price_per_night >= Number(filters.minPrice);
      const matchMax = !filters.maxPrice || c.price_per_night <= Number(filters.maxPrice);
      const matchGuests = !filters.minGuests || (c.max_guests || 0) >= Number(filters.minGuests);
      const matchAmenities = !(filters.amenities || []).length || (filters.amenities || []).every(a => c.amenities?.includes(a));
      const matchTransport = !filters.hostTransport || c.host_provides_transport === true;
      return matchSearch && matchLoc && matchMin && matchMax && matchGuests && matchAmenities && matchTransport;
    });
    if (filters.sort === 'price_asc') result = [...result].sort((a, b) => a.price_per_night - b.price_per_night);
    if (filters.sort === 'price_desc') result = [...result].sort((a, b) => b.price_per_night - a.price_per_night);
    return result;
  }, [cabins, filters]);

  return (
    <div className="min-h-screen pt-16">
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Hytter i Grønland</h1>
          </div>
          <CabinFilters filters={filters} onChange={setFilters} cabins={cabins} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-6">{filtered.length} hytte{filtered.length !== 1 ? 'r' : ''} fundet</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.filter(c => c && c.id).map((cabin) => (
                <CabinCard key={cabin.id} cabin={cabin} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-24">
            <Home className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">Ingen hytter fundet</p>
            <p className="text-muted-foreground text-sm">Prøv at justere dine filtre</p>
          </div>
        )}
      </div>
    </div>
  );
}