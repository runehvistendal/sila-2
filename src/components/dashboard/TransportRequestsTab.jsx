import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Calendar, Users, MessageSquare, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  quoted: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const STATUS_DA = {
  pending: 'Afventer',
  quoted: 'Tilbud sendt',
  accepted: 'Accepteret',
  declined: 'Afslået',
  cancelled: 'Annulleret',
};

// --- Provider view: incoming requests they can quote ---
export function IncomingRequestsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ price: '', message: '' });

  const { data: requests = [] } = useQuery({
    queryKey: ['all-transport-requests'],
    queryFn: () => base44.entities.TransportRequest.list('-created_date', 50),
    enabled: !!user,
  });

  const quoteMutation = useMutation({
    mutationFn: ({ id, price, message }) =>
      base44.entities.TransportRequest.update(id, {
        quoted_price_dkk: Number(price),
        provider_message: message,
        provider_name: user.full_name || user.email,
        provider_email: user.email,
        status: 'quoted',
      }),
    onSuccess: () => {
      qc.invalidateQueries(['all-transport-requests']);
      setExpanded(null);
      setQuoteForm({ price: '', message: '' });
      toast({ title: 'Tilbud sendt!', description: 'Gæsten vil se dit tilbud.' });
    },
  });

  const pending = requests.filter((r) => r.status === 'pending');
  const others = requests.filter((r) => r.status !== 'pending');

  if (requests.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-border">
        <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">Ingen forespørgsler endnu</p>
        <p className="text-sm text-muted-foreground mt-1">Når gæster sender transportforespørgsler, vises de her</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            Åbne forespørgsler
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
          </h3>
          <div className="space-y-3">
            {pending.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                isProvider
                expanded={expanded === r.id}
                onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
                quoteForm={quoteForm}
                setQuoteForm={setQuoteForm}
                onQuote={() => quoteMutation.mutate({ id: r.id, price: quoteForm.price, message: quoteForm.message })}
                quoting={quoteMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}
      {others.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-3">Tidligere forespørgsler</h3>
          <div className="space-y-3">
            {others.map((r) => (
              <RequestCard key={r.id} request={r} isProvider expanded={false} onToggle={() => {}} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Guest view: their own requests and incoming quotes ---
export function MyTransportRequestsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ['my-transport-requests', user?.email],
    queryFn: () => base44.entities.TransportRequest.filter({ guest_email: user.email }, '-created_date', 30),
    enabled: !!user,
  });

  const acceptMutation = useMutation({
    mutationFn: (id) => base44.entities.TransportRequest.update(id, { status: 'accepted' }),
    onSuccess: () => {
      qc.invalidateQueries(['my-transport-requests']);
      toast({ title: 'Tilbud accepteret!', description: 'Aktøren er nu bekræftet.' });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (id) => base44.entities.TransportRequest.update(id, { status: 'declined' }),
    onSuccess: () => qc.invalidateQueries(['my-transport-requests']),
  });

  if (requests.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-border">
        <ArrowRight className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">Ingen transportforespørgsler</p>
        <Button variant="outline" className="mt-4 rounded-xl px-6" onClick={() => window.location.href = '/request-transport'}>
          Anmod om transport
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <RequestCard
          key={r.id}
          request={r}
          isProvider={false}
          expanded={false}
          onToggle={() => {}}
          onAccept={() => acceptMutation.mutate(r.id)}
          onDeclineQuote={() => declineMutation.mutate(r.id)}
        />
      ))}
    </div>
  );
}

function RequestCard({ request: r, isProvider, expanded, onToggle, quoteForm, setQuoteForm, onQuote, quoting, onAccept, onDeclineQuote }) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground">
            <span>{r.from_location}</span>
            <ArrowRight className="w-3.5 h-3.5 text-primary" />
            <span>{r.to_location}</span>
          </div>
          <Badge className={`${STATUS_COLORS[r.status]} border-0 text-xs`}>{STATUS_DA[r.status]}</Badge>
        </div>

        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(r.travel_date), 'MMM d, yyyy')}</span>
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{r.passengers} passager{r.passengers !== 1 ? 'er' : ''}</span>
          {isProvider && (r.guest_name || r.guest_email) && (
            <span className="text-foreground/70">fra {r.guest_name || r.guest_email}</span>
          )}
        </div>

        {r.message && (
          <p className="mt-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 italic">"{r.message}"</p>
        )}

        {/* Quote received (guest view) */}
        {!isProvider && r.status === 'quoted' && (
          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-800 mb-1">Tilbud modtaget fra {r.provider_name}</p>
            <p className="text-xl font-bold text-foreground">{r.quoted_price_dkk} DKK</p>
            {r.provider_message && <p className="text-xs text-muted-foreground mt-1 italic">"{r.provider_message}"</p>}
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={onAccept} className="bg-primary text-white hover:bg-primary/90 rounded-lg">
                Accepter tilbud
              </Button>
              <Button size="sm" variant="outline" onClick={onDeclineQuote} className="rounded-lg text-destructive border-destructive/30 hover:bg-destructive hover:text-white">
                Afslå
              </Button>
            </div>
          </div>
        )}

        {/* Accepted state */}
        {!isProvider && r.status === 'accepted' && (
          <div className="mt-3 bg-green-50 border border-green-100 rounded-xl p-3 text-sm text-green-800">
            ✓ Bekræftet med {r.provider_name} — {r.quoted_price_dkk} DKK. Kontakt: {r.provider_email}
          </div>
        )}

        {/* Provider: give quote button */}
        {isProvider && r.status === 'pending' && (
          <button
            onClick={onToggle}
            className="mt-3 flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Luk' : 'Giv et tilbud'}
          </button>
        )}
      </div>

      {/* Quote form */}
      {isProvider && expanded && r.status === 'pending' && (
        <div className="border-t border-border bg-muted/40 px-5 py-4 space-y-3">
          <div>
            <Label className="text-xs font-semibold mb-1 block">Din pris (DKK)</Label>
            <Input
              type="number"
              min={0}
              placeholder="F.eks. 1200"
              value={quoteForm.price}
              onChange={(e) => setQuoteForm((p) => ({ ...p, price: e.target.value }))}
              className="max-w-xs"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1 block">
              Besked til gæst <span className="font-normal text-muted-foreground">(valgfrit)</span>
            </Label>
            <Textarea
              placeholder="F.eks. inkl. brændstof, afgang kl. 09:00"
              value={quoteForm.message}
              onChange={(e) => setQuoteForm((p) => ({ ...p, message: e.target.value }))}
              className="resize-none h-20"
            />
          </div>
          <Button
            size="sm"
            disabled={!quoteForm.price || quoting}
            onClick={onQuote}
            className="bg-primary text-white hover:bg-primary/90 rounded-lg gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            {quoting ? 'Sender...' : 'Send tilbud'}
          </Button>
        </div>
      )}
    </div>
  );
}