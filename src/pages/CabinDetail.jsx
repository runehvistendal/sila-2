import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import CabinReviews from '@/components/cabins/CabinReviews';
import CabinAvailabilityCalendar from '@/components/cabins/CabinAvailabilityCalendar';
import StripeCheckoutButton from '@/components/bookings/StripeCheckoutButton';
import CabinTransportSection from '@/components/cabins/CabinTransportSection';
import { MapPin, Users, Anchor, ChevronLeft, Check, User } from 'lucide-react';
import CabinImageGallery from '@/components/cabins/CabinImageGallery';

export default function CabinDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState('');
  const [hostTransportCost, setHostTransportCost] = useState(0);

  const { data: cabin, isLoading } = useQuery({
    queryKey: ['cabin', id],
    queryFn: () => base44.entities.Cabin.filter({ id }, null, 1).then((r) => r[0]),
  });

  const { data: transports = [] } = useQuery({
    queryKey: ['transport-for-cabin', cabin?.location],
    queryFn: () =>
      base44.entities.Transport.filter({ status: 'scheduled' }, '-departure_date', 10),
    enabled: !!cabin,
    select: (data) =>
      data.filter(
        (t) =>
          t.to_location?.toLowerCase().includes(cabin?.location?.toLowerCase()) ||
          t.linked_cabin_id === id
      ),
  });

  
  if (isLoading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!cabin) {
    return (
      <div className="min-h-screen pt-16 flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Cabin not found</p>
        <Button onClick={() => navigate('/cabins')}>Back to cabins</Button>
      </div>
    );
  }


  const nights =
    checkIn && checkOut
      ? Math.max(0, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))
      : 0;
  const cabinTotal = nights * cabin.price_per_night;
  const total = cabinTotal + hostTransportCost;

  const stripePayload = nights > 0 ? {
    bookingType: 'cabin',
    listingId: cabin?.id,
    listingTitle: cabin?.title,
    checkIn,
    checkOut,
    guests,
    totalPrice: total,
    hostEmail: cabin?.host_email || '',
    message,
  } : null;

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <button onClick={() => navigate('/cabins')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to cabins
        </button>

        {/* Title row */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{cabin.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{cabin.location}</span>
            {cabin.max_guests && <span className="flex items-center gap-1"><Users className="w-4 h-4" />Up to {cabin.max_guests} guests</span>}
            {cabin.host_provides_transport && (
              <Badge className="bg-primary/10 text-primary border-0 gap-1">
                <Anchor className="w-3 h-3" /> Host provides transport
              </Badge>
            )}
          </div>
        </div>

        {/* Images */}
        <CabinImageGallery images={cabin.images} title={cabin.title} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left — details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">About this cabin</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{cabin.description || 'No description provided.'}</p>
            </div>

            {/* Amenities */}
            {cabin.amenities?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">What's included</h2>
                <div className="grid grid-cols-2 gap-3">
                  {cabin.amenities.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-accent shrink-0" />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transport section */}
            <CabinTransportSection
              cabin={cabin}
              transports={transports}
              guests={guests}
              onTransportCostChange={setHostTransportCost}
            />

            {/* Availability Calendar */}
            <CabinAvailabilityCalendar
              cabinId={id}
              checkIn={checkIn}
              checkOut={checkOut}
              onCheckInChange={setCheckIn}
              onCheckOutChange={setCheckOut}
            />

            {/* Host profile */}
            {cabin.host_name && (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-3">Din vært</h2>
                <button
                  onClick={() => navigate(`/profile/user?email=${encodeURIComponent(cabin.host_email)}&type=host`)}
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-border hover:border-primary/30 hover:shadow-card transition-all w-full text-left"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {cabin.host_avatar ? (
                      <img src={cabin.host_avatar} alt={cabin.host_name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{cabin.host_name}</p>
                    <p className="text-sm text-primary underline-offset-2">Se profil →</p>
                  </div>
                </button>
              </div>
            )}

            {/* Reviews */}
            <CabinReviews
              cabinId={cabin.id}
              hostEmail={cabin.host_email}
              hostName={cabin.host_name}
              currentUserEmail={user?.email}
            />
          </div>

          {/* Right — booking card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-border shadow-card p-6 sticky top-24">
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-2xl font-bold text-foreground">{cabin.price_per_night}</span>
                <span className="text-muted-foreground text-sm">DKK / night</span>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Check-in</label>
                  <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="rounded-xl" min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Check-out</label>
                  <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="rounded-xl" min={checkIn || new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Guests</label>
                  <Input
                    type="number"
                    min={1}
                    max={cabin.max_guests || 20}
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Message to host (optional)</label>
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell the host about your trip..." rows={3} className="rounded-xl resize-none" />
                </div>
              </div>

              {nights > 0 && (
                <div className="bg-muted rounded-xl p-4 mb-4 text-sm space-y-1.5">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{cabin.price_per_night} DKK × {nights} nat</span>
                    <span>{cabinTotal} DKK</span>
                  </div>
                  {hostTransportCost > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Transport</span>
                      <span>{hostTransportCost} DKK</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border">
                    <span>Total</span>
                    <span>{total} DKK</span>
                  </div>
                </div>
              )}

              {!user ? (
                <Button onClick={() => base44.auth.redirectToLogin()} className="w-full h-12 bg-primary text-white hover:bg-primary/90 rounded-xl font-semibold text-base">
                  Log ind for at booke
                </Button>
              ) : (
                <StripeCheckoutButton
                  payload={stripePayload}
                  disabled={!stripePayload}
                  label={nights > 0 ? `Betal ${total} DKK` : 'Vælg datoer for at booke'}
                />
              )}
              <p className="text-xs text-muted-foreground text-center mt-3">Sikker betaling via Stripe</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}