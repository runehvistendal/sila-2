import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CabinCard from '@/components/cabins/CabinCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, SlidersHorizontal, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const LOCATIONS = ['Nuuk', 'Ilulissat', 'Sisimiut', 'Disko Bay', 'Kangerlussuaq', 'Tasiilaq', 'Upernavik', 'Qaqortoq', 'Narsaq'];

export default function Cabins() {
  const urlParams = new URLSearchParams(window.location.search);
  const [search, setSearch] = useState(urlParams.get('q') || '');
  const [location, setLocation] = useState('all');
  const [sort, setSort] = useState('newest');

  const { data: cabins = [], isLoading } = useQuery({
    queryKey: ['cabins'],
    queryFn: () => base44.entities.Cabin.filter({ status: 'active' }, '-created_date', 60),
  });

  const filtered = useMemo(() => {
    let result = cabins.filter((c) => {
      const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.location?.toLowerCase().includes(search.toLowerCase());
      const matchLoc = location === 'all' || c.location === location;
      return matchSearch && matchLoc;
    });
    if (sort === 'price_asc') result = [...result].sort((a, b) => a.price_per_night - b.price_per_night);
    if (sort === 'price_desc') result = [...result].sort((a, b) => b.price_per_night - a.price_per_night);
    return result;
  }, [cabins, search, location, sort]);

  return (
    <div className="min-h-screen pt-16">
      {/* Page header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">Browse Cabins</h1>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search location or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 rounded-xl"
              />
            </div>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="w-[180px] h-10 rounded-xl">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {LOCATIONS.map((loc) => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[160px] h-10 rounded-xl">
                <SlidersHorizontal className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="price_asc">Price: low to high</SelectItem>
                <SelectItem value="price_desc">Price: high to low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grid */}
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
            <p className="text-sm text-muted-foreground mb-6">{filtered.length} cabin{filtered.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((cabin, i) => (
                <motion.div
                  key={cabin.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <CabinCard cabin={cabin} />
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-24">
            <Home className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">No cabins found</p>
            <p className="text-muted-foreground text-sm">Try adjusting your search</p>
          </div>
        )}
      </div>
    </div>
  );
}