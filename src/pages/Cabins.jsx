import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CabinCard from '@/components/cabins/CabinCard';
import CabinFilters from '@/components/cabins/CabinFilters';
import GreenlandMap from '@/components/shared/GreenlandMap';
import { Skeleton } from '@/components/ui/skeleton';
import { Home, Map, Grid } from 'lucide-react';

const DEFAULT_FILTERS = {
  search: '',
  location: 'all',
  sort: 'newest',
  minPrice: '',
  maxPrice: '',
  minGuests: '',
  checkIn: '',
  amenities: [],
};

export default function Cabins() {
  const urlParams = new URLSearchParams(window.location.search);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, search: urlParams.get('q') || '' });
  const [view, setView] = useState('grid'); // 'grid' | 'map'

  const { data: rawCabins, isLoading } = useQuery({
    queryKey: ['cabins'],
    queryFn: () => base44.entities.Cabin.filter({ status: 'active' }, '-created_date', 60),
    initialData: [],
  });

  const cabins = useMemo(() => {
    if (!Array.isArray(rawCabins)) return [];
    return rawCabins.filter(c => c && typeof c === 'object' && c.id);
  }, [rawCabins]);

  const filtered = useMemo(() => {
    let result = cabins.filter((c) => {
      const q = filters.search.toLowerCase();
      const matchSearch = !q || c.title?.toLowerCase().includes(q) || c.location?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.amenities?.some(a => a.toLowerCase().includes(q));
      const matchLoc = filters.location === 'all' || c.location === filters.location;
      const matchMin = !filters.minPrice || c.price_per_night >= Number(filters.minPrice);
      const matchMax = !filters.maxPrice || c.price_per_night <= Number(filters.maxPrice);
      const matchGuests = !filters.minGuests || (c.max_guests || 0) >= Number(filters.minGuests);
      const matchAmenities = !(filters.amenities || []).length || (filters.amenities || []).every(a => c.amenities?.includes(a));
      return matchSearch && matchLoc && matchMin && matchMax && matchGuests && matchAmenities;
    });
    if (filters.sort === 'price_asc') result = [...result].sort((a, b) => a.price_per_night - b.price_per_night);
    if (filters.sort === 'price_desc') result = [...result].sort((a, b) => b.price_per_night - a.price_per_night);
    return result;
  }, [cabins, filters]);

  return (
    <div className="min-h-screen pt-16">
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-foreground">Hytter i Grønland</h1>
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                <Grid className="w-4 h-4" />
              </button>
              <button onClick={() => setView('map')} className={`p-2 rounded-lg transition-colors ${view === 'map' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                <Map className="w-4 h-4" />
              </button>
            </div>
          </div>
          <CabinFilters filters={filters} onChange={setFilters} />
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
        ) : view === 'map' ? (
          <GreenlandMap cabins={filtered.filter(c => c && c.id)} height="600px" />
        ) : filtered.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-6">{filtered.length} hytte{filtered.length !== 1 ? 'r' : ''} fundet</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((cabin) => (
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