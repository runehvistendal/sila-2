import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TransportCard from '@/components/transport/TransportCard';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Anchor } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Transport() {
  const [search, setSearch] = useState('');

  const { data: transports = [], isLoading } = useQuery({
    queryKey: ['transports'],
    queryFn: () => base44.entities.Transport.filter({ status: 'scheduled' }, '-departure_date', 50),
  });

  const filtered = useMemo(() => {
    if (!search) return transports;
    const q = search.toLowerCase();
    return transports.filter(
      (t) => t.from_location?.toLowerCase().includes(q) || t.to_location?.toLowerCase().includes(q)
    );
  }, [transports, search]);

  return (
    <div className="min-h-screen pt-16">
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-lg">
            <h1 className="text-3xl font-bold text-foreground mb-1">Boat Transport</h1>
            <p className="text-muted-foreground mb-6">Locals offering spare seats on their routes across Greenland</p>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search route (e.g. Nuuk, Ilulissat...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <TransportCard transport={t} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <Anchor className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">No transport found</p>
            <p className="text-muted-foreground text-sm">Try a different search</p>
          </div>
        )}
      </div>
    </div>
  );
}