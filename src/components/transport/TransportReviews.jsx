import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { useLanguage } from '@/lib/LanguageContext';

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)} onClick={() => onChange(n)} className="transition-transform hover:scale-110">
          <Star className={`w-7 h-7 transition-colors ${n <= (hovered || value) ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
        </button>
      ))}
    </div>
  );
}

function StarBar({ stars }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-4 h-4 ${n <= Math.round(stars) ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
      ))}
    </div>
  );
}

export default function TransportReviews({ transportId, providerEmail, providerName }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: reviews = [] } = useQuery({
    queryKey: ['transport-reviews', transportId],
    queryFn: () => base44.entities.Review.filter({ listing_id: transportId, listing_type: 'transport' }, '-created_date', 50),
  });

  const submitMutation = useMutation({
    mutationFn: () => base44.entities.Review.create({
      listing_type: 'transport',
      listing_id: transportId,
      reviewer_name: user.full_name || user.email.split('@')[0],
      reviewer_email: user.email,
      rating: stars,
      comment: comment.trim(),
      provider_email: providerEmail,
    }),
    onSuccess: () => {
      qc.invalidateQueries(['transport-reviews', transportId]);
      setStars(0); setComment(''); setShowForm(false);
      toast({ title: t('review_sent'), description: t('review_sent_desc') });
    },
  });

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
  const alreadyReviewed = reviews.some(r => r.reviewer_email === user?.email);

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            {t('reviews').charAt(0).toUpperCase() + t('reviews').slice(1)} {avgRating && <span className="text-base">{avgRating}</span>}
          </h2>
          {avgRating && (
            <div className="flex gap-0.5 mt-1">
              {[1,2,3,4,5].map(n => <Star key={n} className={`w-4 h-4 ${n <= Math.round(Number(avgRating)) ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />)}
              <span className="text-xs text-muted-foreground ml-1">({reviews.length})</span>
            </div>
          )}
        </div>
        {user && !alreadyReviewed && !showForm && (
          <Button variant="outline" onClick={() => setShowForm(true)} className="rounded-xl text-sm gap-1">
            <Star className="w-3.5 h-3.5" /> {t('write_review')}
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-muted/50 rounded-2xl p-5 mb-5 border border-border space-y-4">
          <StarPicker value={stars} onChange={setStars} />
          <Textarea placeholder={t('share_experience_transport')} value={comment} onChange={e => setComment(e.target.value)} className="h-24 resize-none text-sm rounded-xl" />
          <div className="flex gap-2">
            <Button onClick={() => submitMutation.mutate()} disabled={stars === 0 || submitMutation.isPending} className="bg-primary text-white rounded-xl text-sm">
              {submitMutation.isPending ? t('sending_dots') : t('send_review')}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} className="text-sm rounded-xl">{t('cancel')}</Button>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6 bg-muted rounded-xl">
          {t('no_reviews_yet')}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{r.reviewer_name || t('anonymous')}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(r.created_date), 'MMM d, yyyy')}</p>
                  </div>
                  <StarBar stars={r.rating} />
                  {r.comment && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{r.comment}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}