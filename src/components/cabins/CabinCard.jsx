import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Anchor } from 'lucide-react';
import FavouriteButton from '@/components/shared/FavouriteButton';

export default function CabinCard({ cabin }) {
  const [imageError, setImageError] = useState(false);
  const coverImage = cabin.images?.[0] || 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=600&h=400&fit=crop&q=80';
  const fallbackImage = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&q=80';

  return (
    <Link to={`/cabins/${cabin.id}`} className="group block">
       {/* Image */}
       <div className="relative overflow-hidden rounded-2xl aspect-[4/3] mb-3 bg-gradient-to-br from-primary/30 to-accent/30">
         <img
           src={imageError ? fallbackImage : coverImage}
           alt={cabin.title}
           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
           onError={() => setImageError(true)}
         />
        <div className="absolute top-3 right-3" onClick={e => e.preventDefault()}>
          <FavouriteButton
            listingType="cabin"
            listingId={cabin.id}
            listingTitle={cabin.title}
            listingImage={coverImage}
            listingLocation={cabin.location}
            listingPrice={cabin.price_per_night}
          />
        </div>
        {cabin.host_provides_transport && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 bg-white text-primary shadow-sm text-xs font-semibold px-2.5 py-0.5 rounded-md">
              <Anchor className="w-3 h-3" /> Transport included
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
            {cabin.price_per_night} <span className="font-normal text-muted-foreground text-xs">DKK/night</span>
          </span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
          <MapPin className="w-3 h-3" />
          <span>{cabin.location}</span>
        </div>
        {cabin.max_guests && (
          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
            <Users className="w-3 h-3" />
            <span>Up to {cabin.max_guests} guests</span>
          </div>
        )}
        {cabin.host_name && (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {cabin.host_avatar ? (
                <img src={cabin.host_avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-muted-foreground">{cabin.host_name.charAt(0)}</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{cabin.host_name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}