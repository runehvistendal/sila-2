import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Home, Anchor, Calendar, MapPin, Users, Check, X, ArrowRight, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { IncomingRequestsTab, MyTransportRequestsTab } from '@/components/dashboard/TransportRequestsTab';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
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

  const updateBooking = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Booking.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries(['host-bookings']);
      qc.invalidateQueries(['my-bookings']);
      toast({ title: 'Booking updated' });
    },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Welcome back, {user.full_name || user.email}</p>
          </div>
          <Button onClick={() => navigate('/create-listing')} className="bg-primary text-white hover:bg-primary/90 rounded-xl gap-2">
            <PlusCircle className="w-4 h-4" /> New listing
          </Button>
        </div>

        <Tabs defaultValue="bookings">
          <TabsList className="mb-8 bg-muted rounded-xl p-1 h-auto flex-wrap gap-1">
            <TabsTrigger value="bookings" className="rounded-lg px-4 py-2 text-sm">Mine bookinger</TabsTrigger>
            <TabsTrigger value="requests" className="rounded-lg px-4 py-2 text-sm">
              Bookingforespørgsler
              {hostBookings.filter((b) => b.status === 'pending').length > 0 && (
                <span className="ml-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {hostBookings.filter((b) => b.status === 'pending').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="transport-requests" className="rounded-lg px-4 py-2 text-sm">Mine transportforespørgsler</TabsTrigger>
            <TabsTrigger value="incoming-transport" className="rounded-lg px-4 py-2 text-sm">Tilbud (aktør)</TabsTrigger>
            <TabsTrigger value="listings" className="rounded-lg px-4 py-2 text-sm">Mine opslag</TabsTrigger>
          </TabsList>

          {/* MY BOOKINGS */}
          <TabsContent value="bookings">
            {myBookings.length === 0 ? (
              <EmptyState icon={Calendar} message="Du har ingen bookinger endnu" cta="Udforsk hytter" ctaHref="/cabins" />
            ) : (
              <div className="space-y-3">
                {myBookings.map((b) => (
                  <BookingRow key={b.id} booking={b} isHost={false} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* TRANSPORT REQUESTS (guest) */}
          <TabsContent value="transport-requests">
            <MyTransportRequestsTab />
          </TabsContent>

          {/* INCOMING TRANSPORT REQUESTS (provider) */}
          <TabsContent value="incoming-transport">
            <IncomingRequestsTab />
          </TabsContent>

          {/* HOST BOOKING REQUESTS */}
          <TabsContent value="requests">
            {hostBookings.length === 0 ? (
              <EmptyState icon={Users} message="Ingen bookingforespørgsler endnu" cta="Opret et opslag" ctaHref="/create-listing" />
            ) : (
              <div className="space-y-3">
                {hostBookings.map((b) => (
                  <BookingRow
                    key={b.id}
                    booking={b}
                    isHost={true}
                    onConfirm={() => updateBooking.mutate({ id: b.id, status: 'confirmed' })}
                    onDecline={() => updateBooking.mutate({ id: b.id, status: 'declined' })}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* MY LISTINGS */}
          <TabsContent value="listings">
            <div className="space-y-6">
              {/* Cabins */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Cabins</h3>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/create-listing')} className="text-primary gap-1">
                    <PlusCircle className="w-3.5 h-3.5" /> Add
                  </Button>
                </div>
                {myCabins.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-muted rounded-xl p-4">No cabin listings yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {myCabins.map((c) => (
                      <div key={c.id} className="bg-white rounded-xl border border-border p-4 flex gap-4 items-center">
                        <img src={c.images?.[0] || 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=100&h=80&fit=crop'} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{c.title}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{c.location}</p>
                          <p className="text-xs font-medium text-primary mt-1">{c.price_per_night} DKK/night</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/cabins/${c.id}`)} className="shrink-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Transports */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Transport routes</h3>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/create-listing?type=transport')} className="text-primary gap-1">
                    <PlusCircle className="w-3.5 h-3.5" /> Add
                  </Button>
                </div>
                {myTransports.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-muted rounded-xl p-4">No transport listings yet.</p>
                ) : (
                  <div className="space-y-3">
                    {myTransports.map((t) => (
                      <div key={t.id} className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                          <Anchor className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                            <span className="truncate">{t.from_location}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{t.to_location}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(t.departure_date), 'MMM d, yyyy')} · {t.seats_available} seats · {t.price_per_seat} DKK</p>
                        </div>
                        <Badge className={t.status === 'scheduled' ? 'bg-green-100 text-green-700 border-0' : 'bg-gray-100 text-gray-500 border-0'}>
                          {t.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function BookingRow({ booking, isHost, onConfirm, onDecline }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${booking.type === 'cabin' ? 'bg-primary/10' : 'bg-accent/10'}`}>
            {booking.type === 'cabin' ? <Home className="w-4 h-4 text-primary" /> : <Anchor className="w-4 h-4 text-accent" />}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{booking.listing_title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isHost ? `From: ${booking.guest_name || booking.guest_email}` : `Booked on ${format(new Date(booking.created_date), 'MMM d, yyyy')}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${STATUS_COLORS[booking.status]} border-0 text-xs`}>{booking.status}</Badge>
          {booking.total_price > 0 && (
            <span className="text-sm font-bold text-foreground">{booking.total_price} DKK</span>
          )}
        </div>
      </div>

      {(booking.check_in || booking.guests) && (
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
          {booking.check_in && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(booking.check_in), 'MMM d')} – {booking.check_out ? format(new Date(booking.check_out), 'MMM d, yyyy') : '...'}</span>}
          {booking.guests && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</span>}
          {booking.seats && <span className="flex items-center gap-1"><Anchor className="w-3.5 h-3.5" />{booking.seats} seat{booking.seats !== 1 ? 's' : ''}</span>}
        </div>
      )}

      {booking.message && (
        <p className="mt-3 text-xs text-muted-foreground bg-muted rounded-lg p-2.5 italic">"{booking.message}"</p>
      )}

      {isHost && booking.status === 'pending' && (
        <div className="flex gap-2 mt-4">
          <Button size="sm" onClick={onConfirm} className="bg-primary text-white hover:bg-primary/90 rounded-lg gap-1.5">
            <Check className="w-3.5 h-3.5" /> Confirm
          </Button>
          <Button size="sm" variant="outline" onClick={onDecline} className="rounded-lg gap-1.5 text-destructive border-destructive/30 hover:bg-destructive hover:text-white">
            <X className="w-3.5 h-3.5" /> Decline
          </Button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: EmptyIcon, message, cta, ctaHref }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-border">
      <EmptyIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground font-medium mb-4">{message}</p>
      <Button variant="outline" onClick={() => window.location.href = ctaHref} className="rounded-xl px-6">{cta}</Button>
    </div>
  );
}