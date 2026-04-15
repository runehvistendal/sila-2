import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';

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
        <p className="text-muted-foreground text-sm mb-8">
          Din betaling er gennemført. Du vil modtage en bekræftelse på e-mail.
        </p>
        <Button onClick={() => navigate('/dashboard')} className="w-full rounded-xl bg-primary text-white hover:bg-primary/90">
          Se mine bookinger
        </Button>
      </div>
    </div>
  );
}