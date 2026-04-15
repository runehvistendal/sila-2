import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function RatingModal({ requestId, requestType, toEmail, toName, onDone }) {
  const { user } = useAuth();
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (stars === 0 || submitting) return;
    setSubmitting(true);
    await base44.entities.Rating.create({
      request_id: requestId,
      request_type: requestType,
      from_email: user.email,
      to_email: toEmail,
      stars,
      comment: comment.trim(),
      is_locked: true,
    });
    toast({ title: 'Bedømmelse sendt', description: `Du gav ${stars} stjerner til ${toName}.` });
    onDone?.();
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground mb-1">Bedøm {toName}</p>
        <p className="text-xs text-muted-foreground">Din bedømmelse låses efter indsendelse og kan ikke ændres.</p>
      </div>

      {/* Stars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setStars(n)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                n <= (hovered || stars) ? 'fill-amber-400 text-amber-400' : 'text-muted'
              }`}
            />
          </button>
        ))}
      </div>

      <Textarea
        placeholder="Kommentar (valgfri)..."
        value={comment}
        onChange={e => setComment(e.target.value)}
        className="h-20 text-sm resize-none"
      />

      <Button
        onClick={submit}
        disabled={stars === 0 || submitting}
        className="w-full bg-primary text-white rounded-xl"
      >
        {submitting ? 'Sender...' : 'Send bedømmelse'}
      </Button>
    </div>
  );
}