import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, CalendarDays, ArrowRight } from 'lucide-react';

export default function BookingSuccess() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('booking_id');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) { setLoading(false); return; }
    const poll = async (attempts = 0) => {
      try {
        const results = await base44.entities.Booking.filter({ id: bookingId });
        const b = results[0];
        if (b?.status === 'confirmed' || attempts > 8) {
          setBooking(b);
          setLoading(false);
        } else {
          setTimeout(() => poll(attempts + 1), 1500);
        }
      } catch {
        setLoading(false);
      }
    };
    poll();
  }, [bookingId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-border shadow-card p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-9 h-9 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Booking bekræftet!</h1>
        {booking && (
          <p className="text-muted-foreground text-sm mb-1">
            <strong>{booking.listing_title}</strong>
          </p>
        )}
        <p className="text-muted-foreground text-sm mb-6">
          Din betaling er gennemført. Du vil modtage en bekræftelse på e-mail.
        </p>

        {/* CTA */}
        <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 mb-6 text-left flex items-start gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Dine bookinger er klar</p>
            <p className="text-xs text-muted-foreground mt-0.5">Se alle detaljer, kommunikér med udbyderen og hold styr på din rejse fra dit dashboard.</p>
          </div>
        </div>

        <Button onClick={() => navigate('/dashboard')} className="w-full rounded-xl bg-primary text-white hover:bg-primary/90 gap-2 h-11 font-semibold">
          <CalendarDays className="w-4 h-4" />
          Se mine bookinger
          <ArrowRight className="w-4 h-4 ml-auto" />
        </Button>
        <button onClick={() => navigate('/')} className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
          Tilbage til forsiden
        </button>
      </div>
    </div>
  );
}