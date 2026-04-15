import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ChevronLeft, Calendar, Clock, Users, Anchor } from 'lucide-react';
import { format } from 'date-fns';
import StripeCheckoutButton from '@/components/bookings/StripeCheckoutButton';
import TransportReviews from '@/components/transport/TransportReviews';

export default function TransportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [seats, setSeats] = useState(1);
  const [message, setMessage] = useState('');

  const { data: transport, isLoading } = useQuery({
    queryKey: ['transport', id],
    queryFn: () => base44.entities.Transport.filter({ id }, null, 1).then((r) => r[0]),
  });

  if (isLoading) return (
    <div className="min-h-screen pt-16 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!transport) return (
    <div className="min-h-screen pt-16 flex flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">Transport not found</p>
      <Button onClick={() => navigate('/transport')}>Back to transport</Button>
    </div>
  );

  const total = seats * transport.price_per_seat;

  const stripePayload = {
    bookingType: 'transport',
    listingId: transport.id,
    listingTitle: `${transport.from_location} → ${transport.to_location}`,
    checkIn: transport.departure_date,
    seats,
    totalPrice: total,
    hostEmail: transport.provider_email || '',
    message,
  };

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate('/transport')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to transport
        </button>

        <div className="bg-white rounded-2xl border border-border shadow-card p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Anchor className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xl font-bold text-foreground">
                <span>{transport.from_location}</span>
                <ArrowRight className="w-5 h-5 text-primary" />
                <span>{transport.to_location}</span>
              </div>
              {transport.provider_name && <p className="text-sm text-muted-foreground">by {transport.provider_name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-muted rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Calendar className="w-3.5 h-3.5" />Date</div>
              <p className="font-semibold text-sm">{format(new Date(transport.departure_date), 'MMM d, yyyy')}</p>
            </div>
            {transport.departure_time && (
              <div className="bg-muted rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Clock className="w-3.5 h-3.5" />Departure</div>
                <p className="font-semibold text-sm">{transport.departure_time}</p>
              </div>
            )}
            <div className="bg-muted rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Users className="w-3.5 h-3.5" />Seats left</div>
              <p className="font-semibold text-sm">{transport.seats_available}</p>
            </div>
            {transport.boat_type && (
              <div className="bg-muted rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Anchor className="w-3.5 h-3.5" />Boat</div>
                <p className="font-semibold text-sm">{transport.boat_type}</p>
              </div>
            )}
          </div>

          {transport.notes && (
            <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground leading-relaxed">
              {transport.notes}
            </div>
          )}
        </div>

        {/* Booking card */}
        <div className="bg-white rounded-2xl border border-border shadow-card p-6 mb-6">
          <h2 className="text-lg font-bold text-foreground mb-5">Book a seat</h2>
          <div className="space-y-4 mb-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Number of seats</label>
              <Input
                type="number"
                min={1}
                max={transport.seats_available}
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="rounded-xl w-32"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Message (optional)</label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Any questions for the provider?" rows={3} className="rounded-xl resize-none" />
            </div>
          </div>

          <div className="bg-muted rounded-xl p-4 mb-5 text-sm space-y-1.5">
            <div className="flex justify-between text-muted-foreground">
              <span>{transport.price_per_seat} DKK × {seats} seat{seats !== 1 ? 's' : ''}</span>
              <span>{total} DKK</span>
            </div>
            <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border">
              <span>Total</span>
              <span>{total} DKK</span>
            </div>
          </div>

          {transport.seats_available === 0 ? (
            <Button disabled className="w-full h-12 rounded-xl font-semibold">Fully booked</Button>
          ) : !user ? (
            <Button onClick={() => base44.auth.redirectToLogin()} className="w-full h-12 bg-primary text-white hover:bg-primary/90 rounded-xl font-semibold">
              Log ind for at booke
            </Button>
          ) : (
            <StripeCheckoutButton
              payload={stripePayload}
              disabled={seats < 1 || seats > transport.seats_available}
              label={`Betal ${total} DKK`}
            />
          )}
          <p className="text-xs text-muted-foreground text-center mt-3">Sikker betaling via Stripe</p>
        </div>

        {/* Reviews */}
        <TransportReviews transportId={transport.id} providerEmail={transport.provider_email} providerName={transport.provider_name} />
      </div>
    </div>
  );
}