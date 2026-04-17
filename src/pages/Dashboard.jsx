import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PlusCircle, Home, Anchor, Calendar, MapPin, Users, Check, X,
  ArrowRight, Eye, Star, ChevronRight, Briefcase, Clock, Ship,
  ChevronDown, DollarSign, Inbox
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { IncomingRequestsTab, MyTransportRequestsTab } from '@/components/dashboard/TransportRequestsTab';
import { IncomingCabinRequestsTab, MyCabinRequestsTab } from '@/components/dashboard/CabinRequestsTab';
import HostCalendarTab from '@/components/dashboard/HostCalendarTab';
import BookingReviewButton from '@/components/bookings/BookingReviewButton';
import ProviderTrustCard from '@/components/provider/ProviderTrustCard';
import GuestBookingsTab from '@/components/dashboard/GuestBookingsTab';
import ProviderOverviewTab from '@/components/dashboard/ProviderOverviewTab';
import { GREENLAND_LOCATIONS } from '@/lib/greenlandLocations';
import { capitalizeFirst, STATUS_COLORS, statusLabel } from '@/lib/statusUtils';



const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const CITY_COORDS = {};
GREENLAND_LOCATIONS.forEach(loc => {
  if (!CITY_COORDS[loc.name_dk]) {
    CITY_COORDS[loc.name_dk] = { lat: loc.latitude, lon: loc.longitude };
  }
});

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [requestType, setRequestType] = useState('transport');
  const [searchInput, setSearchInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bookingFilter, setBookingFilter] = useState('active'); // 'active' | 'history'
  const [activeTab, setActiveTab] = useState('bookings');

  const CITIES = Object.keys(CITY_COORDS);
  const userHomeCity = user?.location || '';
  const [selectedCity, setSelectedCity] = useState(userHomeCity);

  // Re-sync selectedCity if user location loads after mount
  useEffect(() => {
    if (userHomeCity && !selectedCity) {
      setSelectedCity(userHomeCity);
    }
  }, [userHomeCity]);

  const matchingCities = searchInput.trim() === ''
    ? CITIES
    : CITIES.filter(city => city.toLowerCase().includes(searchInput.toLowerCase()));

  const sortedCities = [...matchingCities].sort((a, b) => {
    if (!userHomeCity) return 0;
    const homeCoords = CITY_COORDS[userHomeCity];
    if (!homeCoords) return 0;
    const distA = calculateDistance(homeCoords.lat, homeCoords.lon, CITY_COORDS[a]?.lat, CITY_COORDS[a]?.lon);
    const distB = calculateDistance(homeCoords.lat, homeCoords.lon, CITY_COORDS[b]?.lat, CITY_COORDS[b]?.lon);
    return distA - distB;
  });

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: myBookings = [] } = useQuery({
    queryKey: ['my-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ guest_email: user.email }, '-created_date', 30),
    enabled: !!user,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const { data: hostBookings = [] } = useQuery({
    queryKey: ['host-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ host_email: user.email }, '-created_date', 30),
    enabled: !!user,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const { data: myCabins = [] } = useQuery({
    queryKey: ['my-cabins', user?.email],
    queryFn: () => base44.entities.Cabin.filter({ host_email: user.email }, '-created_date', 20),
    enabled: !!user,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const { data: myTransports = [] } = useQuery({
    queryKey: ['my-transports', user?.email],
    queryFn: () => base44.entities.Transport.filter({ provider_email: user.email }, '-departure_date', 20),
    enabled: !!user,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const { data: myRatingsReceived = [] } = useQuery({
    queryKey: ['my-ratings-received', user?.email],
    queryFn: () => base44.entities.Rating.filter({ to_email: user.email }, '-created_date', 20),
    enabled: !!user,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const { data: allCabinRequests = [] } = useQuery({
    queryKey: ['all-cabin-requests'],
    queryFn: () => base44.entities.CabinRequest.filter({}, '-created_date', 100),
    enabled: !!user,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const { data: allTransportRequests = [] } = useQuery({
    queryKey: ['all-transport-requests'],
    queryFn: () => base44.entities.TransportRequest.filter({}, '-created_date', 100),
    enabled: !!user,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const updateBooking = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Booking.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries(['host-bookings']);
      qc.invalidateQueries(['my-bookings']);
      toast({ title: capitalizeFirst(t('booking_updated')), duration: 2000 });
    },
  });

  // ── Derived state ─────────────────────────────────────────────────────────
  const pendingHostBookings = hostBookings.filter(b => b.status === 'pending').length;
  const userRoleType = user?.role_type || 'traveler';
  const isProvider = userRoleType === 'provider' || userRoleType === 'both';
  const isTraveler = userRoleType === 'traveler' || userRoleType === 'both';

  // Open requests filtered by proximity — nearby first, rest after divider
  const openTransportRequests = allTransportRequests.filter(r => r.status === 'pending');
  const openCabinRequests = allCabinRequests.filter(r => r.status === 'pending');

  const nearbyTransport = openTransportRequests.filter(r =>
    !userHomeCity || r.from_location === userHomeCity || r.to_location === userHomeCity
  );
  const otherTransport = openTransportRequests.filter(r =>
    userHomeCity && r.from_location !== userHomeCity && r.to_location !== userHomeCity
  );

  const nearbyCabin = openCabinRequests.filter(r =>
    !userHomeCity || r.location === userHomeCity
  );
  const otherCabin = openCabinRequests.filter(r =>
    userHomeCity && r.location !== userHomeCity
  );

  const totalOpenRequests = openTransportRequests.length + openCabinRequests.length;

  if (!user) return null;

  const avgRating = myRatingsReceived.length > 0
    ? (myRatingsReceived.reduce((s, r) => s + r.stars, 0) / myRatingsReceived.length).toFixed(1)
    : null;

  // Booking splits for combined tab
  const activeBookings = myBookings.filter(b => ['pending', 'on_hold', 'confirmed'].includes(b.status));
  const historyBookings = myBookings.filter(b => ['completed', 'cancelled', 'declined'].includes(b.status));

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('my_dashboard')}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t('hello')} {user.full_name || user.email}</p>
            {avgRating && (
              <div className="flex items-center gap-1 mt-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold text-foreground">{avgRating}</span>
                <span className="text-xs text-muted-foreground">({myRatingsReceived.length} {t('ratings_avg')})</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {isTraveler && (
              <Button variant="outline" onClick={() => navigate('/request-cabin')} className="rounded-xl gap-2 text-sm">
                <MapPin className="w-4 h-4" /> {t('request_cabin_btn')}
              </Button>
            )}
            {isTraveler && (
              <Button variant="outline" onClick={() => navigate('/request-transport')} className="rounded-xl gap-2 text-sm">
                <Anchor className="w-4 h-4" /> {t('request_transport_btn')}
              </Button>
            )}
            {isProvider && (
              <Button onClick={() => navigate('/create-listing')} className="bg-primary text-white hover:bg-primary/90 rounded-xl gap-2 text-sm">
                <PlusCircle className="w-4 h-4" /> {t('new_listing')}
              </Button>
            )}
          </div>
        </div>

        {/* ── TABS ─────────────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 bg-muted rounded-xl p-1 h-auto flex-wrap gap-1">

            {/* 1. Bookinger */}
            <TabsTrigger value="bookings" className="rounded-lg px-4 py-2 text-sm gap-2">
              <Calendar className="w-4 h-4" /> {t('my_bookings')}
              {pendingHostBookings > 0 && (
                <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingHostBookings}
                </span>
              )}
            </TabsTrigger>

            {/* 2. Anmodninger (rejsende) */}
            <TabsTrigger value="requests" className="rounded-lg px-4 py-2 text-sm gap-2">
              <Clock className="w-4 h-4" /> {t('my_requests')}
            </TabsTrigger>

            {/* 3. Åbne ønsker (kun udbydere) */}
            {isProvider && (
              <TabsTrigger value="open-requests" className="rounded-lg px-4 py-2 text-sm gap-2">
                <Inbox className="w-4 h-4" /> {t('open_requests')}
                {totalOpenRequests > 0 && (
                  <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {totalOpenRequests}
                  </span>
                )}
              </TabsTrigger>
            )}

            {/* 4. Annoncer & Kalender (kun udbydere) */}
            {isProvider && (
              <TabsTrigger value="listings" className="rounded-lg px-4 py-2 text-sm gap-2">
                <Home className="w-4 h-4" /> {t('my_listings')}
              </TabsTrigger>
            )}

            {/* 5. Min indbakke (kun udbydere) */}
            {isProvider && (
              <TabsTrigger value="provider" className="rounded-lg px-4 py-2 text-sm gap-2">
                <Briefcase className="w-4 h-4" /> {t('my_inbox')}
                {hostBookings.filter(b => b.status === 'pending').length > 0 && (
                  <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {hostBookings.filter(b => b.status === 'pending').length}
                  </span>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── TAB 1: BOOKINGER (aktive + historik) ────────────────────── */}
          <TabsContent value="bookings">
            <div className="space-y-4">
              {/* Sub-filter */}
              <div className="flex gap-2 bg-muted rounded-xl p-1 w-fit">
                <button
                  onClick={() => setBookingFilter('active')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    bookingFilter === 'active' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {capitalizeFirst(t('booking_filter_active'))}
                  {activeBookings.length > 0 && (
                    <span className="ml-1.5 bg-primary/10 text-primary text-xs rounded-full px-1.5">{activeBookings.length}</span>
                  )}
                </button>
                <button
                  onClick={() => setBookingFilter('history')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    bookingFilter === 'history' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {capitalizeFirst(t('history'))}
                </button>
              </div>

              {bookingFilter === 'active' ? (
                isTraveler ? (
                  activeBookings.length > 0 ? (
                    <div className="space-y-3">
                      {activeBookings.map(b => (
                        <BookingRow key={b.id} booking={b} isHost={false} t={t}
                          onConfirm={() => updateBooking.mutate({ id: b.id, status: 'confirmed' })}
                          onDecline={() => updateBooking.mutate({ id: b.id, status: 'declined' })}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={Calendar} message={t('no_bookings') || 'Ingen aktive bookinger'} cta={t('explore_cabins') || 'Udforsk hytter'} ctaHref="/cabins" />
                  )
                ) : (
                  <EmptyState icon={Calendar} message={t('no_bookings') || 'Ingen bookinger'} cta={t('explore_cabins') || 'Udforsk hytter'} ctaHref="/cabins" />
                )
              ) : (
                historyBookings.length > 0 ? (
                  <div className="space-y-3">
                    {historyBookings.map(b => (
                      <BookingRow key={b.id} booking={b} isHost={false} t={t} />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Clock} message={t('no_history') || 'Ingen historik endnu'} cta={t('explore_cabins') || 'Udforsk hytter'} ctaHref="/cabins" />
                )
              )}

              {/* Host bookings (for providers who are also travelers) */}
              {isProvider && hostBookings.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-semibold text-foreground mb-3">{t('incoming_bookings')}</h3>
                  <div className="space-y-3">
                    {hostBookings
                      .filter(b => bookingFilter === 'active'
                        ? ['pending', 'confirmed'].includes(b.status)
                        : ['completed', 'cancelled'].includes(b.status))
                      .map(b => (
                        <BookingRow key={b.id} booking={b} isHost={true} t={t}
                          onConfirm={() => updateBooking.mutate({ id: b.id, status: 'confirmed' })}
                          onDecline={() => updateBooking.mutate({ id: b.id, status: 'declined' })}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── TAB 2: MINE ANMODNINGER ──────────────────────────────────── */}
          <TabsContent value="requests">
            <div className="space-y-8">
              <div>
                <h3 className="font-semibold text-foreground mb-3">{t('transport_requests')}</h3>
                <MyTransportRequestsTab />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-3">{t('cabin_requests')}</h3>
                <MyCabinRequestsTab />
              </div>
            </div>
          </TabsContent>

          {/* ── TAB 3: ÅBNE ØNSKER (udbydere) ────────────────────────────── */}
          {isProvider && (
            <TabsContent value="open-requests">
              <div className="space-y-6">

                {/* Toggle transport / hytte */}
                <div className="flex gap-2 bg-muted rounded-xl p-1 w-fit">
                  <button
                    onClick={() => setRequestType('transport')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      requestType === 'transport' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Anchor className="w-4 h-4 inline mr-2" />
                    {t('transport_label') || 'Transport'}
                    {openTransportRequests.length > 0 && (
                      <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs rounded-full px-1.5">{openTransportRequests.length}</span>
                    )}
                  </button>
                  <button
                    onClick={() => setRequestType('cabin')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      requestType === 'cabin' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Home className="w-4 h-4 inline mr-2" />
                    {t('cabin') || 'Hytte'}
                    {openCabinRequests.length > 0 && (
                      <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs rounded-full px-1.5">{openCabinRequests.length}</span>
                    )}
                  </button>
                </div>

                {/* Content */}
                {requestType === 'transport' ? (
                  <OpenRequestsList
                    nearby={nearbyTransport}
                    others={otherTransport}
                    userHomeCity={userHomeCity}
                    type="transport"
                    t={t}
                  />
                ) : (
                  <OpenRequestsList
                    nearby={nearbyCabin}
                    others={otherCabin}
                    userHomeCity={userHomeCity}
                    type="cabin"
                    t={t}
                  />
                )}
              </div>
            </TabsContent>
          )}

          {/* ── TAB 4: ANNONCER & KALENDER ───────────────────────────────── */}
          {isProvider && (
            <TabsContent value="listings">
              <div className="space-y-8">

                {/* Listings */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">{t('my_listings')}</h3>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/create-listing')} className="text-primary gap-1">
                      <PlusCircle className="w-3.5 h-3.5" /> {t('add')}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {myCabins.map(c => (
                      <div key={c.id} className="bg-white rounded-xl border border-border p-4 flex gap-4 items-center">
                        <img
                          src={c.images?.[0] || 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=100&h=80&fit=crop'}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Home className="w-3.5 h-3.5 text-primary shrink-0" />
                            <p className="font-semibold text-sm text-foreground truncate">{c.title}</p>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />{c.location}
                          </p>
                          <p className="text-xs font-medium text-primary mt-1">{c.price_per_night} DKK/{t('per_night') || 'nat'}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/cabins/${c.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {myTransports.map(tr => (
                      <div key={tr.id} className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                          <Ship className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                            <span className="truncate">{tr.from_location}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{tr.to_location}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(tr.departure_date), 'd. MMM yyyy')} · {tr.seats_available} {t('seats_plural') || 'pladser'}
                          </p>
                        </div>
                        <Badge className={`${STATUS_COLORS[tr.status] || 'bg-gray-100 text-gray-500'} border-0`}>
                          {statusLabel(tr.status, t)}
                        </Badge>
                      </div>
                    ))}
                    {myCabins.length === 0 && myTransports.length === 0 && (
                      <EmptyState
                        icon={Home}
                        message={t('no_listings')}
                        cta={t('create_listing')}
                        ctaHref="/create-listing"
                      />
                    )}
                  </div>
                </div>

                {/* Trust score */}
                {(myCabins.length > 0 || myTransports.length > 0) && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">{t('my_trust_score')}</h3>
                    <ProviderTrustCard providerEmail={user.email} />
                  </div>
                )}

                {/* Kalender */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3">{t('calendar')}</h3>
                  <HostCalendarTab />
                </div>

                {/* Anmeldelser */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {t('reviews')}
                    {avgRating && (
                      <span className="text-sm font-normal text-muted-foreground">
                        — {t('avg_rating')} {avgRating} ★
                      </span>
                    )}
                  </h3>
                  {myRatingsReceived.length === 0 ? (
                    <p className="text-sm text-muted-foreground bg-muted rounded-xl p-4">{t('no_reviews')}</p>
                  ) : (
                    <div className="space-y-3">
                      {myRatingsReceived.map(r => <RatingRow key={r.id} rating={r} t={t} />)}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          )}

          {/* ── TAB 5: MIN INDBAKKE ──────────────────────────────────────── */}
          {isProvider && (
            <TabsContent value="provider">
              <ProviderOverviewTab
                cabinRequests={allCabinRequests}
                transportRequests={allTransportRequests}
                hostBookings={hostBookings}
                userEmail={user.email}
                t={t}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

// ── OpenRequestsList ──────────────────────────────────────────────────────────
function OpenRequestsList({ nearby, others, userHomeCity, type, t }) {
  const totalNearby = nearby.length;
  const totalOthers = others.length;
  const totalAll = totalNearby + totalOthers;

  if (totalAll === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-border">
        <Inbox className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium mb-1">
          {type === 'transport' ? t('no_transport_requests') : t('no_cabin_requests')}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('requests_appear_here')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Nearby */}
      {totalNearby > 0 && userHomeCity && (
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
            {t('near_you')} — {userHomeCity}
          </p>
          <div className="space-y-3">
            {nearby.map(r => (
              type === 'transport'
                ? <TransportRequestCard key={r.id} r={r} t={t} highlight />
                : <CabinRequestCard key={r.id} r={r} t={t} highlight />
            ))}
          </div>
        </div>
      )}

      {/* Others */}
      {totalOthers > 0 && (
        <div>
          {userHomeCity && totalNearby > 0 && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {t('other_regions')}
            </p>
          )}
          <div className="space-y-3">
            {others.map(r => (
              type === 'transport'
                ? <TransportRequestCard key={r.id} r={r} t={t} />
                : <CabinRequestCard key={r.id} r={r} t={t} />
            ))}
          </div>
        </div>
      )}

      {/* No city set — show all */}
      {!userHomeCity && (
        <div className="space-y-3">
          {[...nearby, ...others].map(r => (
            type === 'transport'
              ? <TransportRequestCard key={r.id} r={r} t={t} />
              : <CabinRequestCard key={r.id} r={r} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TransportRequestCard({ r, t, highlight }) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${highlight ? 'border-primary/30 shadow-sm' : 'border-border'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <Anchor className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{r.from_location} → {r.to_location}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{r.guest_name || r.guest_email}</p>
            <p className="text-xs text-muted-foreground">
              {r.travel_date ? format(new Date(r.travel_date), 'd. MMM yyyy') : '—'}
              {r.passengers ? ` · ${r.passengers} ${t('passengers')}` : ''}
            </p>
          </div>
        </div>
        <Badge className="bg-amber-100 text-amber-700 border-0 shrink-0">
          {capitalizeFirst(t('status_open'))}
        </Badge>
      </div>
    </div>
  );
}

function CabinRequestCard({ r, t, highlight }) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${highlight ? 'border-primary/30 shadow-sm' : 'border-border'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <Home className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{r.location}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{r.guest_name || r.guest_email}</p>
            <p className="text-xs text-muted-foreground">
              {r.check_in ? format(new Date(r.check_in), 'd. MMM') : '—'}
              {r.check_out ? ` – ${format(new Date(r.check_out), 'd. MMM yyyy')}` : ''}
              {r.guests ? ` · ${r.guests} ${t('guests')}` : ''}
            </p>
          </div>
        </div>
        <Badge className="bg-amber-100 text-amber-700 border-0 shrink-0">
          {capitalizeFirst(t('status_open'))}
        </Badge>
      </div>
    </div>
  );
}

// ── BookingRow ────────────────────────────────────────────────────────────────
function BookingRow({ booking, isHost, t, onConfirm, onDecline }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <button
        className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${booking.type === 'cabin' ? 'bg-primary/10' : 'bg-accent/10'}`}>
            {booking.type === 'cabin' ? <Home className="w-4 h-4 text-primary" /> : <Anchor className="w-4 h-4 text-accent" />}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{booking.listing_title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isHost
                ? `${t('from')}: ${booking.guest_name || booking.guest_email}`
                : `${t('booked')} ${format(new Date(booking.created_date), 'd. MMM yyyy')}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-500'} border-0 text-xs`}>
            {statusLabel(booking.status, t)}
          </Badge>
          {booking.total_price > 0 && (
            <span className="text-sm font-bold text-foreground">{booking.total_price} DKK</span>
          )}
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 sm:px-5 pb-5 border-t border-border pt-4">
          {(booking.check_in || booking.guests || booking.seats) && (
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
              {booking.check_in && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(booking.check_in), 'd. MMM')}
                  {booking.check_out && ` – ${format(new Date(booking.check_out), 'd. MMM yyyy')}`}
                </span>
              )}
              {booking.guests && (
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />{booking.guests} {t('guests')}
                </span>
              )}
              {booking.seats && (
                <span className="flex items-center gap-1">
                  <Anchor className="w-3.5 h-3.5" />{booking.seats} {t('seats_plural')}
                </span>
              )}
            </div>
          )}

          {booking.message && (
            <p className="text-xs text-muted-foreground bg-muted rounded-lg p-2.5 italic mb-3">"{booking.message}"</p>
          )}

          {!isHost && <div className="mb-3"><BookingReviewButton booking={booking} /></div>}

          {isHost && booking.status === 'pending' && (
            <div className="flex gap-2">
              <Button size="sm" onClick={onConfirm} className="bg-primary text-white hover:bg-primary/90 rounded-lg gap-1.5">
                <Check className="w-3.5 h-3.5" /> {t('confirm')}
              </Button>
              <Button size="sm" variant="outline" onClick={onDecline} className="rounded-lg gap-1.5 text-destructive border-destructive/30 hover:bg-destructive hover:text-white">
                <X className="w-3.5 h-3.5" /> {t('decline')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── RatingRow ─────────────────────────────────────────────────────────────────
function RatingRow({ rating, showTo, t = () => '' }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-xs text-muted-foreground">
            {showTo ? `${t('to')}: ${rating.to_email}` : `${t('from')}: ${rating.from_email}`}
            {' · '}{rating.request_type === 'transport' ? t('transport_label') : t('cabin')}
          </p>
          <div className="flex gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map(n => (
              <Star key={n} className={`w-4 h-4 ${n <= rating.stars ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
            ))}
          </div>
          {rating.comment && (
            <p className="text-sm text-muted-foreground mt-1.5 italic">"{rating.comment}"</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
function EmptyState({ icon: IconComponent, message, cta, ctaHref }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-border">
      <IconComponent className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground font-medium mb-4">{message}</p>
      <Button variant="outline" onClick={() => window.location.href = ctaHref} className="rounded-xl px-6">
        {cta}
      </Button>
    </div>
  );
}