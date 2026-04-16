import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)} onClick={() => onChange(n)} className="transition-transform hover:scale-110">
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

  const { data: existing = [] } = useQuery({
    queryKey: ['review-exists', booking.id],
    queryFn: () => base44.entities.Review.filter({ listing_id: booking.listing_id, reviewer_email: user?.email }),
    enabled: !!user && open,
  });

  const submitMutation = useMutation({
    mutationFn: () => base44.entities.Review.create({
      listing_type: booking.type,
      listing_id: booking.listing_id,
      listing_title: booking.listing_title,
      reviewer_name: user.full_name || user.email.split('@')[0],
      reviewer_email: user.email,
      rating: stars,
      comment: comment.trim(),
      provider_email: booking.host_email,
    }),
    onSuccess: () => {
      qc.invalidateQueries(['reviews']);
      toast({ title: 'Anmeldelse sendt!', description: 'Tak for din feedback.' });
      setOpen(false);
    },
  });

  if (booking.status !== 'completed') return null;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="rounded-xl gap-1 text-xs">
        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Anmeld
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anmeld: {booking.listing_title}</DialogTitle>
          </DialogHeader>
          {existing.length > 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Du har allerede anmeldt denne booking.</p>
          ) : (
            <div className="space-y-4 pt-2">
              <StarPicker value={stars} onChange={setStars} />
              <Textarea
                placeholder="Del din oplevelse..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="h-28 resize-none rounded-xl text-sm"
              />
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={stars === 0 || submitMutation.isPending}
                className="w-full bg-primary text-white rounded-xl"
              >
                {submitMutation.isPending ? 'Sender...' : 'Send Anmeldelse'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}