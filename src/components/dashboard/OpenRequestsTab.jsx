import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Anchor, MapPin, Calendar, Users, X, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { GREENLAND_LOCATIONS } from '@/lib/greenlandLocations';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function OpenRequestsTab() {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Filters & sorting state
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [locationFilter, setLocationFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Fetch all requests
  const { data: cabinRequests = [] } = useQuery({
    queryKey: ['all-cabin-requests-open'],
    queryFn: () => base44.entities.CabinRequest.filter({}, '-created_date', 200),
    enabled: !!user,
  });

  const { data: transportRequests = [] } = useQuery({
    queryKey: ['all-transport-requests-open'],
    queryFn: () => base44.entities.TransportRequest.filter({}, '-created_date', 200),
    enabled: !!user,
  });

  // Fetch all locations for coordinates
  const { data: locations = [] } = useQuery({
    queryKey: ['locations-list'],
    queryFn: async () => {
      const locs = await base44.entities.Location.list('-name_dk', 1000);
      return locs;
    },
    enabled: !!user,
  });

  // Get user's location coordinates from user profile
  const userCoords = useMemo(() => {
    if (!user?.location || !locations.length) return null;
    
    // Find location by exact name match (case-insensitive)
    const userLoc = locations.find(l => 
      l.name_dk?.toLowerCase().trim() === user.location.toLowerCase().trim() ||
      l.name_gl?.toLowerCase().trim() === user.location.toLowerCase().trim() ||
      (l.postal_code && l.postal_code.trim() === user.location.trim())
    );
    
    if (userLoc) {
      console.log('✓ User location matched:', userLoc.name_dk, userLoc.id);
    } else {
      console.log('✗ No match for user location:', user.location);
    }
    
    return userLoc ? { lat: userLoc.latitude, lon: userLoc.longitude, id: userLoc.id, name: userLoc.name_dk } : null;
  }, [user?.location, locations]);

  // Combine and process all requests
  const allRequests = useMemo(() => {
    const combined = [
      ...cabinRequests.map(r => ({
        ...r,
        type: 'cabin',
        location: r.location,
        date: r.check_in || r.created_date,
      })),
      ...transportRequests.map(r => ({
        ...r,
        type: 'transport',
        location: r.from_location,
        date: r.travel_date || r.created_date,
      })),
    ];

    // Filter
    let filtered = combined.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (locationFilter && r.location !== locationFilter) return false;
      
      const rDate = new Date(r.date);
      if (dateFrom && rDate < new Date(dateFrom)) return false;
      if (dateTo && rDate > new Date(dateTo)) return false;
      
      return true;
    });

    // Calculate relevance score
    filtered = filtered.map(r => {
      let relevanceScore = 0;

      if (userCoords && r.location && locations.length) {
        const requestLoc = locations.find(l => 
          l.name_dk?.toLowerCase().trim() === r.location?.toLowerCase().trim() || 
          l.name_gl?.toLowerCase().trim() === r.location?.toLowerCase().trim() || 
          (l.postal_code && l.postal_code.trim() === r.location?.trim())
        );
        
        if (requestLoc) {
          if (requestLoc.id === userCoords.id) {
            // Same location = absolute top priority
            relevanceScore = 1000000;
            if (r.type === 'cabin') console.log('🏠 Same-city match:', r.location, '→ Score:', relevanceScore);
            if (r.type === 'transport') console.log('⛵ Same-city match:', r.location, '→ Score:', relevanceScore);
          } else {
            // Different location = score by distance
            const dist = calculateDistance(
              userCoords.lat,
              userCoords.lon,
              requestLoc.latitude,
              requestLoc.longitude
            );
            // Max 10000 for very close locations, decreases with distance
            relevanceScore = Math.max(0, 10000 - dist * 20);
          }
        } else {
          // Location not found in database
          relevanceScore = 0;
        }
      }

      // Bonus for pending (much lower than location score)
      if (r.status === 'pending') relevanceScore += 10;

      return { ...r, relevanceScore };
    });

    // Sort
    if (sortBy === 'relevance') {
      filtered.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    } else if (sortBy === 'date-newest') {
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === 'date-oldest') {
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    return filtered;
  }, [cabinRequests, transportRequests, statusFilter, typeFilter, locationFilter, dateFrom, dateTo, sortBy, userCoords, locations]);

  // Build unique locations from requests, matched against Location entity
  const uniqueLocations = useMemo(() => {
    const locSet = new Set(
      [...cabinRequests.map(r => r.location), ...transportRequests.map(r => r.from_location)].filter(Boolean)
    );
    return Array.from(locSet).sort();
  }, [cabinRequests, transportRequests]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 space-y-4">
        <h3 className="font-semibold text-foreground text-sm">Avanceret filtrering</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Status filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 rounded-lg text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="pending">Afventer</SelectItem>
                <SelectItem value="quoted">Tilbud givet</SelectItem>
                <SelectItem value="confirmed">Bekræftet</SelectItem>
                <SelectItem value="declined">Afvist</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 rounded-lg text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle typer</SelectItem>
                <SelectItem value="cabin">Hytte</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">By/postnummer</label>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="h-9 rounded-lg text-sm">
                <SelectValue placeholder="Alle steder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Alle steder</SelectItem>
                {uniqueLocations.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sortering</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 rounded-lg text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Mest relevant</SelectItem>
                <SelectItem value="date-newest">Nyeste først</SelectItem>
                <SelectItem value="date-oldest">Ældste først</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Fra dato</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="h-9 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Til dato</label>
            <Input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="h-9 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Clear filters */}
        {(statusFilter !== 'all' || typeFilter !== 'all' || locationFilter || dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter('all');
              setTypeFilter('all');
              setLocationFilter('');
              setDateFrom('');
              setDateTo('');
            }}
            className="text-xs gap-1"
          >
            <X className="w-3 h-3" /> Ryd filtre
          </Button>
        )}
      </div>

      {/* Results */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          {allRequests.length} anmodning{allRequests.length !== 1 ? 'er' : ''} fundet
        </p>

        {allRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground text-sm">Ingen anmodninger matcher dine filtre</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allRequests.map(r => (
              <RequestCard key={`${r.type}-${r.id}`} request={r} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({ request, t }) {
  const [showModal, setShowModal] = React.useState(false);
  const navigate = useNavigate();
  const isTransport = request.type === 'transport';
  const statusLabel = {
    pending: 'Afventer',
    quoted: 'Tilbud givet',
    confirmed: 'Bekræftet',
    declined: 'Afvist',
    cancelled: 'Annulleret',
  }[request.status] || request.status;

  const statusColor = {
    pending: 'bg-amber-100 text-amber-700',
    quoted: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  }[request.status] || 'bg-gray-100 text-gray-500';

  return (
    <>
    <button
      onClick={() => setShowModal(true)}
      className="w-full text-left bg-white rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isTransport ? 'bg-accent/10' : 'bg-primary/10'}`}>
            {isTransport ? <Anchor className="w-4 h-4 text-accent" /> : <Home className="w-4 h-4 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isTransport ? (
                <>
                  <p className="font-semibold text-sm text-foreground">{request.from_location} → {request.to_location}</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-sm text-foreground">{request.location}</p>
                </>
              )}
              <Badge className={`${statusColor} border-0 text-xs`}>{statusLabel}</Badge>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {request.guest_name || request.guest_email.split('@')[0]}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(request.date), 'd. MMM yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {isTransport ? `${request.passengers} passagerer` : `${request.guests} gæster`}
              </span>
            </div>

            {request.message && (
              <p className="text-xs text-muted-foreground mt-2 italic">"{request.message}"</p>
            )}
          </div>
        </div>
      </div>
    </button>
    {showModal && (
      <RequestDetailModal request={request} isTransport={isTransport} t={t} onClose={() => setShowModal(false)} />
    )}
    </>
  );
}

function RequestDetailModal({ request, isTransport, t, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 sm:mx-0 p-6 sm:p-8 shadow-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">{t('request_details')}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">{t('name')}</p>
            <p className="text-sm font-semibold text-foreground mt-1">{request.guest_name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">{t('email')}</p>
            <p className="text-sm text-foreground mt-1">{request.guest_email}</p>
          </div>

          {isTransport ? (
            <>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">{t('route')}</p>
                <p className="text-sm text-foreground mt-1">{request.from_location} → {request.to_location}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">{t('date')}</p>
                <p className="text-sm text-foreground mt-1">{format(new Date(request.travel_date), 'd. MMM yyyy')}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">{t('passengers')}</p>
                <p className="text-sm text-foreground mt-1">{request.passengers}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">{t('location')}</p>
                <p className="text-sm text-foreground mt-1">{request.location}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">{t('dates')}</p>
                <p className="text-sm text-foreground mt-1">{format(new Date(request.check_in), 'd. MMM')} – {format(new Date(request.check_out), 'd. MMM yyyy')}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">{t('guests')}</p>
                <p className="text-sm text-foreground mt-1">{request.guests}</p>
              </div>
            </>
          )}

          {request.message && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">{t('message')}</p>
              <p className="text-sm text-foreground mt-1 italic">"{request.message}"</p>
            </div>
          )}
        </div>

        <Button
          onClick={() => window.location.href = `mailto:${request.guest_email}`}
          className="w-full bg-primary text-white hover:bg-primary/90 rounded-xl h-10 font-semibold gap-2 mb-3"
        >
          <MessageSquare className="w-4 h-4" />
          {t('contact_requester')}
        </Button>
        <Button
          variant="outline"
          onClick={onClose}
          className="w-full rounded-xl h-10"
        >
          {t('close')}
        </Button>
      </div>
    </div>
  );
}