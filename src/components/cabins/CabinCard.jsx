import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Users, Anchor } from 'lucide-react';

export default function CabinCard({ cabin }) {
  const coverImage = cabin.images?.[0] || 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=600&h=400&fit=crop&q=80';

  return (
    <Link to={`/cabins/${cabin.id}`} className="group block">
      {/* Image */}
      <div className="relative overflow-hidden rounded-2xl aspect-[4/3] mb-3 bg-muted">
        <img
          src={coverImage}
          alt={cabin.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {cabin.host_provides_transport && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-white text-primary border-0 shadow-sm text-xs font-semibold gap-1">
              <Anchor className="w-3 h-3" /> Transport included
            </Badge>
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
        <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
          <MapPin className="w-3 h-3" />
          <span>{cabin.location}</span>
        </div>
        {cabin.max_guests && (
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <Users className="w-3 h-3" />
            <span>Up to {cabin.max_guests} guests</span>
          </div>
        )}
      </div>
    </Link>
  );
}