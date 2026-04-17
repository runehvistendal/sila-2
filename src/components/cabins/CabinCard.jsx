import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Users, Anchor, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCurrency } from '@/lib/CurrencyContext';
import { useLanguage } from '@/lib/LanguageContext';
import FavouriteButton from '@/components/shared/FavouriteButton';
import ProviderBadge from '@/components/shared/ProviderBadge';

export default function CabinCard({ cabin }) {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageScrollRef = useRef(null);
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const navigate = useNavigate();
  // Filter to only show relevant interior/exterior cabin images
  const cabinImages = cabin.images && cabin.images.length > 0 
    ? cabin.images.filter(img => {
        const url = img.toLowerCase();
        return !url.includes('boat') && !url.includes('person') && !url.includes('diver') && !url.includes('fish');
      })
    : [];
  
  const images = cabinImages.length > 0 ? cabinImages : (cabin.images && cabin.images.length > 0 ? cabin.images : ['https://images.unsplash.com/photo-1570129477492-45a003cf17b7?w=600&h=400&fit=crop&q=80']);
  const fallbackImage = 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe3e?w=600&h=400&fit=crop&q=80';
  const imageUrl = imageError ? fallbackImage : images[currentImageIndex];
  
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

  const { data: reviews = [] } = useQuery({
    queryKey: ['cabin-card-reviews', cabin.id],
    queryFn: () => base44.entities.Review.filter({ listing_id: cabin.id, listing_type: 'cabin' }, null, 50),
    enabled: !!cabin.id,
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <Link to={`/cabins/${cabin.id}`} className="group block">
       {/* Image */}
       <div className="relative overflow-hidden rounded-2xl aspect-[4/3] mb-3 bg-gradient-to-br from-primary/30 to-accent/30">
         {imageUrl && (
           <img
             src={imageUrl}
             alt={cabin.title}
             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
             onError={() => setImageError(true)}
           />
         )}
        {images.length > 1 && (
          <>
            <button onClick={handlePrevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors z-10">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={handleNextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors z-10">
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {images.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`} />
              ))}
            </div>
          </>
        )}
        <div className="absolute top-3 right-3" onClick={e => e.preventDefault()}>
          <FavouriteButton
            listingType="cabin"
            listingId={cabin.id}
            listingTitle={cabin.title}
            listingImage={images[0]}
            listingLocation={cabin.location}
            listingPrice={cabin.price_per_night}
          />
        </div>
        {cabin.host_provides_transport && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 bg-white text-primary shadow-sm text-xs font-semibold px-2.5 py-0.5 rounded-md">
              <Anchor className="w-3 h-3" /> {t('transport_offered')}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors line-clamp-1">
            {cabin.title}
          </h3>
          <span className="text-sm font-semibold text-foreground whitespace-nowrap">
            {formatPrice(cabin.price_per_night)} <span className="font-normal text-muted-foreground text-xs">{t('per_night_abbr')}</span>
          </span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1.5">
          <MapPin className="w-3 h-3" />
          <span>{cabin.location}</span>
        </div>
        {avgRating && (
          <div className="flex items-center gap-1 mb-1.5">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-foreground">{avgRating}</span>
            <span className="text-xs text-muted-foreground">({reviews.length})</span>
          </div>
        )}
        {cabin.host_name && (
          <button
            onClick={(e) => { e.preventDefault(); navigate(`/profile/user?email=${encodeURIComponent(cabin.host_email)}&type=host`); }}
            className="flex items-center gap-1.5 hover:opacity-75 transition-opacity mt-1"
          >
            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {cabin.host_avatar ? (
                <img src={cabin.host_avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-muted-foreground">{cabin.host_name.charAt(0)}</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground underline-offset-2 hover:underline">{cabin.host_name}</span>
            <ProviderBadge providerEmail={cabin.host_email} />
          </button>
        )}
      </div>
    </Link>
  );
}