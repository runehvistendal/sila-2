import React, { useMemo, useState } from 'react';
import { Anchor, Home, Calendar, Users, MapPin, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

const REQUEST_STATUS = {
  pending: 'bg-amber-100 text-amber-700',
  quoted: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const REQUEST_LABELS = {
  pending: 'Afventer',
  quoted: 'Tilbud sendt',
  accepted: 'Accepteret',
  declined: 'Afvist',
  cancelled: 'Annulleret',
};

const BOOKING_STATUS = {
  pending: 'bg-amber-100 text-amber-700',
  on_hold: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  completed: 'bg-blue-100 text-blue-700',
};

const BOOKING_LABELS = {
  pending: 'Afventer',
  on_hold: 'På hold',
  confirmed: 'Bekræftet',
  declined: 'Afvist',
  cancelled: 'Annulleret',
  completed: 'Afsluttet',
};

export default function ProviderOverviewTab({ 
  cabinRequests = [], 
  transportRequests = [], 
  hostBookings = [],
  userEmail,
  t = () => ''
}) {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'transport', 'cabin'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Combine all items
  const allItems = useMemo(() => {
    const items = [
      ...cabinRequests.map(r => ({
        id: r.id,
        type: 'cabin-request',
        title: r.location,
        guestName: r.guest_name || r.guest_email,
        date: r.check_in,
        status: r.status,
        price: r.quoted_price_dkk,
        data: r,
      })),
      ...transportRequests.map(r => ({
        id: r.id,
        type: 'transport-request',
        title: `${r.from_location} → ${r.to_location}`,
        guestName: r.guest_name || r.guest_email,
        date: r.travel_date,
        status: r.status,
        price: r.quoted_price_dkk,
        data: r,
      })),
      ...hostBookings.map(b => ({
        id: b.id,
        type: 'booking',
        title: b.listing_title,
        guestName: b.guest_name || b.guest_email,
        date: b.check_in || b.created_date,
        status: b.status,
        price: b.total_price,
        data: b,
      })),
    ];

    // Filter
    let filtered = items;
    if (typeFilter !== 'all') {
      if (typeFilter === 'transport') {
        filtered = filtered.filter(i => i.type === 'transport-request');
      } else if (typeFilter === 'cabin') {
        filtered = filtered.filter(i => ['cabin-request', 'booking'].includes(i.type));
      }
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(i => i.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(i => 
        i.title.toLowerCase().includes(query) ||
        i.guestName.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [cabinRequests, transportRequests, hostBookings, typeFilter, statusFilter, searchQuery]);

  const stats = useMemo(() => ({
    pendingRequests: allItems.filter(i => ['cabin-request', 'transport-request'].includes(i.type) && i.status === 'pending').length,
    pendingBookings: allItems.filter(i => i.type === 'booking' && i.status === 'pending').length,
    total: allItems.length,
  }), [allItems]);

  const resetFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Afventende forespørgsler</p>
          <p className="text-2xl font-bold text-primary">{stats.pendingRequests}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Afventende bookinger</p>
          <p className="text-2xl font-bold text-primary">{stats.pendingBookings}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">I alt</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filtrer</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 rounded-lg text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle typer</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="cabin">Hytter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 rounded-lg text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statusser</SelectItem>
                <SelectItem value="pending">Afventer</SelectItem>
                <SelectItem value="quoted">Tilbud sendt</SelectItem>
                <SelectItem value="confirmed">Bekræftet</SelectItem>
                <SelectItem value="accepted">Accepteret</SelectItem>
                <SelectItem value="declined">Afvist</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Søg</label>
            <Input
              placeholder="Destination eller gæst..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-9 rounded-lg text-sm"
            />
          </div>
        </div>

        {(typeFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-xs gap-1"
          >
            <X className="w-3 h-3" /> Ryd filtre
          </Button>
        )}
      </div>

      {/* Results */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          {allItems.length} element{allItems.length !== 1 ? 'er' : ''}
        </p>

        {allItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground text-sm">Ingen elementer matcher dine filtre</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allItems.map(item => (
              <ItemCard
                key={`${item.type}-${item.id}`}
                item={item}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ItemCard({ item, navigate }) {
  const isRequest = ['cabin-request', 'transport-request'].includes(item.type);
  const isBooking = item.type === 'booking';
  const statusColor = isBooking ? BOOKING_STATUS[item.status] : REQUEST_STATUS[item.status];
  const statusLabel = isBooking ? BOOKING_LABELS[item.status] : REQUEST_LABELS[item.status];

  const handleClick = () => {
    if (item.type === 'transport-request') {
      navigate(`/request-transport/${item.id}`);
    } else if (item.type === 'cabin-request') {
      navigate(`/request-cabin/${item.id}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left bg-white rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            item.type === 'transport-request' ? 'bg-accent/10' : 'bg-primary/10'
          }`}>
            {item.type === 'transport-request' ? (
              <Anchor className="w-4 h-4 text-accent" />
            ) : (
              <Home className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{item.title}</p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
              <span>{item.guestName}</span>
              <span>•</span>
              <span>{format(new Date(item.date), 'd. MMM yyyy')}</span>
              {item.price && <span className="text-primary font-medium">• {item.price} DKK</span>}
            </div>
          </div>
        </div>
        <Badge className={`${statusColor} border-0 text-xs shrink-0`}>
          {statusLabel}
        </Badge>
      </div>
    </button>
  );
}