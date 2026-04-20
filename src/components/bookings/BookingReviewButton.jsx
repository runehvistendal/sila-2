import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
          <Star className={`w-8 h-8 transition-colors ${n <= (hovered || value) ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
        </button>
      ))}
    </div>
  );
}

export default function BookingReviewButton({ booking }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Always check if review exists for this booking (not just when dialog opens)
  const { data: existingReviews = [], isLoading: checkingReview } = useQuery({
    queryKey: ['review-exists', booking.id, user?.email],
    queryFn: () => base44.asServiceRole
      ? base44.entities.Review.filter({ booking_id: booking.id, reviewer_email: user?.email })
      : [],
    enabled: !!user && booking.status === 'completed',
    staleTime: 30_000,
  });

  const hasReviewed = existingReviews.length > 0;

  const handleSubmit = async () => {
    if (stars === 0) return;
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke('createReview', {
        booking_id: booking.id,
        rating: stars,
        comment: comment.trim(),
      });

      if (res.data?.error) {
        toast({ title: 'Fejl', description: res.data.error, variant: 'destructive' });
        return;
      }

      qc.invalidateQueries(['review-exists', booking.id]);
      qc.invalidateQueries(['reviews']);
      toast({ title: 'Anmeldelse sendt!', description: 'Tak for din feedback.' });
      setOpen(false);
    } catch (err) {
      toast({ title: 'Fejl', description: err.message || 'Noget gik galt.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // Only show for completed bookings
  if (booking.status !== 'completed') return null;

  // Already reviewed — show badge instead of button
  if (hasReviewed) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Anmeldt
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={checkingReview}
        className="rounded-xl gap-1 text-xs"
      >
        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Anmeld
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anmeld: {booking.listing_title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <StarPicker value={stars} onChange={setStars} />
            <Textarea
              placeholder="Del din oplevelse..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="h-28 resize-none rounded-xl text-sm"
            />
            <Button
              onClick={handleSubmit}
              disabled={stars === 0 || submitting}
              className="w-full bg-primary text-white rounded-xl"
            >
              {submitting ? 'Sender...' : 'Send Anmeldelse'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}