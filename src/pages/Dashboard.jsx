import React, { useState } from 'react';
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
  ArrowRight, Eye, Star, ChevronRight, Briefcase, Clock, Ship, ChevronDown, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { IncomingRequestsTab, MyTransportRequestsTab } from '@/components/dashboard/TransportRequestsTab';
import { IncomingCabinRequestsTab, MyCabinRequestsTab } from '@/components/dashboard/CabinRequestsTab';
import HostCalendarTab from '@/components/dashboard/HostCalendarTab';
import OpenRequestsTab from '@/components/dashboard/OpenRequestsTab';
import BookingReviewButton from '@/components/bookings/BookingReviewButton';
import ProviderTrustCard from '@/components/provider/ProviderTrustCard';
import { GREENLAND_LOCATIONS } from '@/lib/greenlandLocations';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  on_hold: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  completed: 'bg-blue-100 text-blue-700',
};

const STATUS_LABELS = {
  pending: 'Afventer',
  on_hold: 'På hold',
  confirmed: 'Bekræftet',
  declined: 'Afvist',
  cancelled: 'Annulleret',
  completed: 'Afsluttet',
};

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

// Build city coordinates from GREENLAND_LOCATIONS
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
  const [requestType, setRequestType] = useState('transport'); // 'transport' or 'cabin'
  const [searchInput, setSearchInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings');

  const CITIES = Object.keys(CITY_COORDS);

  // Get user's home city (or set as default)
  const userHomeCity = user?.location || '';
  const [selectedCity, setSelectedCity] = useState(userHomeCity);

  // Find matching cities based on search input
  const matchingCities = searchInput.trim() === '' 
    ? CITIES
    : CITIES.filter(city =>
        city.toLowerCase().includes(searchInput.toLowerCase())
      );

  // Sort cities by distance from user's home city
  const sortedCities = matchingCities.sort((a, b) => {
    if (!userHomeCity) return 0;
    const homeCoords = CITY_COORDS[userHomeCity];
    if (!homeCoords) return 0;
    const distA = calculateDistance(homeCoords.lat, homeCoords.lon, CITY_COORDS[a].lat, CITY_COORDS[a].lon);
    const distB = calculateDistance(homeCoords.lat, homeCoords.lon, CITY_COORDS[b].lat, CITY_COORDS[b].lon);
    return distA - distB;
  });

  const { data: myBookings = [] } = useQuery({
    queryKey: ['my-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ guest_email: user.email }, '-created_date', 30),
    enabled: !!user,
  });

  const { data: hostBookings = [] } = useQuery({
    queryKey: ['host-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ host_email: user.email }, '-created_date', 30),
    enabled: !!user,
  });

  const { data: myCabins = [] } = useQuery({
    queryKey: ['my-cabins', user?.email],
    queryFn: () => base44.entities.Cabin.filter({ host_email: user.email }, '-created_date', 20),
    enabled: !!user,
  });

  const { data: myTransports = [] } = useQuery({
    queryKey: ['my-transports', user?.email],
    queryFn: () => base44.entities.Transport.filter({ provider_email: user.email }, '-departure_date', 20),
    enabled: !!user,
  });

  const { data: myRatingsGiven = [] } = useQuery({
    queryKey: ['my-ratings-given', user?.email],
    queryFn: () => base44.entities.Rating.filter({ from_email: user.email }, '-created_date', 20),
    enabled: !!user,
  });

  const { data: myRatingsReceived = [] } = useQuery({
    queryKey: ['my-ratings-received', user?.email],
    queryFn: () => base44.entities.Rating.filter({ to_email: user.email }, '-created_date', 20),
    enabled: !!user,
  });

  const { data: allCabinRequests = [] } = useQuery({
    queryKey: ['all-cabin-requests'],
    queryFn: () => base44.entities.CabinRequest.filter({}, '-created_date', 100),
    enabled: !!user,
  });

  const { data: allTransportRequests = [] } = useQuery({
    queryKey: ['all-transport-requests'],
    queryFn: () => base44.entities.TransportRequest.filter({}, '-created_date', 100),
    enabled: !!user,
  });

  const updateBooking = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Booking.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries(['host-bookings']);
      qc.invalidateQueries(['my-bookings']);
      toast({ title: 'Booking opdateret' });
    },
  });

  const pendingHostBookings = hostBookings.filter((b) => b.status === 'pending').length;
  const userRoleType = user?.role_type || 'traveler';
  const isProvider = userRoleType === 'provider' || userRoleType === 'both';
  const isTraveler = userRoleType === 'traveler' || userRoleType === 'both';

  if (!user) return null;

  const avgRating = myRatingsReceived.length > 0
    ? (myRatingsReceived.reduce((s, r) => s + r.stars, 0) / myRatingsReceived.length).toFixed(1)
    : null;

  // Determine default tab
  const defaultTab = 'bookings';

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
              {isProvider && (
                <Button variant="outline" onClick={() => setActiveTab('open-requests')} className="rounded-xl gap-2 text-sm">
                  <DollarSign className="w-4 h-4" /> {t('see_open_requests')}
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/request-cabin')} className="rounded-xl gap-2 text-sm">
                <MapPin className="w-4 h-4" /> {t('request_cabin_btn')}
              </Button>
              <Button variant="outline" onClick={() => navigate('/request-transport')} className="rounded-xl gap-2 text-sm">
                <Anchor className="w-4 h-4" /> {t('request_transport_btn')}
              </Button>
              <Button onClick={() => navigate('/create-listing')} className="bg-primary text-white hover:bg-primary/90 rounded-xl gap-2 text-sm">
                <PlusCircle className="w-4 h-4" /> {t('new_listing')}
              </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 bg-muted rounded-xl p-1 h-auto flex-wrap gap-1">
             <TabsTrigger value="bookings" className="rounded-lg px-4 py-2 text-sm gap-2">
               <Calendar className="w-4 h-4" /> {t('my_bookings')}
               {pendingHostBookings > 0 && (
                 <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                   {pendingHostBookings}
                 </span>
               )}
             </TabsTrigger>
             <TabsTrigger value="requests" className="rounded-lg px-4 py-2 text-sm gap-2">
               <Clock className="w-4 h-4" /> {t('my_requests')}
             </TabsTrigger>
             {isProvider && (
               <>
                 <TabsTrigger value="provider" className="rounded-lg px-4 py-2 text-sm gap-2">
                   <Briefcase className="w-4 h-4" /> {t('provider_tab')}
                 </TabsTrigger>
               </>
             )}
             <TabsTrigger value="history" className="rounded-lg px-4 py-2 text-sm gap-2">
               <Clock className="w-4 h-4" /> {t('history')}
             </TabsTrigger>
             {isProvider && (
               <TabsTrigger value="kalender" className="rounded-lg px-4 py-2 text-sm gap-2">
                 <Calendar className="w-4 h-4" /> {t('calendar')}
               </TabsTrigger>
             )}
           </TabsList>

          {/* MY BOOKINGS */}
          <TabsContent value="bookings">
            <div className="space-y-6">
              {/* Active bookings as guest */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">{t('my_bookings_guest')}</h3>
                {myBookings.length === 0 ? (
                  <EmptyState icon={Calendar} message={t('no_bookings')} cta={t('explore_cabins')} ctaHref="/cabins" />
                ) : (
                  <div className="space-y-3">
                    {myBookings.map((b) => <BookingRow key={b.id} booking={b} isHost={false} t={t} />)}
                  </div>
                )}
              </div>

              {/* Booking requests as host/skipper */}
              {(isProvider) && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">
                    {t('booking_requests_provider')}
                    {pendingHostBookings > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs">{pendingHostBookings}</span>
                    )}
                  </h3>
                  {hostBookings.length === 0 ? (
                    <p className="text-sm text-muted-foreground bg-muted rounded-xl p-4">{t('no_booking_requests')}</p>
                  ) : (
                    <div className="space-y-3">
                      {hostBookings.map((b) => (
                        <BookingRow
                          key={b.id}
                          booking={b}
                          isHost
                          t={t}
                          onConfirm={() => updateBooking.mutate({ id: b.id, status: 'confirmed' })}
                          onDecline={() => updateBooking.mutate({ id: b.id, status: 'declined' })}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* MY REQUESTS */}
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

          {/* OPEN REQUESTS — for providers */}
          {isProvider && (
            <TabsContent value="open-requests">
              <OpenRequestsTab />
            </TabsContent>
          )}

          {/* OLD ALL REQUESTS — hidden */}
          {isProvider && (
            <TabsContent value="all-requests" className="hidden">
              <div className="space-y-6">
                {/* Toggle buttons */}
                <div className="flex gap-2 bg-muted rounded-xl p-1 w-fit">
                  <button
                    onClick={() => setRequestType('transport')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      requestType === 'transport'
                        ? 'bg-white text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Anchor className="w-4 h-4 inline mr-2" />
                    Transport
                  </button>
                  <button
                    onClick={() => setRequestType('cabin')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      requestType === 'cabin'
                        ? 'bg-white text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Home className="w-4 h-4 inline mr-2" />
                    Hytte
                  </button>
                </div>

                {/* City filter autocomplete dropdown */}
                <div className="max-w-xs relative">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={selectedCity || 'Søg efter by eller postnr...'}
                      value={searchInput}
                      onChange={(e) => {
                        setSearchInput(e.target.value);
                        setDropdownOpen(true);
                      }}
                      onFocus={() => setDropdownOpen(true)}
                      className="w-full px-4 py-2 pr-9 rounded-xl border border-input bg-white text-sm"
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                  
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-input rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
                      {selectedCity && (
                        <button
                          onClick={() => {
                            setSelectedCity('');
                            setSearchInput('');
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted border-b border-border"
                        >
                          Alle byer
                        </button>
                      )}
                      {sortedCities.map((city) => (
                        <button
                          key={city}
                          onClick={() => {
                            setSelectedCity(city);
                            setSearchInput('');
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            selectedCity === city
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                      {sortedCities.length === 0 && (
                        <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                          Ingen byer fundet
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {selectedCity && (
                  <button
                    onClick={() => setSelectedCity('')}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Ryd filter
                  </button>
                )}

                {/* Display transport or cabin requests */}
                <div className="space-y-3">
                  {requestType === 'transport'
                    ? allTransportRequests
                        .filter((r) => !selectedCity || r.from_location === selectedCity || r.to_location === selectedCity)
                        .map((r) => (
                          <div key={r.id} className="bg-white rounded-xl border border-border p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-sm text-foreground">{r.from_location} → {r.to_location}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{r.guest_name || r.guest_email}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(r.travel_date), 'd. MMM yyyy')} · {r.passengers} passagerer</p>
                              </div>
                              <Badge className={r.status === 'pending' ? 'bg-amber-100 text-amber-700 border-0' : 'bg-gray-100 text-gray-500 border-0'}>{r.status}</Badge>
                            </div>
                          </div>
                        ))
                    : allCabinRequests
                        .filter((r) => !selectedCity || r.location === selectedCity)
                        .map((r) => (
                          <div key={r.id} className="bg-white rounded-xl border border-border p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-sm text-foreground">{r.location}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{r.guest_name || r.guest_email}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(r.check_in), 'd. MMM')} – {format(new Date(r.check_out), 'd. MMM yyyy')} · {r.guests} gæster</p>
                              </div>
                              <Badge className={r.status === 'pending' ? 'bg-amber-100 text-amber-700 border-0' : 'bg-gray-100 text-gray-500 border-0'}>{r.status}</Badge>
                            </div>
                          </div>
                        ))}
                  {(requestType === 'transport'
                    ? allTransportRequests.filter((r) => !selectedCity || r.from_location === selectedCity || r.to_location === selectedCity)
                    : allCabinRequests.filter((r) => !selectedCity || r.location === selectedCity)
                  ).length === 0 && (
                    <p className="text-sm text-muted-foreground bg-muted rounded-xl p-4">Ingen anmodninger fundet</p>
                  )}
                </div>
              </div>
            </TabsContent>
          )}

          {/* PROVIDER */}
          {isProvider && (
            <TabsContent value="provider">
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
                    {myCabins.map((c) => (
                      <div key={c.id} className="bg-white rounded-xl border border-border p-4 flex gap-4 items-center">
                        <img src={c.images?.[0] || 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=100&h=80&fit=crop'} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Home className="w-3.5 h-3.5 text-primary shrink-0" />
                            <p className="font-semibold text-sm text-foreground truncate">{c.title}</p>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{c.location}</p>
                          <p className="text-xs font-medium text-primary mt-1">{c.price_per_night} DKK/nat</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/cabins/${c.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {myTransports.map((t) => (
                      <div key={t.id} className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                          <Ship className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                            <span className="truncate">{t.from_location}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{t.to_location}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(t.departure_date), 'd. MMM yyyy')} · {t.seats_available} pladser</p>
                        </div>
                        <Badge className={t.status === 'scheduled' ? 'bg-green-100 text-green-700 border-0' : 'bg-gray-100 text-gray-500 border-0'}>{t.status}</Badge>
                      </div>
                    ))}
                    {myCabins.length === 0 && myTransports.length === 0 && (
                      <p className="text-sm text-muted-foreground bg-muted rounded-xl p-4">{t('no_listings')}</p>
                    )}
                  </div>
                </div>

                {/* Incoming requests */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3">{t('incoming_cabin_requests')}</h3>
                  <IncomingCabinRequestsTab />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-3">{t('incoming_transport_requests')}</h3>
                  <IncomingRequestsTab />
                </div>

                {/* Trust score */}
                {myTransports.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">{t('my_trust_score')}</h3>
                    <ProviderTrustCard providerEmail={user.email} />
                  </div>
                )}

                {/* Ratings */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {t('ratings')}
                    {avgRating && <span className="text-sm font-normal text-muted-foreground">— {t('avg_rating')} {avgRating} ★</span>}
                  </h3>
                  {myRatingsReceived.length === 0 ? (
                    <p className="text-sm text-muted-foreground bg-muted rounded-xl p-4">{t('no_received_ratings')}</p>
                  ) : (
                    <div className="space-y-3">
                      {myRatingsReceived.map((r) => <RatingRow key={r.id} rating={r} />)}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          )}

          {/* HISTORY */}
          <TabsContent value="history">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground mb-3">{t('purchase_history')}</h3>
              {myBookings.filter(b => ['completed', 'confirmed'].includes(b.status)).length === 0 ? (
                <EmptyState icon={Clock} message={t('no_history')} cta={t('explore_cabins')} ctaHref="/cabins" />
              ) : (
                <div className="space-y-3">
                  {myBookings
                    .filter(b => ['completed', 'confirmed'].includes(b.status))
                    .map((b) => <BookingRow key={b.id} booking={b} isHost={false} t={t} />)
                  }
                </div>
              )}
            </div>
          </TabsContent>

          {/* KALENDER */}
          {isProvider && (
            <TabsContent value="kalender">
              <HostCalendarTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

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
              {isHost ? `${t('from')}: ${booking.guest_name || booking.guest_email}` : `${t('booked')} ${format(new Date(booking.created_date), 'd. MMM yyyy')}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-500'} border-0 text-xs`}>
            {STATUS_LABELS[booking.status] || booking.status}
          </Badge>
          {booking.total_price > 0 && <span className="text-sm font-bold text-foreground">{booking.total_price} DKK</span>}
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
              {booking.guests && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{booking.guests} {t('guests')}</span>}
              {booking.seats && <span className="flex items-center gap-1"><Anchor className="w-3.5 h-3.5" />{booking.seats} {t('seats_plural')}</span>}
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
            {[1,2,3,4,5].map(n => (
              <Star key={n} className={`w-4 h-4 ${n <= rating.stars ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
            ))}
          </div>
          {rating.comment && <p className="text-sm text-muted-foreground mt-1.5 italic">"{rating.comment}"</p>}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: IconComponent, message, cta, ctaHref }) {
   return (
     <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-border">
       <IconComponent className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
       <p className="text-muted-foreground font-medium mb-4">{message}</p>
       <Button variant="outline" onClick={() => window.location.href = ctaHref} className="rounded-xl px-6">{cta}</Button>
     </div>
   );
 }

const STATUS_LABELS_TRANSLATED = {
  pending: 'labels.pending',
  on_hold: 'labels.on_hold',
  confirmed: 'labels.confirmed',
  declined: 'labels.declined',
  cancelled: 'labels.cancelled',
  completed: 'labels.completed',
};