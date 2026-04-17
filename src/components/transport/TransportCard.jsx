import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Calendar, Clock, Users, Anchor, Home, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/lib/LanguageContext';
import ProviderBadge from '@/components/shared/ProviderBadge';

export default function TransportCard({ transport, returnTrip = null, compact = false, showImages = true }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: reviews = [] } = useQuery({
    queryKey: ['transport-card-reviews', transport.id],
    queryFn: () => base44.entities.Review.filter({ listing_id: transport.id }, null, 50),
    enabled: !!transport.id,
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  // Filter to only show boat images (exclude non-boat related images)
  const boatImages = transport.images && transport.images.length > 0 
    ? transport.images.filter(img => {
        const url = img.toLowerCase();
        // Exclude common non-boat image keywords
        return !url.includes('diver') && !url.includes('car') && !url.includes('vehicle') && !url.includes('person') && !url.includes('fish');
      })
    : [];
  
  // If filtered list is empty, use original images
  const images = boatImages.length > 0 ? boatImages : (transport.images || []);
  const fallbackBoatImage = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&h=150&fit=crop&q=80';
  const imageUrl = imageError || images.length === 0 ? fallbackBoatImage : images[currentImageIndex];
  
  const handlePrevImage = (e) => {
    e.preventDefault();
    setCurrentImageIndex((i) => (i === 0 ? images.length - 1 : i - 1));
    setImageError(false);
  };
  
  const handleNextImage = (e) => {
    e.preventDefault();
    setCurrentImageIndex((i) => (i === images.length - 1 ? 0 : i + 1));
    setImageError(false);
  };

  const content = (
    <div className={`bg-white rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-shadow p-5 flex flex-col h-full ${compact ? '' : 'hover:border-primary/30'}`}>
      {/* Boat Image */}
      {images.length > 0 && showImages && (
        <div className="relative overflow-hidden rounded-lg aspect-video mb-4 bg-muted">
          <img
            src={imageUrl}
            alt={transport.boat_type || 'boat'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          {images.length > 1 && (
            <>
              <button onClick={handlePrevImage} className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-0.5 rounded-full transition-colors z-10">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleNextImage} className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-0.5 rounded-full transition-colors z-10">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {images.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all ${i === currentImageIndex ? 'bg-white w-3' : 'bg-white/50 w-1'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
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
                {t('by_provider')} {transport.provider_name}
              </button>
            )}
            <ProviderBadge providerEmail={transport.provider_email} />
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
          <p className="text-xs text-muted-foreground">{t('round_trip_label')}</p>
        </div>
      </div>



      {/* Details row */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
          <Calendar className="w-3 h-3" />
          {format(new Date(transport.departure_date), 'MMM d')}
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
          {transport.seats_available} {t('seats_left')}
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
          {transport.has_cabin ? t('with_cabin') : t('without_cabin')}
        </span>
      </div>

      {/* Return trip badge — from own listing or linked listing */}
      <div className="mb-4 h-[3.5rem] flex items-start">
        {transport.return_date ? (
          <div className="bg-accent/8 border border-accent/25 rounded-xl px-3 py-2 flex items-center gap-2 w-full">
            <ArrowLeft className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="text-xs font-medium text-accent line-clamp-2">
              {t('return_trip')}: {transport.to_location} → {transport.from_location} · {format(new Date(transport.return_date), 'd. MMM')}
              {transport.return_time && ` kl. ${transport.return_time}`}
              {transport.return_seats && ` · ${transport.return_seats} ${t('seats_plural')}`}
            </span>
          </div>
        ) : returnTrip ? (
          <div className="bg-accent/8 border border-accent/25 rounded-xl px-3 py-2 flex items-center gap-2 w-full">
            <ArrowLeft className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="text-xs font-medium text-accent line-clamp-2">
              {t('return_trip_available')}: {returnTrip.to_location} → {returnTrip.from_location} · {format(new Date(returnTrip.departure_date), 'd. MMM')}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-auto">
        {!compact && (
          <Link to={`/transport/${transport.id}`}>
            <Button size="sm" variant="outline" className="w-full rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors">
              {t('see_and_book')}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );

  if (compact) return content;
  return content;
}