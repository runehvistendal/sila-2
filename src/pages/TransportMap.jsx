import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ImprovedGreenlandMap from '@/components/shared/ImprovedGreenlandMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Anchor, ArrowLeft, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const LOCATIONS = ['Nuuk', 'Ilulissat', 'Sisimiut', 'Disko Bay', 'Kangerlussuaq', 'Tasiilaq', 'Upernavik', 'Qaqortoq', 'Narsaq'];

export default function TransportMap() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [fromFilter, setFromFilter] = useState(searchParams.get('from') || 'all');
  const [toFilter, setToFilter] = useState(searchParams.get('to') || 'all');

  const { data: transports = [], isLoading } = useQuery({
    queryKey: ['transports-map'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getActiveTransports', {});
      return res.data.transports || [];
    },
  });

  const filtered = useMemo(() => {
    return transports.filter((t) => {
      const matchFrom = fromFilter === 'all' || t.from_location === fromFilter;
      const matchTo = toFilter === 'all' || t.to_location === toFilter;
      return matchFrom && matchTo;
    });
  }, [transports, fromFilter, toFilter]);

  const handleLocationClick = (location) => {
    setFromFilter(location);
    setSearchParams({ from: location });
  };

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/transport')} className="rounded-lg">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Transport på kort</h1>
              <p className="text-sm text-muted-foreground">Klik på havne for at se tilgængelige ruter</p>
            </div>
          </div>

          {/* Filtre */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">Fra</label>
              <Select value={fromFilter} onValueChange={setFromFilter}>
                <SelectTrigger className="rounded-lg h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle havne</SelectItem>
                  {LOCATIONS.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">Til</label>
              <Select value={toFilter} onValueChange={setToFilter}>
                <SelectTrigger className="rounded-lg h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle destinationer</SelectItem>
                  {LOCATIONS.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFromFilter('all');
                  setToFilter('all');
                  setSearchParams({});
                }}
                className="w-full rounded-lg"
              >
                <Filter className="w-3 h-3 mr-1" /> Nulstil
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Kort og info */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <Skeleton className="h-96 rounded-2xl" />
        ) : (
          <>
            <ImprovedGreenlandMap transports={filtered} height="500px" />

            {/* Info under kort */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground font-semibold mb-1">TOTAL RUTER</p>
                <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground font-semibold mb-1">HAVNE</p>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(transports.map((t) => t.from_location)).size}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground font-semibold mb-1">GENNEMSNITSPRIS</p>
                <p className="text-2xl font-bold text-primary">
                  {filtered.length > 0
                    ? Math.round(filtered.reduce((s, t) => s + (t.round_trip_price || 0), 0) / filtered.length)
                    : '-'}
                  {filtered.length > 0 && ' DKK'}
                </p>
              </div>
            </div>

            {/* Link til liste-view */}
            <div className="mt-8 text-center">
              <Button onClick={() => navigate('/transport')} variant="outline" size="lg" className="rounded-lg">
                <Anchor className="w-4 h-4 mr-2" /> Vis ruter som liste
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}