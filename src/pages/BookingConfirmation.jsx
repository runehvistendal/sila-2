import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/lib/CurrencyContextV2';
import { useLanguage } from '@/lib/LanguageContext';
import { CheckCircle2, Loader2, MapPin, Calendar, Users, Mail, Home, Share2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { formatDate } from '@/lib/utils';

export default function BookingConfirmation() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  const bookingId = urlParams.get('booking_id');
  const { formatPrice } = useCurrency();
  const { language } = useLanguage();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const texts = {
    da: {
      confirmed: 'Din booking er bekræftet!',
      details: 'Bookingdetaljer',
      dates: 'Datoer',
      guests: 'Gæster',
      location: 'Lokation',
      price: 'Pris',
      confirmation_sent: 'En bekræftelsesmail er sendt til',
      booking_number: 'Booking nummer',
      what_next: 'Hvad sker der nu?',
      contact_host: 'Kontakt værten',
      view_bookings: 'Se alle mine bookinger',
      share_booking: 'Del booking',
      download_receipt: 'Download kvittering',
      copy_number: 'Kopier bookingnummer',
      copied: 'Kopiet!',
    },
    en: {
      confirmed: 'Your booking is confirmed!',
      details: 'Booking Details',
      dates: 'Dates',
      guests: 'Guests',
      location: 'Location',
      price: 'Price',
      confirmation_sent: 'A confirmation email has been sent to',
      booking_number: 'Booking number',
      what_next: 'What happens next?',
      contact_host: 'Contact the host',
      view_bookings: 'View all my bookings',
      share_booking: 'Share booking',
      download_receipt: 'Download receipt',
      copy_number: 'Copy booking number',
      copied: 'Copied!',
    },
    kl: {
      confirmed: 'Sapimaneq inugujoq!',
      details: 'Sapimaneq aaqqusaligassapput',
      dates: 'Ulloq',
      guests: 'Ataaseq',
      location: 'Iluani',
      price: 'Pissusaa',
      confirmation_sent: 'Inugujoq inerpalussuannguaq sennusoraa',
      booking_number: 'Sapimaneq nummera',
      what_next: 'Kina sumi nalersimavoq?',
      contact_host: 'Inugujoq neqera siaruvoq',
      view_bookings: 'Ataassuseq sapimaneq takuvoq',
      share_booking: 'Sapimaneq paaviata',
      download_receipt: 'Sapimaneq paasissuussuaq paaviavoq',
      copy_number: 'Sapimaneq nummera kopiera',
      copied: 'Kopieq!',
    }
  };

  const t = texts[language] || texts.da;

  useEffect(() => {
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    const fetchData = async () => {
      try {
        const res = await base44.functions.invoke('getCheckoutSession', { sessionId });
        setData(res.data);
      } catch (error) {
        console.error('Failed to fetch booking data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const copyBookingNumber = () => {
    navigator.clipboard.writeText(data?.booking?.id || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || !data.booking || !data.listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-white rounded-2xl border border-border p-10 max-w-md text-center">
          <p className="text-foreground font-semibold mb-4">Kunne ikke hente bookingoplysninger</p>
          <Button onClick={() => navigate('/')} className="w-full">
            Tilbage til forsiden
          </Button>
        </div>
      </div>
    );
  }

  const booking = data.booking;
  const listing = data.listing;
  const isCheckIn = booking.check_in;
  const isCheckOut = booking.check_out;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted pt-20 pb-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Hero Success Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle2 className="w-11 h-11 text-green-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-3">
            {t.confirmed}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t.confirmation_sent} <strong>{booking.guest_email}</strong>
          </p>
        </motion.div>

        {/* Main Booking Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-3xl shadow-card border border-border overflow-hidden mb-8"
        >
          {/* Listing Image */}
          {listing.images && listing.images[0] && (
            <div className="relative h-80 overflow-hidden bg-muted">
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <button className="bg-white/90 backdrop-blur hover:bg-white rounded-full p-3 shadow-lg transition-all">
                  <Share2 className="w-5 h-5 text-foreground" />
                </button>
              </div>
            </div>
          )}

          <div className="p-8 sm:p-12">
            {/* Title and Location */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {listing.title}
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{listing.location}</span>
              </div>
            </div>

            {/* Grid of Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10 pb-10 border-b border-border">
              {/* Check-in */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-semibold uppercase tracking-wider">{t.dates}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-foreground font-medium">
                    {isCheckIn ? formatDate(isCheckIn, 'da') : 'Dato ej angivet'}
                  </p>
                  {isCheckOut && (
                    <p className="text-sm text-muted-foreground">
                      til {formatDate(isCheckOut, 'da')}
                    </p>
                  )}
                </div>
              </div>

              {/* Guests */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-semibold uppercase tracking-wider">{t.guests}</span>
                </div>
                <p className="text-foreground font-medium">
                  {booking.guests || booking.seats} {booking.guests ? 'gæster' : 'sæder'}
                </p>
              </div>

              {/* Price */}
              <div>
                <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {t.price}
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatPrice(booking.total_price)}
                </p>
              </div>

              {/* Booking Number */}
              <div>
                <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {t.booking_number}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-foreground font-mono font-semibold">{booking.id}</p>
                  <button
                    onClick={copyBookingNumber}
                    className="text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                  >
                    {copied ? t.copied : 'Kopier'}
                  </button>
                </div>
              </div>
            </div>

            {/* Host/Provider Info */}
            {listing.host_name || listing.provider_name ? (
              <div className="mb-10 pb-10 border-b border-border">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Din vært
                </h3>
                <div className="flex items-center gap-4">
                  {(listing.host_avatar || listing.provider_avatar) && (
                    <div className="w-14 h-14 rounded-full bg-muted overflow-hidden">
                      <img
                        src={listing.host_avatar || listing.provider_avatar}
                        alt="Host"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-foreground">
                      {listing.host_name || listing.provider_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Booking vært
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* What's Next */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {t.what_next}
              </h3>
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  ✓ Bekræftelse er sendt til din email
                </p>
                <p className="text-muted-foreground text-sm">
                  ✓ Du kan kontakte værten via beskedtråden i dine bookinger
                </p>
                <p className="text-muted-foreground text-sm">
                  ✓ Husk at møde op til tiden — værten venter på dig!
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <Button
            onClick={() => navigate('/dashboard')}
            className="h-12 rounded-xl bg-primary text-white hover:bg-primary/90 font-semibold"
          >
            {t.view_bookings}
          </Button>
          <Button
            onClick={() => navigate(`/cabins/${booking.listing_id}`)}
            variant="outline"
            className="h-12 rounded-xl border-2 font-semibold"
          >
            <Home className="w-4 h-4 mr-2" />
            Se hytten
          </Button>
          <Button
            variant="outline"
            className="h-12 rounded-xl border-2 font-semibold"
          >
            <Download className="w-4 h-4 mr-2" />
            {t.download_receipt}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}