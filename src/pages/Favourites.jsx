import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Link } from 'react-router-dom';
import { Heart, Home, Anchor, MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Favourites() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();

  const { data: favs = [], isLoading } = useQuery({
    queryKey: ['favourites', user?.email],
    queryFn: () => base44.entities.Favourite.filter({ user_email: user.email }, '-created_date', 50),
    enabled: !!user,
  });

  const remove = useMutation({
    mutationFn: (id) => base44.entities.Favourite.delete(id),
    onSuccess: () => qc.invalidateQueries(['favourites', user?.email]),
  });

  if (!user) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4">
      <Heart className="w-12 h-12 text-muted-foreground/30" />
      <p className="text-muted-foreground">{t('login_to_see_profile')}</p>
      <Button onClick={() => base44.auth.redirectToLogin()}>{t('login_btn')}</Button>
    </div>
  );

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Heart className="w-7 h-7 fill-red-500 text-red-500" /> {t('nav_favourites')}
            </h1>
            <p className="text-muted-foreground mt-1">{favs.length} {t('saved')}</p>
          </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : favs.length === 0 ? (
          <div className="text-center py-24">
            <Heart className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">{t('no_favourites')}</p>
            <p className="text-muted-foreground text-sm mb-6">{t('save_on_heart')}</p>
            <Button variant="outline" onClick={() => window.location.href = '/cabins'} className="rounded-xl">{t('explore_cabins')}</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favs.map((fav) => {
              const href = fav.listing_type === 'cabin' ? `/cabins/${fav.listing_id}` : `/transport/${fav.listing_id}`;
              return (
                <div key={fav.id} className="group relative bg-white rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-card-hover transition-shadow">
                  <Link to={href}>
                    <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                      {fav.listing_image ? (
                        <img src={fav.listing_image} alt={fav.listing_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {fav.listing_type === 'cabin' ? <Home className="w-10 h-10 text-muted-foreground/30" /> : <Anchor className="w-10 h-10 text-muted-foreground/30" />}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-foreground truncate">{fav.listing_title}</p>
                      {fav.listing_location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{fav.listing_location}</p>
                      )}
                      {fav.listing_price && (
                        <p className="text-sm font-semibold text-primary mt-2">{fav.listing_price} DKK</p>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={() => remove.mutate(fav.id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-sm hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}