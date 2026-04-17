import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import TransportCard from '@/components/transport/TransportCard';
import TransportFilters from '@/components/transport/TransportFilters';
import ImprovedGreenlandMap from '@/components/shared/ImprovedGreenlandMap';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Anchor, Grid, Map, Calendar, ArrowRight } from 'lucide-react';
import { GREENLAND_LOCATIONS } from '@/lib/greenlandLocations';

const CITIES = [...new Set(GREENLAND_LOCATIONS.map(l => l.name_dk))].sort();

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
  const { user } = useAuth();
  const { t } = useLanguage();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [view, setView] = useState('grid'); // 'grid' | 'map'
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAllTransport, setShowAllTransport] = useState(false);

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
               {filtered.slice(0, showAllTransport ? undefined : 9).map((t) => (
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
             {!showAllTransport && filtered.length > 9 && (
               <div className="flex justify-center mt-8">
                 <Button onClick={() => setShowAllTransport(true)} variant="outline" className="rounded-xl px-6">
                   {t('show_all_transport') || 'Vis alle ruter'}
                 </Button>
               </div>
             )}
          </>
        ) : (
          <div className="text-center py-24">
            <Anchor className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">{t('no_transport_found')}</p>
            <p className="text-muted-foreground text-sm">{t('try_another_search')}</p>
          </div>
        )}
        </div>

        {/* CTA Section */}
        <section className="py-16 bg-accent/5 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  {t('cant_find_transport')}
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base max-w-md">
                  {t('request_transport_cta')}
                </p>
              </div>
              <Button
                onClick={() => user ? setShowRequestModal(true) : base44.auth.redirectToLogin()}
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl px-6 font-semibold gap-2 whitespace-nowrap"
              >
                {t('request_transport_btn')} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Request Transport Modal */}
        {showRequestModal && (
        <TransportRequestModal onClose={() => setShowRequestModal(false)} />
        )}
        </div>
        );
        }

        function TransportRequestModal({ onClose }) {
        const { user } = useAuth();
        const { t } = useLanguage();
        const [form, setForm] = useState({ from_location: '', to_location: '', travel_date: '', passengers: 1, message: '' });
        const [done, setDone] = useState(false);

        const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.from_location || !form.to_location || !form.travel_date) return;
        await base44.entities.TransportRequest.create({
        ...form,
        passengers: Number(form.passengers),
        guest_name: user.full_name || '',
        guest_email: user.email,
        status: 'pending',
        });
        setDone(true);
        };

        return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
        {done ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Anchor className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">{t('request_sent_exclaim')}</h2>
            <p className="text-muted-foreground text-sm mb-6">{t('request_sent_desc')}</p>
            <Button onClick={onClose} className="bg-primary text-white rounded-xl">
              {t('close') || 'Luk'}
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t('request_transport_title')}</h2>
              <p className="text-muted-foreground text-sm">{t('request_transport_desc')}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">{t('from')}</label>
                  <select value={form.from_location} onChange={e => setForm(f => ({ ...f, from_location: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-input bg-transparent text-sm" required>
                    <option value="">{t('select_city')}</option>
                    {CITIES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">{t('to')}</label>
                  <select value={form.to_location} onChange={e => setForm(f => ({ ...f, to_location: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-input bg-transparent text-sm" required>
                    <option value="">{t('select_city')}</option>
                    {CITIES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">{t('date')}</label>
                  <input type="date" value={form.travel_date} onChange={e => setForm(f => ({ ...f, travel_date: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-input text-sm" required min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">{t('passengers')}</label>
                  <input type="number" min="1" max="20" value={form.passengers} onChange={e => setForm(f => ({ ...f, passengers: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-input text-sm" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-lg">
                  {t('cancel') || 'Annuller'}
                </Button>
                <Button type="submit" disabled={!form.from_location || !form.to_location || !form.travel_date} className="flex-1 bg-primary text-white rounded-lg">
                  {t('send_request')}
                </Button>
              </div>
            </form>
          </>
        )}
        </div>
        </div>
        );
        }