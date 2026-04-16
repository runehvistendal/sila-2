import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import TransportCard from '@/components/transport/TransportCard';
import TransportDrawer from '@/components/transport/TransportDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import { Anchor, ArrowRight, RefreshCw, MessageSquare, ChevronDown, X, Check } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const LOCATIONS = [
  'Nuuk', 'Ilulissat', 'Sisimiut', 'Qaqortoq', 'Aasiaat',
  'Maniitsoq', 'Tasiilaq', 'Paamiut', 'Nanortalik', 'Uummannaq',
  'Ilimanaq', 'Qeqertarsuaq',
];

// Transport type options for host-provided transport
const TRANSPORT_TYPES = [
  { value: 'round_trip', labelKey: 'round_trip', descKey: 'both_ways' },
  { value: 'outbound', labelKey: 'outbound', descKey: 'single_way' },
  { value: 'return', labelKey: 'return_trip', descKey: 'single_way' },
];

/**
 * "Getting there" sektion på CabinDetail
 * Props:
 *   cabin: object
 *   transports: Transport[]
 *   guests: number
 *   onTransportCostChange: (cost: number) => void
 */
export default function CabinTransportSection({ cabin, transports, guests, onTransportCostChange }) {
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  // Host transport
  const [selectedType, setSelectedType] = useState(null); // null | 'round_trip' | 'outbound' | 'return'

  // Transport drawer
  const [drawerTransportId, setDrawerTransportId] = useState(null);

  // Request form
  const [showRequest, setShowRequest] = useState(false);
  const [reqForm, setReqForm] = useState({
    from_location: cabin.transport_route_from || cabin.location || '',
    to_location: cabin.location || '',
    travel_date: '',
    passengers: guests || 1,
    message: '',
  });
  const [reqSent, setReqSent] = useState(false);

  const requestMutation = useMutation({
    mutationFn: (data) => base44.entities.TransportRequest.create(data),
    onSuccess: () => {
      setReqSent(true);
      toast({ title: t('request_sent'), description: t('request_sent_desc') });
    },
  });

  // Calculate host transport cost based on type
  const pricePerSeat = cabin.transport_price_per_seat || 0;
  const costMap = {
    round_trip: pricePerSeat * guests * 2,
    outbound: pricePerSeat * guests,
    return: pricePerSeat * guests,
    null: 0,
  };
  const transportCost = selectedType ? costMap[selectedType] : 0;

  // Propagate cost to parent
  React.useEffect(() => {
    onTransportCostChange?.(transportCost);
  }, [transportCost]);

  // Translated label helpers
  const typeLabel = (value) => {
    const map = {
      round_trip: { da: 'Tur-retur (begge veje)', en: 'Round trip (both ways)', kl: 'Inisseq-paluartup' },
      outbound:   { da: 'Udrejse (enkeltbillet)', en: 'Outbound (one way)',     kl: 'Inisseq aataatigut' },
      return:     { da: 'Hjemrejse (enkeltbillet)', en: 'Return (one way)',     kl: 'Paluartup aataatigut' },
    };
    return map[value]?.[lang] || map[value]?.da;
  };

  const otherTransportsLabel = {
    da: `Andre tilgængelige transportmuligheder til ${cabin.location}`,
    en: `Other available transport options to ${cabin.location}`,
    kl: `Allanik umiarsuiit ${cabin.location}-imut`,
  }[lang] || `Andre tilgængelige transportmuligheder til ${cabin.location}`;

  const dateDoesntFitLabel = {
    da: 'Passer datoen ikke?',
    en: "Date doesn't fit?",
    kl: 'Ullua siunngitsoorpa?',
  }[lang];

  const requestNowLabel = {
    da: 'Anmod om transport nu',
    en: 'Request transport now',
    kl: 'Umiarsuanik ujarlerit',
  }[lang];

  const sendRequestLabel = {
    da: 'Send forespørgsel',
    en: 'Send request',
    kl: 'Takuuk',
  }[lang];

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">Getting there</h2>

      {/* ── HOST-PROVIDED TRANSPORT ── */}
      {cabin.host_provides_transport && pricePerSeat > 0 && (
        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Anchor className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Host-provided transport</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {cabin.host_name || 'Your host'} offers transport from{' '}
            <strong>{cabin.transport_route_from || 'the mainland'}</strong> to the cabin.
          </p>

          {/* Type selector */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {lang === 'da' ? 'Jeg ønsker:' : lang === 'en' ? 'I want:' : 'Nalinginnaasumik:'}
          </p>
          <div className="space-y-2 mb-3">
            {(['round_trip', 'outbound', 'return']).map((type) => {
              const cost = costMap[type];
              const active = selectedType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(active ? null : type)}
                  className={`w-full text-left rounded-xl border p-3.5 transition-all flex items-center justify-between ${
                    active
                      ? 'bg-primary/10 border-primary text-foreground'
                      : 'bg-white border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      active ? 'border-primary' : 'border-muted-foreground/40'
                    }`}>
                      {active && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm font-medium">{typeLabel(type)}</span>
                  </div>
                  <span className={`text-sm font-bold ${active ? 'text-primary' : 'text-foreground'}`}>
                    {cost} DKK
                  </span>
                </button>
              );
            })}
          </div>

          {selectedType && (
            <div className="bg-white rounded-lg px-3 py-2 text-xs text-muted-foreground">
              {pricePerSeat} DKK × {guests} {lang === 'da' ? 'gæst' : 'guest'}{guests !== 1 ? (lang === 'da' ? 'er' : 's') : ''}
              {selectedType === 'round_trip' ? ` × 2 (${lang === 'da' ? 'tur/retur' : 'round trip'})` : ''} ={' '}
              <span className="font-semibold text-foreground">{transportCost} DKK</span>{' '}
              <span className="text-muted-foreground/60">({lang === 'da' ? 'lægges til bookingprisen' : 'added to booking total'})</span>
            </div>
          )}
        </div>
      )}

      {/* ── OTHER TRANSPORT LISTINGS ── */}
      {transports.length > 0 && (
        <div className="mb-5 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{otherTransportsLabel}:</p>
          {transports.map((tr) => (
            <div key={tr.id} onClick={() => setDrawerTransportId(tr.id)} className="cursor-pointer">
              <TransportCard transport={tr} compact={false} />
            </div>
          ))}
        </div>
      )}

      {/* Transport Drawer */}
      <AnimatePresence>
        {drawerTransportId && (
          <TransportDrawer
            transportId={drawerTransportId}
            onClose={() => setDrawerTransportId(null)}
          />
        )}
      </AnimatePresence>

      {/* ── NO TRANSPORT AVAILABLE ── */}
      {!cabin.host_provides_transport && transports.length === 0 && (
        <p className="text-sm text-muted-foreground bg-muted rounded-xl p-4 mb-4">
          {lang === 'da'
            ? 'Ingen transportopslag fundet til denne destination endnu.'
            : 'No transport listings found for this location yet.'}
        </p>
      )}

      {/* ── REQUEST TRANSPORT CTA ── */}
      {!showRequest && !reqSent && (
        <div className="flex items-center gap-3 mt-2">
          <span className="text-sm text-muted-foreground">{dateDoesntFitLabel}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRequest(true)}
            className="gap-1.5 rounded-xl shrink-0"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {requestNowLabel}
          </Button>
        </div>
      )}

      {/* ── REQUEST FORM (inline, no page change) ── */}
      <AnimatePresence>
        {showRequest && !reqSent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 bg-muted/60 border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">
                    {lang === 'da' ? 'Anmod om transport' : 'Request transport'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lang === 'da'
                      ? 'Lokale sejlere svarer med et pristilbud — gratis og uforpligtende.'
                      : 'Local sailors will reply with a price quote — free and non-binding.'}
                  </p>
                </div>
                <button onClick={() => setShowRequest(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                      {lang === 'da' ? 'Fra' : 'From'}
                    </label>
                    <select
                      value={reqForm.from_location}
                      onChange={(e) => setReqForm((p) => ({ ...p, from_location: e.target.value }))}
                      className="w-full h-9 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                      {lang === 'da' ? 'Til' : 'To'}
                    </label>
                    <select
                      value={reqForm.to_location}
                      onChange={(e) => setReqForm((p) => ({ ...p, to_location: e.target.value }))}
                      className="w-full h-9 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                      {lang === 'da' ? 'Ønsket dato' : 'Desired date'}
                    </label>
                    <Input
                      type="date"
                      value={reqForm.travel_date}
                      onChange={(e) => setReqForm((p) => ({ ...p, travel_date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                      {lang === 'da' ? 'Passagerer' : 'Passengers'}
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={reqForm.passengers}
                      onChange={(e) => setReqForm((p) => ({ ...p, passengers: Number(e.target.value) }))}
                      className="bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    {lang === 'da' ? 'Besked (valgfri)' : 'Message (optional)'}
                  </label>
                  <Textarea
                    value={reqForm.message}
                    onChange={(e) => setReqForm((p) => ({ ...p, message: e.target.value }))}
                    placeholder={lang === 'da'
                      ? 'F.eks. vi har meget bagage, og ønsker at ankomme inden kl. 14...'
                      : 'E.g. we have a lot of luggage and need to arrive before 2pm...'}
                    rows={2}
                    className="resize-none bg-white"
                  />
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
                  className="w-full bg-primary text-white rounded-xl h-10 font-semibold text-sm gap-1.5"
                >
                  {requestMutation.isPending ? (lang === 'da' ? 'Sender...' : 'Sending...') : sendRequestLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SUCCESS STATE ── */}
      {reqSent && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">
              {lang === 'da' ? 'Forespørgsel sendt!' : 'Request sent!'}
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              {lang === 'da'
                ? 'Lokale sejlere vil svare med et pristilbud hurtigst muligt.'
                : 'Local sailors will reply with a price quote as soon as possible.'}
            </p>
            <button
              onClick={() => { setReqSent(false); setShowRequest(false); }}
              className="text-xs text-green-600 underline mt-1"
            >
              {lang === 'da' ? 'Send en ny forespørgsel' : 'Send another request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}