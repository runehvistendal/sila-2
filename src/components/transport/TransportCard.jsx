import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Clock, Users, Anchor, Home, Shield, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function TransportCard({ transport, compact = false }) {
  const { data: providerTrust } = useQuery({
    queryKey: ['provider-trust', transport.provider_email],
    queryFn: () => base44.entities.ProviderTrust.filter({ provider_email: transport.provider_email }, null, 1).then(r => r[0]),
    enabled: !!transport.provider_email,
  });

  const getTrustBadgeColor = (status) => {
    if (!status) return 'bg-muted text-muted-foreground';
    if (status === 'active') return 'bg-green-100 text-green-700';
    if (status === 'warning') return 'bg-amber-100 text-amber-700';
    if (status === 'suspended_temp' || status === 'suspended_perm') return 'bg-red-100 text-red-700';
    return 'bg-muted text-muted-foreground';
  };

  const getTrustLabel = (status, score) => {
    if (!status) return `${score || 0}/100`;
    if (status === 'active') return `${score || 0}/100 - Verificeret`;
    if (status === 'warning') return `${score || 0}/100 - Advarsel`;
    if (status === 'suspended_temp') return 'Midlertidigt suspenderet';
    if (status === 'suspended_perm') return 'Permanent suspenderet';
    return `${score || 0}/100`;
  };

  const content = (
    <div className={`bg-white rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-shadow p-5 ${compact ? '' : 'hover:border-primary/30'}`}>
      {/* Route */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
            <span className="truncate">{transport.from_location}</span>
            <ArrowRight className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{transport.to_location}</span>
          </div>
          {transport.provider_name && (
            <p className="text-xs text-muted-foreground mt-0.5">by {transport.provider_name}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-foreground text-sm">{transport.round_trip_price} DKK</p>
          <p className="text-xs text-muted-foreground">tur/retur</p>
        </div>
      </div>

      {/* Provider Trust Score */}
      {providerTrust && (
        <div className="mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getTrustBadgeColor(providerTrust.status)}`}>
            {getTrustLabel(providerTrust.status, providerTrust.trust_score)}
          </span>
          {providerTrust.status === 'suspended_perm' && (
            <span className="inline-flex items-center gap-1 text-xs text-destructive font-medium">
              <AlertTriangle className="w-3 h-3" />
              Booking ikke tilgængelig
            </span>
          )}
        </div>
      )}

      {/* Details row */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
          <Calendar className="w-3 h-3" />
          {format(new Date(transport.departure_date), 'MMM d, yyyy')}
        </span>
        {transport.departure_time && (
          <span className="inline-flex items-center gap-1.5 text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            {transport.departure_time}
          </span>
        )}
        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
          transport.seats_available > 0 ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'
        }`}>
          <Users className="w-3 h-3" />
          {transport.seats_available} seat{transport.seats_available !== 1 ? 's' : ''} left
        </span>
        {transport.boat_type && (
          <span className="inline-flex items-center gap-1.5 text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
            <Anchor className="w-3 h-3" />
            {transport.boat_type}
          </span>
        )}
        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
          transport.has_cabin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        }`}>
          <Home className="w-3 h-3" />
          {transport.has_cabin ? 'Med kabine' : 'Uden kabine'}
        </span>
      </div>

      {!compact && (
        <Link to={`/transport/${transport.id}`}>
          <Button size="sm" variant="outline" className="w-full rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors">
            View & Book
          </Button>
        </Link>
      )}
    </div>
  );

  if (compact) return content;
  return content;
}