import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Home, Calendar, Users, MapPin, MessageSquare, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import RequestChat from '@/components/chat/RequestChat';

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

export default function CabinRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [quoting, setQuoting] = useState(false);
  const [quote, setQuote] = useState({ price: '', cabinTitle: '', message: '' });

  const { data: request, isLoading } = useQuery({
    queryKey: ['cabin-request', id],
    queryFn: () => base44.entities.CabinRequest.filter({ id }, null, 1).then(r => r[0]),
    enabled: !!id,
  });

  const quoteMutation = useMutation({
    mutationFn: () =>
      base44.entities.CabinRequest.update(id, {
        status: 'quoted',
        host_email: user.email,
        host_name: user.full_name || user.email,
        quoted_price_dkk: Number(quote.price),
        cabin_title: quote.cabinTitle,
        host_message: quote.message,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cabin-request', id] });
      setQuoting(false);
      setQuote({ price: '', cabinTitle: '', message: '' });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('createCabinBooking', {
        requestId: id,
        guestEmail: request.guest_email,
        guestName: request.guest_name,
        price: request.quoted_price_dkk,
        message: request.note,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cabin-request', id] });
      base44.entities.CabinRequest.update(id, { status: 'accepted' });
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ status }) => base44.entities.CabinRequest.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cabin-request', id] }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-16 bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen pt-16 bg-background p-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-1">
          <ArrowLeft className="w-4 h-4" /> Tilbage
        </Button>
        <p className="text-muted-foreground">Anmodning ikke fundet.</p>
      </div>
    );
  }

  const isGuest = request.guest_email === user?.email;
  const isHost = !isGuest && user?.email;

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-1">
          <ArrowLeft className="w-4 h-4" /> Tilbage
        </Button>

        <div className="bg-white rounded-xl border border-border p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Home className="w-6 h-6 text-primary" />
                  {request.location}
                </h1>
              </div>
              <Badge className={`${STATUS_COLORS[request.status]} border-0 text-xs mt-2`}>
                {STATUS_LABELS[request.status]}
              </Badge>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted rounded-xl p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Periode</p>
              <p className="font-semibold text-foreground text-sm">
                {format(new Date(request.check_in), 'd. MMM')} – {format(new Date(request.check_out), 'd. MMM yyyy')}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Gæster</p>
              <p className="font-semibold text-foreground">{request.guests}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Anmoder</p>
              <p className="font-semibold text-foreground">{request.guest_name || request.guest_email}</p>
            </div>
          </div>

          {/* Guest message */}
          {request.note && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 mb-1">Anmoders besked</p>
              <p className="text-sm text-foreground italic">"{request.note}"</p>
            </div>
          )}

          {/* Host quote */}
          {request.status !== 'pending' && request.quoted_price_dkk && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-green-700">Tilbud fra {request.host_name}</p>
              {request.cabin_title && <p className="text-sm font-medium text-foreground">{request.cabin_title}</p>}
              <p className="text-2xl font-bold text-primary">{request.quoted_price_dkk} DKK</p>
              {request.host_message && (
                <p className="text-sm text-foreground italic">"{request.host_message}"</p>
              )}
            </div>
          )}

          {/* Actions for guest */}
          {isGuest && request.status === 'quoted' && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-foreground mb-3">Accepter eller afvis tilbuddet?</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => acceptMutation.mutate()}
                  disabled={acceptMutation.isPending}
                  className="bg-primary text-white hover:bg-primary/90 rounded-xl gap-2"
                >
                  <Check className="w-4 h-4" /> Accepter
                </Button>
                <Button
                  onClick={() => respondMutation.mutate({ status: 'declined' })}
                  disabled={respondMutation.isPending}
                  variant="outline"
                  className="rounded-xl gap-2 text-destructive border-destructive/30"
                >
                  <X className="w-4 h-4" /> Afvis
                </Button>
              </div>
            </div>
          )}

          {/* Quote form for host */}
          {isHost && request.status === 'pending' && (
            <div>
              {quoting ? (
                <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border">
                  <p className="text-sm font-semibold text-foreground">Send tilbud</p>
                  <Input
                    placeholder="Hytte-navn (f.eks. 'Grønlands Paradise')"
                    value={quote.cabinTitle}
                    onChange={e => setQuote(q => ({ ...q, cabinTitle: e.target.value }))}
                    className="h-9 text-sm"
                  />
                  <Input
                    placeholder="Total pris (DKK)"
                    type="number"
                    value={quote.price}
                    onChange={e => setQuote(q => ({ ...q, price: e.target.value }))}
                    className="h-9 text-sm"
                  />
                  <Textarea
                    placeholder="Besked til anmoder..."
                    value={quote.message}
                    onChange={e => setQuote(q => ({ ...q, message: e.target.value }))}
                    className="h-20 text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => quoteMutation.mutate()}
                      disabled={!quote.price || quoteMutation.isPending}
                      className="bg-primary text-white hover:bg-primary/90 rounded-xl"
                    >
                      Send tilbud
                    </Button>
                    <Button
                      onClick={() => setQuoting(false)}
                      variant="ghost"
                      className="rounded-xl"
                    >
                      Annuller
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setQuoting(true)}
                  className="bg-primary text-white hover:bg-primary/90 rounded-xl w-full"
                >
                  Send tilbud
                </Button>
              )}
            </div>
          )}

          {/* Chat */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Beskeder
            </h2>
            <RequestChat
              requestId={id}
              requestType="cabin"
              participants={[request.guest_email, request.host_email].filter(Boolean)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}