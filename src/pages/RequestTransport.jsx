import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Anchor, MapPin, Calendar, Users, Send, ArrowRight, ArrowLeftRight, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const LOCATIONS = [
  'Nuuk', 'Ilulissat', 'Sisimiut', 'Qaqortoq', 'Aasiaat',
  'Maniitsoq', 'Tasiilaq', 'Paamiut', 'Nanortalik', 'Uummannaq',
  'Kangaatsiaq', 'Qasigiannguit', 'Narsaq', 'Kangerlussuaq',
  'Ilimanaq', 'Qeqertarsuaq', 'Ittoqqortoormiit', 'Qaanaaq',
];

export default function RequestTransport() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    from_location: '',
    to_location: '',
    travel_date: '',
    passengers: 1,
    trip_type: 'round-trip', // 'outbound', 'return', 'round-trip'
    return_date: '',
    return_passengers: 1,
    message: '',
  });

  const set = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Sync return passengers when outbound passengers change
      if (field === 'passengers') {
        updated.return_passengers = value;
      }
      return updated;
    });
  };

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.TransportRequest.create(data),
    onSuccess: () => {
      toast({ title: t('request_sent'), description: t('request_sent_desc') });
      navigate('/dashboard?tab=transport-requests');
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
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">

        {/* Header */}
        <div className="mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Anchor className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('request_transport_title')}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t('request_transport_desc')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl border border-border p-6 shadow-card">

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
                  <option value="Andet">{t('other_describe')}</option>
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
                  <option value="Andet">{t('other_describe')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Route preview */}
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

          {/* Trip type selector */}
          <div>
            <Label className="text-xs font-semibold text-foreground/70 mb-3 block">{t('trip_type')}</Label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { key: 'outbound', label: t('outbound'), icon: ArrowRight, desc: t('single_way') },
                { key: 'return', label: t('return_trip'), icon: ArrowLeftRight, desc: t('single_way') },
                { key: 'round-trip', label: t('round_trip'), icon: RefreshCw, desc: t('both_ways') },
              ].map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => set('trip_type', opt.key)}
                    className={`p-3 rounded-xl text-sm font-medium transition-colors border ${
                      form.trip_type === opt.key
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-transparent text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1 mx-auto" />
                    <div className="font-semibold text-xs">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Return date & passengers for return/round-trip */}
            {(form.trip_type === 'round-trip' || form.trip_type === 'return') && (
              <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-4">
                <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  {form.trip_type === 'round-trip' ? t('home_return') : t('return_trip')}: {form.to_location || '…'} → {form.from_location || '…'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">{t('return_date')}</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="date"
                        required
                        value={form.return_date}
                        onChange={(e) => set('return_date', e.target.value)}
                        className="pl-9 bg-white"
                        min={form.travel_date || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">{t('return_passengers')}</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        required
                        value={form.return_passengers}
                        onChange={(e) => set('return_passengers', e.target.value)}
                        className="pl-9 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">
              {t('describe_trip')} <span className="text-muted-foreground font-normal">{t('describe_trip_optional')}</span>
            </Label>
            <Textarea
              placeholder={t('describe_placeholder')}
              value={form.message}
              onChange={(e) => set('message', e.target.value)}
              className="resize-none h-24"
            />
          </div>

          {/* Info box */}
          <div className="bg-muted rounded-xl p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">{t('how_it_works')}</p>
            <p>{t('step1')}</p>
            <p>{t('step2')}</p>
            <p>{t('step3')}</p>
          </div>

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-primary text-white hover:bg-primary/90 rounded-xl h-11 gap-2 font-semibold"
          >
            {mutation.isPending ? t('sending') : (
              <><Send className="w-4 h-4" /> {t('send_request')}</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}