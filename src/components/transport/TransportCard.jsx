import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Clock, Users, Anchor } from 'lucide-react';
import { format } from 'date-fns';

export default function TransportCard({ transport, compact = false }) {
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
          <p className="font-bold text-foreground text-sm">{transport.price_per_seat} DKK</p>
          <p className="text-xs text-muted-foreground">per seat</p>
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