import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function BookingCancelled() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('booking_id');

  useEffect(() => {
    if (bookingId) {
      base44.functions.invoke('releaseBookingHold', { bookingId }).catch(() => {});
    }
  }, [bookingId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-border shadow-card p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-9 h-9 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{t('payment_cancelled')}</h1>
        <p className="text-muted-foreground text-sm mb-8">
          {t('payment_cancelled_desc')}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex-1 rounded-xl">
            {t('try_again')}
          </Button>
          <Button onClick={() => navigate('/')} className="flex-1 rounded-xl bg-primary text-white hover:bg-primary/90">
            {t('to_home')}
          </Button>
        </div>
      </div>
    </div>
  );
}