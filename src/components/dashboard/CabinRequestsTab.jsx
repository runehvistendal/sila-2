import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Users, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import RequestChat from '@/components/chat/RequestChat';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RatingModal from '@/components/ratings/RatingModal';
import RequestFilters from './RequestFilters';
import { capitalizeFirst } from '@/lib/statusUtils';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  quoted: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

// ---- GUEST VIEW ----
export function MyCabinRequestsTab() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(null);
  const [ratingFor, setRatingFor] = useState(null);

  const { data: requests = [] } = useQuery({
    queryKey: ['my-cabin-requests', user?.email],
    queryFn: () => base44.entities.CabinRequest.filter({ guest_email: user.email }, '-created_date', 30),
    enabled: !!user,
  });

  const acceptMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CabinRequest.update(id, { status: 'accepted', ...data }),
    onSuccess: () => qc.invalidateQueries(['my-cabin-requests']),
  });

  if (requests.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-border">
        <MapPin className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium mb-4">{t('no_cabin_requests_yet')}</p>
        <Button variant="outline" onClick={() => window.location.href = '/request-cabin'} className="rounded-xl px-6">
          {t('request_cabin_link')}
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />{r.location}
                </span>
                <Badge className={`${STATUS_COLORS[r.status]} border-0 text-xs`}>
                  {capitalizeFirst(t(`status_${r.status}`) || r.status)}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(r.check_in), 'MMM d')} – {format(new Date(r.check_out), 'MMM d, yyyy')}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.guests} {t('guests_label')}</span>
              </div>
            </div>
            <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="text-muted-foreground hover:text-foreground">
              {expanded === r.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {/* Host quote */}
          {r.status === 'quoted' && r.quoted_price_dkk && (
            <div className="mt-3 bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 mb-1">{t('offer_from')} {r.host_name || t('host')}</p>
              {r.cabin_title && <p className="text-sm font-medium text-foreground">{r.cabin_title}</p>}
              <p className="text-sm font-bold text-primary mt-1">{r.quoted_price_dkk} DKK total</p>
              {r.host_message && <p className="text-xs text-muted-foreground mt-1 italic">"{r.host_message}"</p>}
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => acceptMutation.mutate({ id: r.id, data: {} })} className="bg-primary text-white rounded-lg h-8 text-xs">{t('accept')}</Button>
                <Button size="sm" variant="outline" onClick={() => base44.entities.CabinRequest.update(r.id, { status: 'declined' }).then(() => qc.invalidateQueries(['my-cabin-requests']))} className="rounded-lg h-8 text-xs text-destructive border-destructive/30">{t('decline')}</Button>
              </div>
            </div>
          )}

          {/* Chat + rating */}
          {expanded === r.id && (
            <div className="mt-4 space-y-4">
              <RequestChat
                requestId={r.id}
                requestType="cabin"
                participants={[r.guest_email, r.host_email].filter(Boolean)}
              />
              {r.status === 'accepted' && (
                <Button size="sm" variant="outline" onClick={() => setRatingFor(r)} className="rounded-xl text-xs gap-1">
                  ★ {t('rate_host')}
                </Button>
              )}
            </div>
          )}
        </div>
      ))}

      {ratingFor && (
        <Dialog open onOpenChange={() => setRatingFor(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('rate_host')}</DialogTitle></DialogHeader>
            <RatingModal requestId={ratingFor.id} requestType="cabin" toEmail={ratingFor.host_email} toName={ratingFor.host_name || t('host')} onDone={() => setRatingFor(null)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ---- HOST VIEW ----
export function IncomingCabinRequestsTab() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(null);
  const [quoting, setQuoting] = useState(null);
  const [quote, setQuote] = useState({ price: '', cabin_title: '', message: '' });
  const [ratingFor, setRatingFor] = useState(null);
  const [filters, setFilters] = useState({ location: '', status: 'all', passengers: '' });

  const { data: myCabins = [] } = useQuery({
    queryKey: ['my-cabins-host', user?.email],
    queryFn: () => base44.entities.Cabin.filter({ host_email: user.email }, '-created_date', 50),
    enabled: !!user,
  });

  const locations = [...new Set(myCabins.map(c => c.location))];
  const { data: allRequests = [] } = useQuery({
    queryKey: ['cabin-requests-for-host', locations.join(',')],
    queryFn: async () => {
      if (locations.length === 0) return [];
      const results = await Promise.all(
        locations.map(loc => base44.entities.CabinRequest.filter({ location: loc }, '-created_date', 50))
      );
      return results.flat();
    },
    enabled: locations.length > 0,
  });

  const filteredRequests = allRequests.filter(r => {
    if (filters.location && r.location !== filters.location) return false;
    if (filters.status !== 'all' && r.status !== filters.status) return false;
    if (filters.passengers && r.guests < Number(filters.passengers)) return false;
    return true;
  });

  const quoteMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.CabinRequest.update(id, {
      status: 'quoted',
      host_email: user.email,
      host_name: user.full_name || user.email,
      quoted_price_dkk: Number(quote.price),
      cabin_title: quote.cabin_title,
      host_message: quote.message,
    }),
    onSuccess: () => {
      qc.invalidateQueries(['cabin-requests-for-host']);
      setQuoting(null);
      setQuote({ price: '', cabin_title: '', message: '' });
    },
  });

  if (myCabins.length === 0) {
    return <p className="text-sm text-muted-foreground bg-muted rounded-xl p-4">{t('must_have_cabin')}</p>;
  }

  if (allRequests.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-border">
        <MapPin className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">{t('no_area_requests')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RequestFilters onFilterChange={setFilters} type="cabin" />
      {filteredRequests.length === 0 ? (
        <div className="text-center py-8 bg-muted rounded-xl">
          <p className="text-sm text-muted-foreground">{t('no_filters_match')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary" />{r.location}
                    </span>
                    <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">{capitalizeFirst(t('status_open'))}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(r.check_in), 'MMM d')} – {format(new Date(r.check_out), 'MMM d, yyyy')}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.guests} {t('guests_label')}</span>
                  </div>
                  {r.note && <p className="text-xs text-muted-foreground mt-1.5 italic">"{r.note}"</p>}
                </div>
                <button onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                  {expanded === r.id ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </button>
              </div>

              {quoting === r.id ? (
                <div className="mt-3 bg-muted/50 rounded-xl p-3 space-y-2 border border-border">
                  <p className="text-xs font-semibold">{t('send_quote')}</p>
                  <Input placeholder={`${t('total_label')} (DKK)`} type="number" value={quote.price} onChange={e => setQuote(q => ({ ...q, price: e.target.value }))} className="h-9 text-sm" />
                  <Input placeholder={`${t('cabin')} (${t('message_optional')})`} value={quote.cabin_title} onChange={e => setQuote(q => ({ ...q, cabin_title: e.target.value }))} className="h-9 text-sm" />
                  <Textarea placeholder={`${t('message_optional')}...`} value={quote.message} onChange={e => setQuote(q => ({ ...q, message: e.target.value }))} className="h-16 text-sm resize-none" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => quoteMutation.mutate({ id: r.id })} disabled={!quote.price || quoteMutation.isPending} className="bg-primary text-white rounded-lg h-8 text-xs">{t('send_quote')}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setQuoting(null)} className="h-8 text-xs">{t('cancel')}</Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => setQuoting(r.id)} className="bg-primary text-white rounded-lg h-8 text-xs gap-1">
                    {t('send_quote')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="rounded-lg h-8 text-xs gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> Chat
                  </Button>
                </div>
              )}

              {expanded === r.id && (
                <div className="mt-4 space-y-3">
                  <RequestChat
                    requestId={r.id}
                    requestType="cabin"
                    participants={[r.guest_email, user.email]}
                  />
                  {r.status === 'accepted' && (
                    <Button size="sm" variant="outline" onClick={() => setRatingFor(r)} className="rounded-xl text-xs gap-1">★ {t('rate_guest')}</Button>
                  )}
                </div>
              )}
            </div>
          ))}

          {ratingFor && (
            <Dialog open onOpenChange={() => setRatingFor(null)}>
              <DialogContent>
                <DialogHeader><DialogTitle>{t('rate_guest')}</DialogTitle></DialogHeader>
                <RatingModal requestId={ratingFor.id} requestType="cabin" toEmail={ratingFor.guest_email} toName={ratingFor.guest_name || t('guests')} onDone={() => setRatingFor(null)} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </div>
  );
}