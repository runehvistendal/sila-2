import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Anchor, MapPin, Calendar, Users, Send, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const LOCATIONS = [
  'Nuuk', 'Ilulissat', 'Sisimiut', 'Qaqortoq', 'Aasiaat',
  'Maniitsoq', 'Tasiilaq', 'Paamiut', 'Nanortalik', 'Uummannaq',
  'Kangaatsiaq', 'Qasigiannguit', 'Narsaq', 'Kangerlussuaq',
  'Ilimanaq', 'Qeqertarsuaq', 'Ittoqqortoormiit', 'Qaanaaq',
];

export default function RequestTransport() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    from_location: '',
    to_location: '',
    travel_date: '',
    passengers: 1,
    message: '',
  });

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.TransportRequest.create(data),
    onSuccess: () => {
      toast({ title: 'Forespørgsel sendt!', description: 'Lokale aktører vil snart svare med et tilbud.' });
      navigate('/dashboard?tab=transport-requests');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      base44.auth.redirectToLogin(window.location.pathname);
      return;
    }
    mutation.mutate({
      ...form,
      passengers: Number(form.passengers),
      guest_name: user.full_name || '',
      guest_email: user.email,
      status: 'pending',
    });
  };

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">

        {/* Header */}
        <div className="mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Anchor className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Anmod om transport</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Beskriv din tur — lokale sejlere og bådejere vil svare med et pristilbud.
            Ingen fast pris, ingen skjulte gebyrer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl border border-border p-6 shadow-card">

          {/* Route */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">Fra</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  required
                  value={form.from_location}
                  onChange={(e) => set('from_location', e.target.value)}
                  className="w-full pl-9 pr-3 h-9 rounded-md border border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Vælg afgangssted</option>
                  {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                  <option value="Andet">Andet (beskriv nedenfor)</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">Til</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  required
                  value={form.to_location}
                  onChange={(e) => set('to_location', e.target.value)}
                  className="w-full pl-9 pr-3 h-9 rounded-md border border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Vælg destination</option>
                  {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                  <option value="Andet">Andet (beskriv nedenfor)</option>
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
              <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">Dato</Label>
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
              <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">Antal passagerer</Label>
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

          {/* Message */}
          <div>
            <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">
              Beskriv din tur <span className="text-muted-foreground font-normal">(valgfrit, men hjælper aktøren)</span>
            </Label>
            <Textarea
              placeholder="F.eks. vi er 2 voksne og 1 barn. Vi skal hente kajak-udstyr. Returtur samme dag om muligt."
              value={form.message}
              onChange={(e) => set('message', e.target.value)}
              className="resize-none h-24"
            />
          </div>

          {/* Info box */}
          <div className="bg-muted rounded-xl p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Sådan fungerer det:</p>
            <p>1. Du sender din forespørgsel — det er gratis og uforpligtende.</p>
            <p>2. Lokale aktører ser din forespørgsel og svarer med et pristilbud.</p>
            <p>3. Du vælger det tilbud, der passer bedst, og bekræfter.</p>
          </div>

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-primary text-white hover:bg-primary/90 rounded-xl h-11 gap-2 font-semibold"
          >
            {mutation.isPending ? 'Sender...' : (
              <><Send className="w-4 h-4" /> Send forespørgsel</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}