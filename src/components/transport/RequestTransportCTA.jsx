import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Anchor, MapPin, Calendar, Users, Send, ArrowRight, ArrowLeftRight, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { AnimatePresence, motion } from 'framer-motion';

const LOCATIONS = [
  'Nuuk', 'Ilulissat', 'Sisimiut', 'Qaqortoq', 'Aasiaat',
  'Maniitsoq', 'Tasiilaq', 'Paamiut', 'Nanortalik', 'Uummannaq',
  'Kangaatsiaq', 'Qasigiannguit', 'Narsaq', 'Kangerlussuaq',
  'Ilimanaq', 'Qeqertarsuaq', 'Ittoqqortoormiit', 'Qaanaaq',
];

export default function RequestTransportCTA() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const [form, setForm] = useState({
    from_location: '',
    to_location: '',
    travel_date: '',
    passengers: 1,
    trip_type: 'round-trip',
    return_date: '',
    return_passengers: 1,
    message: '',
  });

  const set = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'passengers') updated.return_passengers = value;
      return updated;
    });
  };

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.TransportRequest.create(data),
    onSuccess: () => {
      toast({ title: t('request_sent'), description: t('request_sent_desc') });
      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setForm({ from_location: '', to_location: '', travel_date: '', passengers: 1, trip_type: 'round-trip', return_date: '', return_passengers: 1, message: '' });
      }, 2000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      base44.auth.redirectToLogin(window.location.pathname);
      return;
    }
    
    let message = form.message;
    const tripLabel = form.trip_type === 'outbound' ? 'AFGANG' : form.trip_type === 'return' ? 'RETUR' : 'TUR/RETUR';
    
    if (form.trip_type === 'round-trip' && form.return_date) {
      const returnDetails = `\n[HJEMREJSE] Dato: ${form.return_date}, Passagerer: ${form.return_passengers}`;
      message = message ? `${message}${returnDetails}` : `[TUR/RETUR]\n${returnDetails}`;
    } else if (form.trip_type === 'return' && form.return_date) {
      message = message ? `${message}\n[RETUR] Dato: ${form.return_date}` : `[RETUR] Dato: ${form.return_date}`;
    }
    
    const baseData = {
      from_location: form.from_location,
      to_location: form.to_location,
      travel_date: form.travel_date,
      passengers: Number(form.passengers),
      message: message || `[${tripLabel}]`,
      guest_name: user.full_name || '',
      guest_email: user.email,
      status: 'pending',
    };

    mutation.mutate(baseData);
  };

  return (
    <>
      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-8 my-12">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center shrink-0">
            <Anchor className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground mb-1">{t('cant_find_heading') || 'Kan du ikke finde den perfekte rute?'}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t('request_transport_desc')}</p>
            <Button onClick={() => setOpen(true)} className="bg-primary text-white hover:bg-primary/90 rounded-xl gap-2">
              <Send className="w-4 h-4" />
              {t('request_transport_btn') || 'Anmod om transport'}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => !sent && setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                {sent ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{t('request_sent')}</h3>
                    <p className="text-sm text-muted-foreground">{t('request_sent_desc')}</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-foreground mb-2">{t('request_transport_title')}</h2>
                      <p className="text-sm text-muted-foreground">{t('request_transport_desc')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Route */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">{t('from')}</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <select
                              required
                              value={form.from_location}
                              onChange={(e) => set('from_location', e.target.value)}
                              className="w-full pl-9 pr-3 h-9 rounded-md border border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              <option value="">{t('select_departure')}</option>
                              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">{t('to')}</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <select
                              required
                              value={form.to_location}
                              onChange={(e) => set('to_location', e.target.value)}
                              className="w-full pl-9 pr-3 h-9 rounded-md border border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              <option value="">{t('select_destination')}</option>
                              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      {form.from_location && form.to_location && (
                        <div className="flex items-center gap-2 text-sm text-primary font-medium bg-primary/5 rounded-xl px-4 py-2.5">
                          <span>{form.from_location}</span>
                          <ArrowRight className="w-4 h-4" />
                          <span>{form.to_location}</span>
                        </div>
                      )}

                      {/* Date & Passengers */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">{t('date')}</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="date"
                              required
                              value={form.travel_date}
                              onChange={(e) => set('travel_date', e.target.value)}
                              className="pl-9"
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">{t('passengers')}</Label>
                          <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              required
                              value={form.passengers}
                              onChange={(e) => set('passengers', e.target.value)}
                              className="pl-9"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Trip type */}
                      <div>
                        <Label className="text-xs font-semibold text-foreground/70 mb-3 block">{t('trip_type')}</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'outbound', label: t('outbound'), icon: ArrowRight },
                            { key: 'return', label: t('return_trip'), icon: ArrowLeftRight },
                            { key: 'round-trip', label: t('round_trip'), icon: RefreshCw },
                          ].map((opt) => {
                            const Icon = opt.icon;
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => set('trip_type', opt.key)}
                                className={`p-2 rounded-lg text-xs font-medium border transition-colors ${
                                  form.trip_type === opt.key
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border bg-transparent text-muted-foreground hover:bg-muted'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5 mx-auto mb-0.5" />
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {(form.trip_type === 'round-trip' || form.trip_type === 'return') && (
                        <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
                          <p className="text-xs font-semibold text-primary">{t('home_return')}: {form.to_location || '…'} → {form.from_location || '…'}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">{t('return_date')}</Label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input type="date" required value={form.return_date} onChange={(e) => set('return_date', e.target.value)} className="pl-9 h-9 text-sm" min={form.travel_date} />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">{t('return_passengers')}</Label>
                              <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input type="number" min={1} max={20} required value={form.return_passengers} onChange={(e) => set('return_passengers', e.target.value)} className="pl-9 h-9 text-sm" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Message */}
                      <div>
                        <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">{t('describe_trip')} <span className="text-muted-foreground text-xs">{t('describe_trip_optional')}</span></Label>
                        <Textarea
                          placeholder={t('describe_placeholder')}
                          value={form.message}
                          onChange={(e) => set('message', e.target.value)}
                          className="resize-none h-20"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setOpen(false)}
                          className="flex-1 rounded-xl"
                        >
                          {t('cancel') || 'Annuller'}
                        </Button>
                        <Button
                          type="submit"
                          disabled={mutation.isPending}
                          className="flex-1 bg-primary text-white hover:bg-primary/90 rounded-xl gap-2 font-semibold"
                        >
                          {mutation.isPending ? t('sending') : (
                            <><Send className="w-4 h-4" /> {t('send_request')}</>
                          )}
                        </Button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}