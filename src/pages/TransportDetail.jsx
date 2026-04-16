import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ChevronLeft, Calendar, Clock, Users, Anchor, RefreshCw, MessageSquare } from 'lucide-react';
import ListingImageGallery from '@/components/shared/ListingImageGallery';
import { format } from 'date-fns';
import StripeCheckoutButton from '@/components/bookings/StripeCheckoutButton';
import TransportReviews from '@/components/transport/TransportReviews';
import { toast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const LOCATIONS = [
  'Nuuk', 'Ilulissat', 'Sisimiut', 'Qaqortoq', 'Aasiaat',
  'Maniitsoq', 'Tasiilaq', 'Paamiut', 'Nanortalik', 'Uummannaq',
  'Ilimanaq', 'Qeqertarsuaq',
];

export default function TransportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [seats, setSeats] = useState(1);
  const [message, setMessage] = useState('');
  const [addReturn, setAddReturn] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // Request form state
  const [reqForm, setReqForm] = useState({
    from_location: '', to_location: '', travel_date: '', passengers: 1, message: '',
  });

  const { data: transport, isLoading } = useQuery({
    queryKey: ['transport', id],
    queryFn: () => base44.entities.Transport.filter({ id }, null, 1).then((r) => r[0]),
  });

  // Find return trip: same provider, reverse route, future date
  const { data: returnTrips = [] } = useQuery({
    queryKey: ['return-trips', transport?.to_location, transport?.from_location, transport?.provider_email],
    queryFn: () => base44.entities.Transport.filter({
      from_location: transport.to_location,
      to_location: transport.from_location,
      provider_email: transport.provider_email,
      status: 'scheduled',
    }, 'departure_date', 5),
    enabled: !!transport,
  });

  const [selectedReturn, setSelectedReturn] = useState(null);

  const requestMutation = useMutation({
    mutationFn: (data) => base44.entities.TransportRequest.create(data),
    onSuccess: () => {
      setShowRequestForm(false);
      setRequestSent(true);
      setReqForm({ from_location: '', to_location: '', travel_date: '', passengers: 1, message: '' });
    },
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

  const oneWayPrice = Math.round(transport.round_trip_price * 0.6);
  const returnPrice = selectedReturn ? Math.round(selectedReturn.round_trip_price * 0.6) : 0;
  const outboundTotal = seats * oneWayPrice;
  const returnTotal = addReturn && selectedReturn ? seats * returnPrice : 0;
  const total = outboundTotal + returnTotal;

  const stripePayload = {
    bookingType: 'transport',
    listingId: transport.id,
    listingTitle: `${transport.from_location} → ${transport.to_location}${addReturn && selectedReturn ? ` + retur ${format(new Date(selectedReturn.departure_date), 'd. MMM')}` : ''} (Enkeltbillet)`,
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
          <ChevronLeft className="w-4 h-4" /> Tilbage til transport
        </button>

        {/* Images */}
        {transport.images?.length > 0 && (
          <ListingImageGallery images={transport.images} title={`${transport.from_location} → ${transport.to_location}`} />
        )}

        {/* Info card */}
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
              {transport.provider_name && <p className="text-sm text-muted-foreground">Skipper: {transport.provider_name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-muted rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Calendar className="w-3.5 h-3.5" />Dato</div>
              <p className="font-semibold text-sm">{format(new Date(transport.departure_date), 'd. MMM yyyy')}</p>
            </div>
            {transport.departure_time && (
              <div className="bg-muted rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Clock className="w-3.5 h-3.5" />Afgang</div>
                <p className="font-semibold text-sm">{transport.departure_time}</p>
              </div>
            )}
            <div className="bg-muted rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Users className="w-3.5 h-3.5" />Ledige pladser</div>
              <p className="font-semibold text-sm">{transport.seats_available}</p>
            </div>
            {transport.boat_type && (
              <div className="bg-muted rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><Anchor className="w-3.5 h-3.5" />Båd</div>
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

        {/* BOOKING CARD */}
        <div className="bg-white rounded-2xl border border-border shadow-card p-6 mb-6">
          <h2 className="text-lg font-bold text-foreground mb-5">Book din plads</h2>

          {/* Outbound info */}
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowRight className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">Udrejse (enkeltbillet)</span>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              {transport.from_location} → {transport.to_location} · {format(new Date(transport.departure_date), 'd. MMM yyyy')}
            </p>
            <p className="text-sm font-semibold text-primary ml-6 mt-1">{oneWayPrice} DKK/plads</p>
          </div>

          {/* Seats — shown before return section so passenger count is set first */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Antal pladser</label>
            <Input
              type="number"
              min={1}
              max={transport.seats_available}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              className="rounded-xl w-32"
            />
          </div>

          {/* Return trip section */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-accent" />
              Hjemrejse
            </p>

            {returnTrips.length > 0 ? (
              <div className="space-y-2">
                {returnTrips.map((rt) => (
                  <button
                    key={rt.id}
                    onClick={() => {
                      if (selectedReturn?.id === rt.id && addReturn) {
                        setAddReturn(false);
                        setSelectedReturn(null);
                      } else {
                        setSelectedReturn(rt);
                        setAddReturn(true);
                        setShowRequestForm(false);
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
                        <p className="text-xs text-muted-foreground">{format(new Date(rt.departure_date), 'd. MMM yyyy')}{rt.departure_time ? ` · kl. ${rt.departure_time}` : ''} · {rt.seats_available} pladser</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-accent">{Math.round(rt.round_trip_price * 0.6)} DKK/plads</p>
                        {addReturn && selectedReturn?.id === rt.id && (
                          <Badge className="bg-accent/20 text-accent border-0 text-xs mt-1">Valgt</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => {
                    setShowRequestForm(!showRequestForm);
                    setAddReturn(false);
                    setSelectedReturn(null);
                    setRequestSent(false);
                    setReqForm(prev => ({ ...prev, from_location: transport.to_location, to_location: transport.from_location, passengers: seats }));
                  }}
                  className="w-full text-left p-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                >
                  + Ønsker du en anden dato? Send en anmodning
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Ingen bekræftet hjemrejse fra denne udbyder endnu.</p>
                <button
                  onClick={() => {
                    setShowRequestForm(!showRequestForm);
                    setRequestSent(false);
                    setReqForm(prev => ({ ...prev, from_location: transport.to_location, to_location: transport.from_location, passengers: seats }));
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    showRequestForm ? 'bg-primary/5 border-primary/30 text-foreground' : 'bg-muted border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Anmod om returtransport</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-6">Send en anmodning — udbyderen svarer dig direkte</p>
                </button>
              </div>
            )}

            {/* Inline request form — folds out inside the booking card */}
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
                          <p className="text-sm font-semibold text-green-800">Anmodning sendt!</p>
                          <p className="text-xs text-green-700 mt-0.5">Din transportanmodning er sendt til udbyderne. Du hører fra dem hurtigst muligt.</p>
                        </div>
                      </div>
                    ) : (
                    <>
                    {/* "Only a request" notice */}
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                      <span className="text-amber-500 mt-0.5 text-base leading-none">⚠️</span>
                      <p className="text-xs text-amber-800">
                        <strong>Hjemrejsen er ikke bekræftet endnu.</strong> Din anmodning sendes til lokale udbydere, som vender tilbage med tilbud og pris. Du betaler intet nu.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Fra</label>
                          <select
                            value={reqForm.from_location}
                            onChange={e => setReqForm(p => ({ ...p, from_location: e.target.value }))}
                            className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Til</label>
                          <select
                            value={reqForm.to_location}
                            onChange={e => setReqForm(p => ({ ...p, to_location: e.target.value }))}
                            className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Ønsket dato</label>
                          <Input type="date" value={reqForm.travel_date} onChange={e => setReqForm(p => ({ ...p, travel_date: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Passagerer</label>
                          <Input type="number" min={1} max={20} value={reqForm.passengers} onChange={e => setReqForm(p => ({ ...p, passengers: Number(e.target.value) }))} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Besked (valgfri)</label>
                        <Textarea value={reqForm.message} onChange={e => setReqForm(p => ({ ...p, message: e.target.value }))} rows={2} placeholder="Beskriv din rejse..." className="resize-none" />
                      </div>
                      <Button
                        onClick={() => {
                          if (!user) { base44.auth.redirectToLogin(); return; }
                          requestMutation.mutate({
                            ...reqForm,
                            passengers: Number(reqForm.passengers),
                            guest_name: user.full_name || '',
                            guest_email: user.email,
                            status: 'pending',
                          });
                        }}
                        disabled={!reqForm.travel_date || requestMutation.isPending}
                        className="w-full bg-primary text-white rounded-xl h-11 font-semibold"
                      >
                        {requestMutation.isPending ? 'Sender...' : 'Send anmodning'}
                      </Button>
                    </div>
                    </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mb-5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Besked (valgfri)</label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Spørgsmål til udbyderen?" rows={2} className="rounded-xl resize-none" />
          </div>

          {/* Price summary */}
          <div className="bg-muted rounded-xl p-4 mb-5 text-sm space-y-1.5">
            <div className="flex justify-between text-muted-foreground">
              <span>Udrejse: {oneWayPrice} DKK × {seats} plads{seats !== 1 ? 'er' : ''}</span>
              <span>{outboundTotal} DKK</span>
            </div>
            {addReturn && selectedReturn && (
              <div className="flex justify-between text-muted-foreground">
                <span>Hjemrejse: {returnPrice} DKK × {seats} plads{seats !== 1 ? 'er' : ''}</span>
                <span>{returnTotal} DKK</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border">
              <span>I alt</span>
              <span>{total} DKK</span>
            </div>
          </div>

          {transport.seats_available === 0 ? (
            <Button disabled className="w-full h-12 rounded-xl font-semibold">Fuldt booket</Button>
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