import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { useReviewTranslation } from '@/hooks/useReviewTranslation';

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110"
        >
          <Star className={`w-7 h-7 transition-colors ${n <= (hovered || value) ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
        </button>
      ))}
    </div>
  );
}

function StarBar({ stars, count }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-4 h-4 ${n <= Math.round(stars) ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
      ))}
      {count !== undefined && <span className="text-xs text-muted-foreground ml-1">({count})</span>}
    </div>
  );
}

function ReviewItem({ review }) {
  const { translatedText, isTranslating } = useReviewTranslation(review.comment || '', 'da');

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{review.reviewer_name || 'Anonym'}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(review.created_date), 'MMM d, yyyy')}</p>
          </div>
          <StarBar stars={review.rating} />
          {review.comment && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                {isTranslating && <Loader2 className="w-3 h-3 mt-1 animate-spin flex-shrink-0" />}
                <span>{translatedText}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RatingItem({ rating }) {
  const { translatedText, isTranslating } = useReviewTranslation(rating.comment || '', 'da');

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-accent" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{rating.from_email?.split('@')[0]}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(rating.created_date), 'MMM d, yyyy')}</p>
          </div>
          <StarBar stars={rating.stars} />
          {rating.comment && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                {isTranslating && <Loader2 className="w-3 h-3 mt-1 animate-spin flex-shrink-0" />}
                <span>{translatedText}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CabinReviews({ cabinId, hostEmail, hostName, currentUserEmail }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: reviews = [] } = useQuery({
    queryKey: ['cabin-reviews', cabinId],
    queryFn: () => base44.entities.Review.filter({ listing_id: cabinId, listing_type: 'cabin' }, '-created_date', 50),
  });

  const { data: hostRatings = [] } = useQuery({
    queryKey: ['host-ratings', hostEmail],
    queryFn: () => base44.entities.Rating.filter({ to_email: hostEmail, request_type: 'cabin' }, '-created_date', 50),
    enabled: !!hostEmail,
  });

  // Check if user has a completed booking for this cabin
  const { data: userBookings = [] } = useQuery({
    queryKey: ['user-cabin-bookings', cabinId, currentUserEmail],
    queryFn: () => base44.entities.Booking.filter({ listing_id: cabinId, guest_email: currentUserEmail, status: 'completed' }, null, 1),
    enabled: !!currentUserEmail,
  });

  const submitMutation = useMutation({
    mutationFn: () => base44.entities.Review.create({
      listing_type: 'cabin',
      listing_id: cabinId,
      reviewer_name: user.full_name || user.email.split('@')[0],
      reviewer_email: user.email,
      rating: stars,
      comment: comment.trim(),
      provider_email: hostEmail,
    }),
    onSuccess: () => {
      qc.invalidateQueries(['cabin-reviews', cabinId]);
      setStars(0);
      setComment('');
      setShowForm(false);
      toast({ title: 'Anmeldelse sendt', description: 'Tak for din anmeldelse!' });
    },
  });

  const allRatings = [...reviews.map(r => r.rating), ...hostRatings.map(r => r.stars)];
  const avgRating = allRatings.length > 0 ? (allRatings.reduce((s, r) => s + r, 0) / allRatings.length).toFixed(1) : null;
  const alreadyReviewed = reviews.some(r => r.reviewer_email === user?.email);
  const hasCompletedBooking = userBookings.length > 0;
  const canReview = user && hasCompletedBooking && !alreadyReviewed;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            Anmeldelser
            {avgRating && <span className="text-lg font-bold text-foreground">{avgRating}</span>}
          </h2>
          {avgRating && (
            <div className="mt-1 flex items-center gap-2">
              <StarBar stars={Number(avgRating)} count={allRatings.length} />
              <span className="text-xs text-muted-foreground">af {hostName || 'udlejeren'}</span>
            </div>
          )}
        </div>
        {/* Inline star picker — only if user has a completed booking */}
        {canReview && !showForm && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => { setStars(n); setShowForm(true); }}
                className="transition-transform hover:scale-110"
              >
                <Star className={`w-6 h-6 transition-colors ${n <= (hovered || stars) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Write review form (opens after clicking a star) */}
      {showForm && canReview && (
        <div className="bg-muted/50 rounded-2xl p-5 mb-6 border border-border space-y-4">
          <p className="text-sm font-semibold text-foreground">Din anmeldelse</p>
          <StarPicker value={stars} onChange={setStars} />
          <Textarea
            placeholder="Del din oplevelse med hytten og udlejeren... (valgfrit)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="h-24 resize-none text-sm rounded-xl"
          />
          <div className="flex gap-2">
            <Button onClick={() => submitMutation.mutate()} disabled={stars === 0 || submitMutation.isPending} className="bg-primary text-white rounded-xl text-sm">
              {submitMutation.isPending ? 'Sender...' : 'Send anmeldelse'}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} className="text-sm rounded-xl">Annuller</Button>
          </div>
        </div>
      )}

      {/* Review list */}
      {reviews.length === 0 && hostRatings.length === 0 ? (
        <p className="text-sm text-muted-foreground bg-muted rounded-xl p-5 text-center">
          Ingen anmeldelser endnu – bliv den første til at anmelde denne hytte.
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <ReviewItem key={r.id} review={r} />
          ))}
          {/* Show host ratings from booking flow too */}
          {hostRatings.map((r) => (
            <RatingItem key={r.id} rating={r} />
          ))}
        </div>
      )}
    </div>
  );
}