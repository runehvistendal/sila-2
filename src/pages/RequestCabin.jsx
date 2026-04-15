import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Calendar, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const LOCATIONS = [
  'Nuuk', 'Ilulissat', 'Sisimiut', 'Aasiaat', 'Maniitsoq',
  'Tasiilaq', 'Nanortalik', 'Qaqortoq', 'Paamiut', 'Uummannaq',
];

export default function RequestCabin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    location: '',
    check_in: '',
    check_out: '',
    guests: 2,
    note: '',
  });

  const mutation = useMutation({
    mutationFn: () =>
      base44.entities.CabinRequest.create({
        ...form,
        guests: Number(form.guests),
        guest_name: user.full_name || '',
        guest_email: user.email,
        status: 'pending',
      }),
    onSuccess: () => {
      qc.invalidateQueries(['my-cabin-requests']);
      setDone(true);
      toast({ title: 'Hytte-forespørgsel sendt!', description: 'Hosts i dit valgte område vil modtage din forespørgsel.' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) { base44.auth.redirectToLogin(); return; }
    if (!form.location || !form.check_in || !form.check_out) return;
    mutation.mutate();
  };

  if (done) {
    return (
      <div className="min-h-screen pt-20 bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Forespørgsel sendt!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Hosts i <strong>{form.location}</strong> vil modtage din forespørgsel og kan sende dig et tilbud.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="rounded-xl">
              Se mit dashboard
            </Button>
            <Button onClick={() => { setDone(false); setForm({ location: '', check_in: '', check_out: '', guests: 2, note: '' }); }} className="bg-primary text-white rounded-xl">
              Ny forespørgsel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-background">
      <div className="max-w-xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-xs font-semibold mb-4">
            <MapPin className="w-3.5 h-3.5" /> Hytte-forespørgsel
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Find den rette hytte</h1>
          <p className="text-muted-foreground text-sm">
            Post din ønskede rejse – hosts i området svarer med tilgængelighed og pris.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Ønsket sted</label>
            <Select value={form.location} onValueChange={v => setForm(f => ({ ...f, location: v }))}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Vælg destination..." />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Ankomst
              </label>
              <Input type="date" value={form.check_in} onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))} className="h-11 rounded-xl" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Afrejse
              </label>
              <Input type="date" value={form.check_out} onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))} className="h-11 rounded-xl" required />
            </div>
          </div>

          {/* Guests */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Antal gæster
            </label>
            <Input
              type="number"
              min={1}
              max={20}
              value={form.guests}
              onChange={e => setForm(f => ({ ...f, guests: e.target.value }))}
              className="h-11 rounded-xl"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Besked til hosts (valgfri)</label>
            <Textarea
              placeholder="Beskriv hvad I leder efter – antal soverum, huskelister, særlige ønsker..."
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className="h-24 rounded-xl resize-none text-sm"
            />
          </div>

          {/* Info box */}
          <div className="bg-muted rounded-xl p-4 text-xs text-muted-foreground space-y-1">
            <p>📍 Kun hosts i <strong>{form.location || 'dit valgte område'}</strong> modtager forespørgslen.</p>
            <p>🔒 Din e-mail vises ikke offentligt – kun matchede hosts kan kontakte dig.</p>
            <p>✅ Du accepterer ét tilbud og booker direkte med hosten.</p>
          </div>

          <Button
            type="submit"
            disabled={mutation.isPending || !form.location || !form.check_in || !form.check_out}
            className="w-full h-12 bg-primary text-white rounded-xl font-semibold text-base gap-2"
          >
            {mutation.isPending ? 'Sender...' : <>Send forespørgsel <ArrowRight className="w-4 h-4" /></>}
          </Button>
        </form>
      </div>
    </div>
  );
}