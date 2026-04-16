import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Anchor, MapPin, Calendar, Users, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import RequestChat from '@/components/chat/RequestChat';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RatingModal from '@/components/ratings/RatingModal';
import LifeJacketConfirmation from '@/components/transport/LifeJacketConfirmation';
import SafetyFeedbackForm from '@/components/ratings/SafetyFeedbackForm';
import RequestFilters from './RequestFilters';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  quoted: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS = {
  pending: 'Afventer',
  quoted: 'Tilbud sendt',
  accepted: 'Accepteret',
  declined: 'Afvist',
  cancelled: 'Annulleret',
};

// ---- PROVIDER VIEW ----
export function IncomingRequestsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(null);
  const [quoting, setQuoting] = useState(null);
  const [quote, setQuote] = useState({ price: '', seats: '', message: '' });
  const [ratingFor, setRatingFor] = useState(null);
  const [filters, setFilters] = useState({ location: '', status: 'all', passengers: '' });

  const { data: allRequests = [] } = useQuery({
    queryKey: ['incoming-transport-requests'],
    queryFn: () => base44.entities.TransportRequest.filter({}, '-created_date', 50),
    enabled: !!user,
  });

  // Apply filters
  const requests = allRequests.filter(r => {
    if (filters.location && r.from_location !== filters.location) return false;
    if (filters.status !== 'all' && r.status !== filters.status) return false;
    if (filters.passengers && r.passengers < Number(filters.passengers)) return false;
    return true;
  });

  const quoteMutation = useMutation({
    mutationFn: ({ id }) =>
      base44.entities.TransportRequest.update(id, {
        status: 'quoted',
        provider_email: user.email,
        provider_name: user.full_name || user.email,
        quoted_price_dkk: Number(quote.price),
        provider_message: quote.message,
      }),
    onSuccess: () => {
      qc.invalidateQueries(['incoming-transport-requests']);
      setQuoting(null);
      setQuote({ price: '', seats: '', message: '' });
    },
  });

  if (allRequests.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-border">
        <Anchor className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">Ingen åbne transportforespørgsler</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RequestFilters onFilterChange={setFilters} type="transport" />
      {requests.length === 0 ? (
        <div className="text-center py-8 bg-muted rounded-xl">
          <p className="text-sm text-muted-foreground">Ingen forespørgsler matcher dine filtre</p>
        </div>
      ) : (
      <div className="space-y-3">
      {requests.map((r) => (
        <RequestCard
          key={r.id}
          request={r}
          isProvider
          expanded={expanded === r.id}
          onToggle={() => setExpanded(expanded === r.id ? null : r.id)}
          quoting={quoting === r.id}
          onQuote={() => setQuoting(r.id)}
          onCancelQuote={() => setQuoting(null)}
          quote={quote}
          setQuote={setQuote}
          onSubmitQuote={() => quoteMutation.mutate({ id: r.id })}
          quotePending={quoteMutation.isPending}
          providerEmail={user.email}
          onRate={() => setRatingFor(r)}
        />
      ))}
      {ratingFor && (
        <Dialog open onOpenChange={() => setRatingFor(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Bedøm gæsten</DialogTitle></DialogHeader>
            <RatingModal requestId={ratingFor.id} requestType="transport" toEmail={ratingFor.guest_email} toName={ratingFor.guest_name || 'Gæsten'} onDone={() => setRatingFor(null)} />
          </DialogContent>
        </Dialog>
      )}
      )}
    </div>
  );
}

// ---- GUEST VIEW ----
export function MyTransportRequestsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(null);
  const [ratingFor, setRatingFor] = useState(null);

  const { data: requests = [] } = useQuery({
    queryKey: ['my-transport-requests', user?.email],
    queryFn: () => base44.entities.TransportRequest.filter({ guest_email: user.email }, '-created_date', 30),
    enabled: !!user,
  });

  // Check which requests already have safety feedback
  const { data: existingFeedback = [] } = useQuery({
    queryKey: ['my-safety-feedback', user?.email],
    queryFn: () => base44.entities.SafetyFeedback.filter({ guest_email: user.email }, null, 100),
    enabled: !!user,
  });

  const feedbackBookingIds = new Set(existingFeedback.map(f => f.booking_id));

  const respondMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.TransportRequest.update(id, { status }),
    onSuccess: () => qc.invalidateQueries(['my-transport-requests']),
  });

  if (requests.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-border">
        <Anchor className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium mb-4">Ingen transportforespørgsler endnu</p>
        <Button variant="outline" onClick={() => window.location.href = '/request-transport'} className="rounded-xl px-6">
          Anmod om transport
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <div key={r.id} className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground flex-wrap">
                <Anchor className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{r.from_location}</span>
                <span className="text-muted-foreground">→</span>
                <span>{r.to_location}</span>
                <Badge className={`${STATUS_COLORS[r.status]} border-0 text-xs ml-1`}>{STATUS_LABELS[r.status]}</Badge>
              </div>
              <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(r.travel_date), 'MMM d, yyyy')}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.passengers} passagerer</span>
              </div>
            </div>
            <button onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
              {expanded === r.id ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </button>
          </div>

          {/* Offer from provider */}
          {r.status === 'quoted' && r.quoted_price_dkk && (
            <div className="mt-3 bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 mb-1">Tilbud fra {r.provider_name}</p>
              <p className="text-lg font-bold text-primary">{r.quoted_price_dkk} DKK</p>
              {r.provider_message && <p className="text-xs text-muted-foreground mt-1 italic">"{r.provider_message}"</p>}
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => respondMutation.mutate({ id: r.id, status: 'accepted' })} className="bg-primary text-white rounded-lg h-8 text-xs">Accepter</Button>
                <Button size="sm" variant="outline" onClick={() => respondMutation.mutate({ id: r.id, status: 'declined' })} className="rounded-lg h-8 text-xs text-destructive border-destructive/30">Afvis</Button>
              </div>
            </div>
          )}

          {expanded === r.id && (
            <div className="mt-4 space-y-3">
              <RequestChat
                requestId={r.id}
                requestType="transport"
                participants={[r.guest_email, r.provider_email].filter(Boolean)}
                onOfferAccepted={(od) => respondMutation.mutate({ id: r.id, status: 'accepted' })}
              />
              {r.status === 'accepted' && (
                <>
                  {/* Safety feedback form - only show if not already submitted */}
                  {!feedbackBookingIds.has(r.id) && (
                    <SafetyFeedbackForm
                      bookingId={r.id}
                      guestEmail={user.email}
                      providerEmail={r.provider_email}
                      onSubmitted={() => qc.invalidateQueries(['my-safety-feedback'])}
                    />
                  )}
                  <Button size="sm" variant="outline" onClick={() => setRatingFor(r)} className="rounded-xl text-xs">★ Bedøm udbyderen</Button>
                </>
              )}
            </div>
          )}
        </div>
      ))}

      {ratingFor && (
        <Dialog open onOpenChange={() => setRatingFor(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Bedøm transportudbyderen</DialogTitle></DialogHeader>
            <RatingModal requestId={ratingFor.id} requestType="transport" toEmail={ratingFor.provider_email} toName={ratingFor.provider_name || 'Udbyderen'} onDone={() => setRatingFor(null)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ---- SHARED REQUEST CARD (provider side) ----
function RequestCard({ request: r, isProvider, expanded, onToggle, quoting, onQuote, onCancelQuote, quote, setQuote, onSubmitQuote, quotePending, providerEmail, onRate }) {
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);

  // Check if compliance already exists for this request
  const { data: existingCompliance } = useQuery({
    queryKey: ['safety-compliance', r.id],
    queryFn: () => base44.entities.SafetyCompliance.filter({ booking_id: r.id, provider_email: providerEmail }, null, 1),
    enabled: isProvider && !!r.id,
    select: (data) => data?.length > 0,
  });

  const isConfirmed = safetyConfirmed || existingCompliance;

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground flex-wrap">
            <Anchor className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{r.from_location}</span>
            <span className="text-muted-foreground">→</span>
            <span>{r.to_location}</span>
            <Badge className={`${STATUS_COLORS[r.status]} border-0 text-xs ml-1`}>{STATUS_LABELS[r.status]}</Badge>
          </div>
          <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(r.travel_date), 'MMM d, yyyy')}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.passengers} passagerer</span>
          </div>
          {r.message && <p className="text-xs text-muted-foreground mt-1.5 italic">"{r.message}"</p>}
        </div>
        <button onClick={onToggle}>
          {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </button>
      </div>

      {isProvider && r.status === 'pending' && (
        <div className="mt-3 space-y-3">
          {/* Safety compliance gate — must confirm before sending quote */}
          <LifeJacketConfirmation
            requestId={r.id}
            providerEmail={providerEmail}
            passengerCount={r.passengers}
            alreadyConfirmed={isConfirmed}
            onConfirmed={() => setSafetyConfirmed(true)}
          />

          {isConfirmed && (
            quoting ? (
              <div className="bg-muted/50 rounded-xl p-3 space-y-2 border border-border">
                <p className="text-xs font-semibold">Send tilbud</p>
                <div className="flex gap-2">
                  <Input placeholder="Pris (DKK)" type="number" value={quote.price} onChange={e => setQuote(q => ({ ...q, price: e.target.value }))} className="h-9 text-sm" />
                  <Input placeholder="Pladser" type="number" value={quote.seats} onChange={e => setQuote(q => ({ ...q, seats: e.target.value }))} className="h-9 text-sm w-24" />
                </div>
                <Textarea placeholder="Besked til gæsten..." value={quote.message} onChange={e => setQuote(q => ({ ...q, message: e.target.value }))} className="h-16 text-sm resize-none" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={onSubmitQuote} disabled={!quote.price || quotePending} className="bg-primary text-white rounded-lg h-8 text-xs">Send tilbud</Button>
                  <Button size="sm" variant="ghost" onClick={onCancelQuote} className="h-8 text-xs">Annuller</Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={onQuote} className="bg-primary text-white rounded-lg h-8 text-xs">Send tilbud</Button>
                <Button size="sm" variant="outline" onClick={onToggle} className="rounded-lg h-8 text-xs gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </Button>
              </div>
            )
          )}
        </div>
      )}

      {expanded && (
        <div className="mt-4 space-y-3">
          <RequestChat
            requestId={r.id}
            requestType="transport"
            participants={[r.guest_email, providerEmail].filter(Boolean)}
          />
          {r.status === 'accepted' && (
            <Button size="sm" variant="outline" onClick={onRate} className="rounded-xl text-xs">★ Bedøm gæsten</Button>
          )}
        </div>
      )}
    </div>
  );
}