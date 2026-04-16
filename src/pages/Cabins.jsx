import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import CabinCard from '@/components/cabins/CabinCard';
import CabinFilters from '@/components/cabins/CabinFilters';
import ImprovedGreenlandMap from '@/components/shared/ImprovedGreenlandMap';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Home, Map, Grid, MapPin, ArrowRight } from 'lucide-react';

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
  const { user } = useAuth();
  const { t } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, search: urlParams.get('q') || '' });
  const [view, setView] = useState('grid'); // 'grid' | 'map'
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAllCabins, setShowAllCabins] = useState(false);

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
      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                {t('cant_find_cabin')}
                </h2>
                <p className="text-white/70 text-lg leading-relaxed mb-8">
                  {t('request_cabin_cta')}
              </p>
              <Button
                onClick={() => user ? setShowRequestModal(true) : base44.auth.redirectToLogin()}
                size="lg"
                className="bg-white text-primary hover:bg-white/90 rounded-full px-8 font-semibold gap-2"
              >
                {t('request_cabin_btn')} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden aspect-[4/3] shadow-card-hover">
                <img
                  src="https://images.unsplash.com/photo-1551727170-e209f2d8c1b4?w=900&h=700&fit=crop&q=85"
                  alt="Grønlandske hytter"
                  className="w-full h-full object-cover"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-foreground">{t('cabins_title')}</h1>
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                <Grid className="w-4 h-4" />
              </button>
              <button onClick={() => setView('map')} className={`p-2 rounded-lg transition-colors ${view === 'map' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                <Map className="w-4 h-4" />
              </button>
            </div>
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
        ) : view === 'map' ? (
          <ImprovedGreenlandMap cabins={filtered.filter(c => c && c.id)} height="600px" />
        ) : filtered.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-6">{filtered.length} {t('cabins_found')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.filter(c => c && c.id).slice(0, showAllCabins ? undefined : 9).map((cabin) => (
                <CabinCard key={cabin.id} cabin={cabin} />
              ))}
            </div>
            {!showAllCabins && filtered.length > 9 && (
              <div className="flex justify-center mt-8">
                <Button onClick={() => setShowAllCabins(true)} variant="outline" className="rounded-xl px-6">
                  {t('show_all_cabins') || 'Vis alle hytter'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24">
            <Home className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">{t('no_cabins_found')}</p>
            <p className="text-muted-foreground text-sm">{t('adjust_filters')}</p>
          </div>
        )}
      </div>

      {/* Request Cabin Modal */}
      {showRequestModal && (
        <CabinRequestModal onClose={() => setShowRequestModal(false)} />
      )}
    </div>
  );
}

function CabinRequestModal({ onClose }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ location: '', check_in: '', check_out: '', guests: 2, note: '' });
  const [done, setDone] = useState(false);

  const { mutate, isPending } = base44.entities.CabinRequest.useMutation?.create || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.location || !form.check_in || !form.check_out) return;
    await base44.entities.CabinRequest.create({
      ...form,
      guests: Number(form.guests),
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
              <MapPin className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">{t('request_sent_exclaim')}</h2>
            <p className="text-muted-foreground text-sm mb-6">{t('request_desc')}</p>
            <Button onClick={onClose} className="bg-primary text-white rounded-xl">
              {t('close') || 'Luk'}
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t('request_cabin_btn')}</h2>
              <p className="text-muted-foreground text-sm">{t('request_cabin_cta')}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">{t('location')}</label>
                <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-input bg-transparent text-sm">
                  <option value="">{t('select_destination')}</option>
                  {['Nuuk', 'Ilulissat', 'Sisimiut', 'Aasiaat', 'Tasiilaq'].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">{t('check_in')}</label>
                  <input type="date" value={form.check_in} onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-input text-sm" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">{t('check_out')}</label>
                  <input type="date" value={form.check_out} onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-input text-sm" required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">{t('guests')}</label>
                <input type="number" min="1" max="20" value={form.guests} onChange={e => setForm(f => ({ ...f, guests: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-input text-sm" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-lg">
                  {t('cancel') || 'Annuller'}
                </Button>
                <Button type="submit" disabled={isPending || !form.location || !form.check_in || !form.check_out} className="flex-1 bg-primary text-white rounded-lg">
                  {isPending ? t('sending_dots') : t('send_request')}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}