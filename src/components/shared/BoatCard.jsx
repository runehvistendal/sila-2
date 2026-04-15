import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Calendar, Clock, Users, Anchor } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function BoatCard({ boat, index = 0 }) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link to={`/boat/${boat.id}`} className="group block">
        <div className="bg-card rounded-2xl border border-border p-5 hover:border-accent/40 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Anchor className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="truncate">{boat.from_location}</span>
                <ArrowRight className="w-4 h-4 text-accent shrink-0" />
                <span className="truncate">{boat.to_location}</span>
              </div>
              {boat.provider_name && (
                <p className="text-xs text-muted-foreground mt-0.5">by {boat.provider_name}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-muted-foreground">
            {boat.departure_date && (
              <span className="flex items-center gap-1 bg-muted px-2.5 py-1 rounded-full">
                <Calendar className="w-3 h-3" />
                {format(new Date(boat.departure_date), 'MMM d, yyyy')}
              </span>
            )}
            {boat.departure_time && (
              <span className="flex items-center gap-1 bg-muted px-2.5 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                {boat.departure_time}
              </span>
            )}
            {boat.available_seats > 0 && (
              <span className="flex items-center gap-1 bg-accent/10 text-accent px-2.5 py-1 rounded-full">
                <Users className="w-3 h-3" />
                {boat.available_seats} {t('available_seats')}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {boat.price_per_seat_dkk} {t('dkk')} <span className="font-normal text-muted-foreground text-xs">{t('per_seat')}</span>
            </p>
            {boat.boat_type && (
              <Badge variant="secondary" className="text-xs">{boat.boat_type}</Badge>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}