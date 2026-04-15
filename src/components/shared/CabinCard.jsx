import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Users, Bed } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CabinCard({ cabin, index = 0 }) {
  const { t, lang } = useLanguage();
  const title = (lang === 'da' && cabin.title_da) || (lang === 'kl' && cabin.title_kl) || cabin.title;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link to={`/cabin/${cabin.id}`} className="group block">
        <div className="relative overflow-hidden rounded-2xl aspect-[4/3] mb-3">
          <img
            src={cabin.cover_image || 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=600&h=450&fit=crop'}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          {cabin.is_remote && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-white/90 text-foreground backdrop-blur-sm border-0 text-xs">
                🏔️ Remote
              </Badge>
            </div>
          )}
          <div className="absolute bottom-3 left-3 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-white/90" />
            <span className="text-white/90 text-xs font-medium">{cabin.location}</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <h3 className="font-medium text-foreground group-hover:text-accent transition-colors line-clamp-1">
            {title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {cabin.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {cabin.rating?.toFixed(1)}
              </span>
            )}
            {cabin.bedrooms && (
              <span className="flex items-center gap-1">
                <Bed className="w-3.5 h-3.5" />
                {cabin.bedrooms}
              </span>
            )}
            {cabin.max_guests && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {cabin.max_guests} {t('guests')}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-foreground">
            {t('from')} {cabin.price_per_night_dkk} {t('dkk')} <span className="font-normal text-muted-foreground text-xs">{t('per_night')}</span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}