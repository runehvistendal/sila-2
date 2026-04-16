import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import ListingImageGallery from '@/components/shared/ListingImageGallery';
import StripeCheckoutButton from '@/components/bookings/StripeCheckoutButton';
import TransportReviews from '@/components/transport/TransportReviews';
import { X, ArrowRight, Calendar, Clock, Users, Anchor, RefreshCw, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { GREENLAND_LOCATIONS } from '@/lib/greenlandLocations';

const LOCATIONS = [...new Set(GREENLAND_LOCATIONS.map(l => l.name_dk))].sort();

export default function TransportDrawer({ transportId, onClose }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [seats, setSeats] = useState(1);
  const [message, setMessage] = useState('');
  const [addReturn, setAddReturn] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [reqForm, setReqForm] = useState({
    from_location: '', to_location: '', travel_date: '', passengers: 1, message: '',
  });

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const { data: transport, isLoading } = useQuery({
    queryKey: ['transport', transportId],
    queryFn: () => base44.entities.Transport.filter({ id: transportId }, null, 1).then((r) => r[0]),
    enabled: !!transportId,
  });

  // Return trips from ALL providers on this route
  const { data: returnTrips = [] } = useQuery({
    queryKey: ['return-trips-all', transport?.to_location, transport?.from_location],
    queryFn: () => base44.entities.Transport.filter({
      from_location: transport.to_location,
      to_location: transport.from_location,
      status: 'scheduled',
    }, 'departure_date', 10),
    enabled: !!transport,
  });

  const requestMutation = useMutation({
    mutationFn: (data) => base44.entities.TransportRequest.create(data),
    onSuccess: () => {
      setShowRequestForm(false);
      setRequestSent(true);
      setReqForm({ from_location: '', to_location: '', travel_date: '', passengers: 1, message: '' });
    },
  });

  const oneWayPrice = transport ? Math.round(transport.round_trip_price * 0.6) : 0;
  const returnPrice = selectedReturn ? Math.round(selectedReturn.round_trip_price * 0.6) : 0;
  const outboundTotal = seats * oneWayPrice;
  const returnTotal = addReturn && selectedReturn ? seats * returnPrice : 0;
  const total = outboundTotal + returnTotal;

  const stripePayload = transport ? {
    bookingType: 'transport',
    listingId: transport.id,
    listingTitle: `${transport.from_location} → ${transport.to_location}${addReturn && selectedReturn ? ` + retur ${format(new Date(selectedReturn.departure_date), 'd. MMM')}` : ''} (Enkeltbillet)`,
    checkIn: transport.departure_date,
    seats,
    totalPrice: total,
    hostEmail: transport.provider_email || '',
    message,
  } : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed top-0 right-0 z-50 h-full w-full sm:w-[580px] bg-background shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-white shrink-0">
          {transport && (
            <div className="flex items-center gap-2 font-bold text-foreground text-base">
              <span>{transport.from_location}</span>
              <ArrowRight className="w-4 h-4 text-primary" />
              <span>{transport.to_location}</span>
            </div>
          )}
          {!transport && <div className="h-5 w-40 bg-muted rounded animate-pulse" />}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {transport && (
            <div className="p-5 space-y-6">
              {/* Images */}
              {transport.images?.length > 0 && (
                <ListingImageGallery images={transport.images} title={`${transport.from_location} → ${transport.to_location}`} />
              )}

              {/* Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Calendar className="w-3.5 h-3.5" />{t('date')}</div>
                  <p className="font-semibold text-sm">{format(new Date(transport.departure_date), 'd. MMM yyyy')}</p>
                </div>
                {transport.departure_time && (
                  <div className="bg-muted rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Clock className="w-3.5 h-3.5" />{t('departure')}</div>
                    <p className="font-semibold text-sm">{transport.departure_time}</p>
                  </div>
                )}
                <div className="bg-muted rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Users className="w-3.5 h-3.5" />{t('available_seats')}</div>
                  <p className="font-semibold text-sm">{transport.seats_available}</p>
                </div>
                {transport.boat_type && (
                  <div className="bg-muted rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Anchor className="w-3.5 h-3.5" />{t('boat')}</div>
                    <p className="font-semibold text-sm">{transport.boat_type}</p>
                  </div>
                )}
              </div>

              {transport.notes && (
                <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground leading-relaxed">
                  {transport.notes}
                </div>
              )}

              {/* Booking section */}
              <div className="bg-white rounded-2xl border border-border p-5">
                <h3 className="text-base font-bold text-foreground mb-4">{t('book_your_seat')}</h3>

                {/* Outbound info */}
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-3.5 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm text-foreground">{t('outbound_oneway')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    {transport.from_location} → {transport.to_location} · {format(new Date(transport.departure_date), 'd. MMM yyyy')}
                  </p>
                  <p className="text-sm font-semibold text-primary ml-6 mt-1">{oneWayPrice} {t('price_per_seat')}</p>
                </div>

                {/* Seats */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t('seats_label')}</label>
                  <Input
                    type="number"
                    min={1}
                    max={transport.seats_available}
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="rounded-xl w-28"
                  />
                </div>

                {/* Return trip */}
                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-accent" />
                    {t('return_trip')}
                  </p>

                  {returnTrips.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 whitespace-pre-line">{t('no_return_other_providers')} {transport.from_location}:</p>
                      {returnTrips.map((rt) => (
                        <button
                          key={rt.id}
                          onClick={() => {
                            if (selectedReturn?.id === rt.id && addReturn) {
                              setAddReturn(false); setSelectedReturn(null);
                            } else {
                              setSelectedReturn(rt); setAddReturn(true); setShowRequestForm(false);
                            }
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-colors ${
                            addReturn && selectedReturn?.id === rt.id
                              ? 'bg-accent/10 border-accent text-foreground'
                              : 'bg-muted border-border hover:border-accent/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold">{rt.to_location} → {rt.from_location}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(rt.departure_date), 'd. MMM yyyy')}{rt.departure_time ? ` · kl. ${rt.departure_time}` : ''} · {rt.seats_available} {t('seats_plural')}</p>
                              {rt.provider_name && <p className="text-xs text-muted-foreground/70 mt-0.5">{t('provider')} {rt.provider_name}</p>}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-accent">{Math.round(rt.round_trip_price * 0.6)} DKK/plads</p>
                              {addReturn && selectedReturn?.id === rt.id && (
                                <Badge className="bg-accent/20 text-accent border-0 text-xs mt-1">{t('selected')}</Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setShowRequestForm(!showRequestForm);
                          setAddReturn(false); setSelectedReturn(null); setRequestSent(false);
                          setReqForm(prev => ({ ...prev, from_location: transport.to_location, to_location: transport.from_location, passengers: seats }));
                        }}
                        className="w-full text-left p-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                      >
                        + {t('want_other_date')}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{t('no_confirmed_return_any')}</p>
                      <button
                        onClick={() => {
                          setShowRequestForm(!showRequestForm); setRequestSent(false);
                          setReqForm(prev => ({ ...prev, from_location: transport.to_location, to_location: transport.from_location, passengers: seats }));
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-colors ${
                          showRequestForm ? 'bg-primary/5 border-primary/30' : 'bg-muted border-border hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{t('request_return_transport')}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 ml-6">{t('send_request_all_providers')}</p>
                      </button>
                    </div>
                  )}

                  {/* Return request form */}
                  <AnimatePresence>
                    {showRequestForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-4 border-t border-border">
                          {requestSent ? (
                            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                              <span className="text-green-500 text-lg leading-none">✓</span>
                              <div>
                                <p className="text-sm font-semibold text-green-800">{t('request_sent_exclaim')}</p>
                                <p className="text-xs text-green-700 mt-0.5">{t('request_sent_to_all_providers')}</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                                <span className="text-amber-500 mt-0.5 text-base leading-none">⚠️</span>
                                <p className="text-xs text-amber-800">
                                  <strong>{t('notice_not_confirmed')}</strong> {t('request_sent_to_all_desc')}
                                </p>
                              </div>
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{t('from')}</label>
                                    <select value={reqForm.from_location} onChange={e => setReqForm(p => ({ ...p, from_location: e.target.value }))}
                                      className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                                      {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{t('to')}</label>
                                    <select value={reqForm.to_location} onChange={e => setReqForm(p => ({ ...p, to_location: e.target.value }))}
                                      className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                                      {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{t('desired_date')}</label>
                                    <Input type="date" value={reqForm.travel_date} onChange={e => setReqForm(p => ({ ...p, travel_date: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{t('passengers')}</label>
                                    <Input type="number" min={1} max={20} value={reqForm.passengers} onChange={e => setReqForm(p => ({ ...p, passengers: Number(e.target.value) }))} />
                                  </div>
                                </div>
                                <Textarea value={reqForm.message} onChange={e => setReqForm(p => ({ ...p, message: e.target.value }))} rows={2} placeholder={t('describe_trip')} className="resize-none" />
                                <Button
                                  onClick={() => {
                                    if (!user) { base44.auth.redirectToLogin(); return; }
                                    requestMutation.mutate({ ...reqForm, passengers: Number(reqForm.passengers), guest_name: user.full_name || '', guest_email: user.email, status: 'pending' });
                                  }}
                                  disabled={!reqForm.travel_date || requestMutation.isPending}
                                  className="w-full bg-primary text-white rounded-xl h-10 font-semibold text-sm"
                                >
                                  {requestMutation.isPending ? t('sending_dots') : t('send_request')}
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Optional message */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t('message_optional')}</label>
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('question_to_provider')} rows={2} className="rounded-xl resize-none" />
                </div>

                {/* Price summary */}
                <div className="bg-muted rounded-xl p-4 mb-4 text-sm space-y-1.5">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t('outbound_oneway')}: {oneWayPrice} DKK × {seats} {t('seats_plural')}</span>
                    <span>{outboundTotal} DKK</span>
                  </div>
                  {addReturn && selectedReturn && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t('return_trip')}: {returnPrice} DKK × {seats} {t('seats_plural')}</span>
                      <span>{returnTotal} DKK</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border">
                    <span>{t('total_label')}</span>
                    <span>{total} DKK</span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4">
                  <p className="text-xs text-amber-800">
                    <strong>Bemærk:</strong> {t('payment_covers_only')}
                  </p>
                </div>

                {transport.seats_available === 0 ? (
                  <Button disabled className="w-full h-11 rounded-xl font-semibold">{t('fully_booked')}</Button>
                ) : !user ? (
                  <Button onClick={() => base44.auth.redirectToLogin()} className="w-full h-11 bg-primary text-white hover:bg-primary/90 rounded-xl font-semibold">
                    {t('login_to_book')}
                  </Button>
                ) : (
                  <StripeCheckoutButton
                    payload={stripePayload}
                    disabled={seats < 1 || seats > transport.seats_available}
                    label={`${t('pay_amount')} ${total} DKK`}
                    onSuccess={onClose}
                  />
                )}
                <p className="text-xs text-muted-foreground text-center mt-2">{t('secure_payment')}</p>
              </div>

              {/* Anmeldelser */}
              <TransportReviews transportId={transport.id} providerEmail={transport.provider_email} providerName={transport.provider_name} />
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}