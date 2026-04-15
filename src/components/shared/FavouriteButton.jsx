import React from 'react';
import { Heart } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function FavouriteButton({ listingType, listingId, listingTitle, listingImage, listingLocation, listingPrice, className = '' }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: favs = [] } = useQuery({
    queryKey: ['favourites', user?.email],
    queryFn: () => base44.entities.Favourite.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const existing = favs.find(f => f.listing_id === listingId);

  const add = useMutation({
    mutationFn: () => base44.entities.Favourite.create({ user_email: user.email, listing_type: listingType, listing_id: listingId, listing_title: listingTitle, listing_image: listingImage, listing_location: listingLocation, listing_price: listingPrice }),
    onSuccess: () => qc.invalidateQueries(['favourites', user?.email]),
  });

  const remove = useMutation({
    mutationFn: () => base44.entities.Favourite.delete(existing.id),
    onSuccess: () => qc.invalidateQueries(['favourites', user?.email]),
  });

  if (!user) return null;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (existing) remove.mutate();
    else add.mutate();
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform ${className}`}
      title={existing ? 'Fjern fra favoritter' : 'Tilføj til favoritter'}
    >
      <Heart className={`w-4 h-4 ${existing ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
    </button>
  );
}