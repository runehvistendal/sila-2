import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, CalendarDays, Mail, Clock, ArrowRight, Home } from 'lucide-react';
import { format } from 'date-fns';

export default function BookingSuccess() {
  const navigate = useNavigate();
  const { t } = useLanguage();
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

  const nextSteps = [
    { icon: Mail, label: t('next_step_1') },
    { icon: Clock, label: t('next_step_2') },
    { icon: CheckCircle2, label: t('next_step_3') },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 pt-24">
      <div className="bg-white rounded-2xl border border-border shadow-card p-8 sm:p-10 max-w-lg w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-11 h-11 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{t('booking_confirmed')}</h1>
        </div>

        {/* Summary card */}
        {booking && (
          <div className="bg-muted/40 border border-border rounded-xl p-5 mb-6 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <p className="font-semibold text-foreground text-base">{booking.listing_title}</p>
              {booking.total_price && (
                <span className="text-sm font-bold text-primary whitespace-nowrap">{booking.total_price} DKK</span>
              )}
            </div>
            {(booking.check_in || booking.check_out) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4 shrink-0" />
                <span>
                  {booking.check_in ? format(new Date(booking.check_in), 'd MMM yyyy') : '—'}
                  {' → '}
                  {booking.check_out ? format(new Date(booking.check_out), 'd MMM yyyy') : '—'}
                </span>
              </div>
            )}
            {booking.host_email && (
              <p className="text-xs text-muted-foreground">{t('host')}: {booking.host_email}</p>
            )}
          </div>
        )}

        {/* What happens next */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-foreground mb-4">{t('what_happens_next')}</h2>
          <ol className="space-y-3">
            {nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <step.icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pt-1">{step.label}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => navigate('/dashboard')} className="flex-1 h-11 rounded-xl bg-primary text-white hover:bg-primary/90 font-semibold gap-2">
            <CalendarDays className="w-4 h-4" />
            {t('see_my_bookings')}
          </Button>
          <Button onClick={() => navigate('/cabins')} variant="outline" className="flex-1 h-11 rounded-xl font-semibold gap-2">
            <Home className="w-4 h-4" />
            {t('explore_more')}
          </Button>
        </div>
      </div>
    </div>
  );
}