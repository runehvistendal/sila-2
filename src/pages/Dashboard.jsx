import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PlusCircle, Home, Anchor, Calendar, MapPin, Users, Check, X,
  ArrowRight, Eye, Star, ChevronRight, Briefcase, Clock, Ship
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { IncomingRequestsTab, MyTransportRequestsTab } from '@/components/dashboard/TransportRequestsTab';
import { IncomingCabinRequestsTab, MyCabinRequestsTab } from '@/components/dashboard/CabinRequestsTab';
import HostCalendarTab from '@/components/dashboard/HostCalendarTab';
import BookingReviewButton from '@/components/bookings/BookingReviewButton';
import ProviderTrustCard from '@/components/provider/ProviderTrustCard';

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

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

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

  const updateBooking = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Booking.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries(['host-bookings']);
      qc.invalidateQueries(['my-bookings']);
      toast({ title: 'Booking opdateret' });
    },
  });

  const pendingHostBookings = hostBookings.filter((b) => b.status === 'pending').length;
  const isProvider = myCabins.length > 0 || myTransports.length > 0;

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
            <h1 className="text-2xl font-bold text-foreground">Mit overblik</h1>
            <p className="text-muted-foreground text-sm mt-1">Hej, {user.full_name || user.email}</p>
            {avgRating && (
              <div className="flex items-center gap-1 mt-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold text-foreground">{avgRating}</span>
                <span className="text-xs text-muted-foreground">({myRatingsReceived.length} bedømmelser)</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => navigate('/request-cabin')} className="rounded-xl gap-2 text-sm">
              <MapPin className="w-4 h-4" /> Anmod om hytte
            </Button>
            <Button variant="outline" onClick={() => navigate('/request-transport')} className="rounded-xl gap-2 text-sm">
              <Anchor className="w-4 h-4" /> Anmod om transport
            </Button>
            <Button onClick={() => navigate('/create-listing')} className="bg-primary text-white hover:bg-primary/90 rounded-xl gap-2 text-sm">
              <PlusCircle className="w-4 h-4" /> Nyt opslag
            </Button>
            {user?.role === 'admin' && (
              <Button variant="outline" onClick={() => navigate('/admin/legal')} className="rounded-xl gap-2 text-sm">
                Admin
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-8 bg-muted rounded-xl p-1 h-auto flex-wrap gap-1">
            <TabsTrigger value="bookings" className="rounded-lg px-4 py-2 text-sm gap-2">
              <Calendar className="w-4 h-4" /> Mine bookinger
              {pendingHostBookings > 0 && (
                <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingHostBookings}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="rounded-lg px-4 py-2 text-sm gap-2">
              <Clock className="w-4 h-4" /> Mine forespørgsler
            </TabsTrigger>
            {isProvider && (
              <TabsTrigger value="provider" className="rounded-lg px-4 py-2 text-sm gap-2">
                <Briefcase className="w-4 h-4" /> Udbyder
              </TabsTrigger>
            )}
            <TabsTrigger value="history" className="rounded-lg px-4 py-2 text-sm gap-2">
              <Clock className="w-4 h-4" /> Historik
            </TabsTrigger>
            {isProvider && (
              <TabsTrigger value="kalender" className="rounded-lg px-4 py-2 text-sm gap-2">
                <Calendar className="w-4 h-4" /> Kalender
              </TabsTrigger>
            )}
          </TabsList>

          {/* MINE BOOKINGER */}
          <TabsContent value="bookings">
            <div className="space-y-6">
              {/* Aktive bookinger som gæst */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Mine bookinger (gæst)</h3>
                {myBookings.length === 0 ? (
                  <EmptyState icon={Calendar} message="Ingen bookinger endnu" cta="Udforsk hytter" ctaHref="/cabins" />
                ) : (
                  <div className="space-y-3">
                    {myBookings.map((b) => <BookingRow key={b.id} booking={b} isHost={false} />)}
                  </div>
                )}
              </div>

              {/* Bookingforespørgsler som vært/skipper */}
              {(isProvider) && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">
                    Bookingforespørgsler (udbyder)
                    {pendingHostBookings > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs">{pendingHostBookings}</span>
                    )}
                  </h3>
                  {hostBookings.length === 0 ? (
                    <p className="text-sm text-muted-foreground bg-muted rounded-xl p-4">Ingen bookingforespørgsler endnu.</p>
                  ) : (
                    <div className="space-y-3">
                      {hostBookings.map((b) => (
                        <BookingRow
                          key={b.id}
                          booking={b}
                          isHost
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

          {/* MINE FORESPØRGSLER */}
          <TabsContent value="requests">
            <div className="space-y-8">
              <div>
                <h3 className="font-semibold text-foreground mb-3">Transportforespørgsler</h3>
                <MyTransportRequestsTab />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-3">Hytteforespørgsler</h3>
                <MyCabinRequestsTab />
              </div>
            </div>
          </TabsContent>

          {/* UDBYDER */}
          {isProvider && (
            <TabsContent value="provider">
              <div className="space-y-8">
                {/* Listings */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">Mine opslag</h3>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/create-listing')} className="text-primary gap-1">
                      <PlusCircle className="w-3.5 h-3.5" /> Tilføj
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
                      <p className="text-sm text-muted-foreground bg-muted rounded-xl p-4">Ingen opslag endnu.</p>
                    )}
                  </div>
                </div>

                {/* Incoming requests */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Hytteforespørgsler (host)</h3>
                  <IncomingCabinRequestsTab />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Transportforespørgsler (skipper)</h3>
                  <IncomingRequestsTab />
                </div>

                {/* Trust score */}
                {myTransports.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Min Trust Score</h3>
                    <ProviderTrustCard providerEmail={user.email} />
                  </div>
                )}

                {/* Bedømmelser */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Bedømmelser
                    {avgRating && <span className="text-sm font-normal text-muted-foreground">— snit {avgRating} ★</span>}
                  </h3>
                  {myRatingsReceived.length === 0 ? (
                    <p className="text-sm text-muted-foreground bg-muted rounded-xl p-4">Ingen modtagne bedømmelser endnu.</p>
                  ) : (
                    <div className="space-y-3">
                      {myRatingsReceived.map((r) => <RatingRow key={r.id} rating={r} />)}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          )}

          {/* HISTORIK */}
          <TabsContent value="history">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground mb-3">Købshistorik</h3>
              {myBookings.filter(b => ['completed', 'confirmed'].includes(b.status)).length === 0 ? (
                <EmptyState icon={Clock} message="Ingen historik endnu" cta="Udforsk hytter" ctaHref="/cabins" />
              ) : (
                <div className="space-y-3">
                  {myBookings
                    .filter(b => ['completed', 'confirmed'].includes(b.status))
                    .map((b) => <BookingRow key={b.id} booking={b} isHost={false} />)
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

function BookingRow({ booking, isHost, onConfirm, onDecline }) {
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
              {isHost ? `Fra: ${booking.guest_name || booking.guest_email}` : `Booket ${format(new Date(booking.created_date), 'd. MMM yyyy')}`}
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
              {booking.guests && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{booking.guests} gæst{booking.guests !== 1 ? 'er' : ''}</span>}
              {booking.seats && <span className="flex items-center gap-1"><Anchor className="w-3.5 h-3.5" />{booking.seats} plads{booking.seats !== 1 ? 'er' : ''}</span>}
            </div>
          )}

          {booking.message && (
            <p className="text-xs text-muted-foreground bg-muted rounded-lg p-2.5 italic mb-3">"{booking.message}"</p>
          )}

          {!isHost && <div className="mb-3"><BookingReviewButton booking={booking} /></div>}

          {isHost && booking.status === 'pending' && (
            <div className="flex gap-2">
              <Button size="sm" onClick={onConfirm} className="bg-primary text-white hover:bg-primary/90 rounded-lg gap-1.5">
                <Check className="w-3.5 h-3.5" /> Bekræft
              </Button>
              <Button size="sm" variant="outline" onClick={onDecline} className="rounded-lg gap-1.5 text-destructive border-destructive/30 hover:bg-destructive hover:text-white">
                <X className="w-3.5 h-3.5" /> Afvis
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RatingRow({ rating, showTo }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-xs text-muted-foreground">
            {showTo ? `Til: ${rating.to_email}` : `Fra: ${rating.from_email}`}
            {' · '}{rating.request_type === 'transport' ? 'Transport' : 'Hytte'}
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