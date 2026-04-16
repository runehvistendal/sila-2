import React, { useMemo, useState } from 'react';
import { Calendar, Home, Anchor, Users, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import BookingReviewButton from '@/components/bookings/BookingReviewButton';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  on_hold: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  completed: 'bg-blue-100 text-blue-700',
};

const STATUS_LABELS = {
  pending: 'Afventer',
  on_hold: 'På hold',
  confirmed: 'Bekræftet',
  declined: 'Afvist',
  cancelled: 'Annulleret',
  completed: 'Afsluttet',
};

export default function GuestBookingsTab({ bookings, t }) {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState(null);

  const { upcoming, completed, declined } = useMemo(() => {
    const now = new Date();
    return {
      upcoming: bookings.filter(b => 
        ['pending', 'on_hold', 'confirmed'].includes(b.status) &&
        new Date(b.check_in || b.created_date) > now
      ).sort((a, b) => new Date(a.check_in || a.created_date) - new Date(b.check_in || b.created_date)),
      completed: bookings.filter(b => 
        b.status === 'completed' || (b.status === 'confirmed' && new Date(b.check_in || b.created_date) <= now)
      ).sort((a, b) => new Date(b.check_in || b.created_date) - new Date(a.check_in || a.created_date)),
      declined: bookings.filter(b => 
        ['declined', 'cancelled'].includes(b.status)
      ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)),
    };
  }, [bookings]);

  const renderBookingList = (list, emptyMessage) => {
    if (list.length === 0) {
      return <p className="text-sm text-muted-foreground bg-muted rounded-xl p-4 text-center">{emptyMessage}</p>;
    }
    return (
      <div className="space-y-3">
        {list.map(b => (
          <BookingCard
            key={b.id}
            booking={b}
            isExpanded={expandedId === b.id}
            onToggle={() => setExpandedId(expandedId === b.id ? null : b.id)}
            t={t}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Kommende */}
      <div>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Kommende bookinger ({upcoming.length})
        </h3>
        {renderBookingList(upcoming, 'Ingen kommende bookinger')}
      </div>

      {/* Historik */}
      <div>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Afsluttede bookinger ({completed.length})
        </h3>
        {renderBookingList(completed, 'Ingen afsluttede bookinger')}
      </div>

      {/* Afviste */}
      {declined.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Afviste/Annullerede ({declined.length})
          </h3>
          {renderBookingList(declined, 'Ingen afviste bookinger')}
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking, isExpanded, onToggle, t = () => '' }) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <button
        className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${booking.type === 'cabin' ? 'bg-primary/10' : 'bg-accent/10'}`}>
            {booking.type === 'cabin' ? <Home className="w-4 h-4 text-primary" /> : <Anchor className="w-4 h-4 text-accent" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{booking.listing_title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Booket {format(new Date(booking.created_date), 'd. MMM yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={`${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-500'} border-0 text-xs`}>
            {STATUS_LABELS[booking.status] || booking.status}
          </Badge>
          {booking.total_price > 0 && <span className="text-sm font-bold text-foreground">{booking.total_price} DKK</span>}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 sm:px-5 pb-5 border-t border-border pt-4 space-y-3">
          {booking.check_in && (
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(booking.check_in), 'd. MMM')}
                {booking.check_out && ` – ${format(new Date(booking.check_out), 'd. MMM yyyy')}`}
              </span>
              {booking.guests && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{booking.guests} gæster</span>}
              {booking.seats && <span className="flex items-center gap-1"><Anchor className="w-3.5 h-3.5" />{booking.seats} pladser</span>}
            </div>
          )}

          {booking.message && (
            <p className="text-xs text-muted-foreground bg-muted rounded-lg p-2.5 italic">"{booking.message}"</p>
          )}

          {booking.status === 'completed' && <BookingReviewButton booking={booking} />}
        </div>
      )}
    </div>
  );
}