import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, MapPin, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ExperienceCard({ experience, index = 0 }) {
  const { t, lang } = useLanguage();
  
  const title = (lang === 'da' && experience.title_da) || (lang === 'kl' && experience.title_kl) || experience.title;

  const categoryIcons = {
    boat_tour: '🚤',
    dog_sledding: '🐕',
    kayaking: '🛶',
    northern_lights: '🌌',
    hiking: '🥾',
    fishing: '🎣',
    cultural: '🏛️',
    wildlife: '🦌',
    ice_cap: '🏔️',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link to={`/experience/${experience.id}`} className="group block">
        <div className="relative overflow-hidden rounded-2xl aspect-[4/3] mb-3">
          <img
            src={experience.cover_image || 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&h=450&fit=crop'}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute top-3 left-3">
            <Badge className="bg-white/90 text-foreground backdrop-blur-sm border-0 text-xs font-medium">
              {categoryIcons[experience.category]} {t(experience.category)}
            </Badge>
          </div>
          {experience.is_featured && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-accent text-accent-foreground border-0 text-xs">
                ✦ Featured
              </Badge>
            </div>
          )}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-white/90" />
              <span className="text-white/90 text-xs font-medium">{experience.location}</span>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <h3 className="font-medium text-foreground group-hover:text-accent transition-colors line-clamp-1">
            {title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {experience.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {experience.rating?.toFixed(1)}
                <span className="text-muted-foreground/60">({experience.review_count || 0})</span>
              </span>
            )}
            {experience.duration_hours && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {experience.duration_hours} {t('hours')}
              </span>
            )}
            {experience.max_guests && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {experience.max_guests}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-foreground">
            {t('from')} {experience.price_dkk} {t('dkk')} <span className="font-normal text-muted-foreground text-xs">{t('per_person')}</span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
}