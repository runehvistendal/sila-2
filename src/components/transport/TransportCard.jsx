import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Calendar, Clock, Users, Anchor, Home, Star } from 'lucide-react';
import { format } from 'date-fns';

export default function TransportCard({ transport, returnTrip = null, compact = false }) {
  const navigate = useNavigate();

  const { data: reviews = [] } = useQuery({
    queryKey: ['transport-card-reviews', transport.id],
    queryFn: () => base44.entities.Review.filter({ listing_id: transport.id }, null, 50),
    enabled: !!transport.id,
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const content = (
    <div className={`bg-white rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-shadow p-5 flex flex-col ${compact ? '' : 'hover:border-primary/30'}`}>
      {/* Route */}
      <div className="flex items-center gap-3 mb-4">
        {transport.provider_avatar && (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            <img src={transport.provider_avatar} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
            <span className="truncate">{transport.from_location}</span>
            <ArrowRight className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{transport.to_location}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {transport.provider_name && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/profile/user?email=${encodeURIComponent(transport.provider_email)}&type=host`); }}
                className="text-xs text-muted-foreground hover:underline hover:text-foreground transition-colors"
              >
                by {transport.provider_name}
              </button>
            )}
            {avgRating && (
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-semibold text-foreground">{avgRating}</span>
                <span className="text-xs text-muted-foreground">({reviews.length})</span>
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-foreground text-sm">{transport.round_trip_price} DKK</p>
          <p className="text-xs text-muted-foreground">tur/retur</p>
        </div>
      </div>



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

      {/* Return trip badge — takes up space even when absent to keep card height consistent */}
      <div className="mb-4 min-h-[2rem]">
        {returnTrip && (
          <div className="bg-accent/8 border border-accent/25 rounded-xl px-3 py-2 flex items-center gap-2">
            <ArrowLeft className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="text-xs font-medium text-accent">
              Hjemrejse tilgængelig: {returnTrip.to_location} → {returnTrip.from_location} · {format(new Date(returnTrip.departure_date), 'd. MMM')}
            </span>
          </div>
        )}
      </div>

      <div className="mt-auto">
        {!compact && (
          <Link to={`/transport/${transport.id}`}>
            <Button size="sm" variant="outline" className="w-full rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors">
              Se & Book
            </Button>
          </Link>
        )}
      </div>
    </div>
  );

  if (compact) return content;
  return content;
}