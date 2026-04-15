import React from 'react';
import { Star } from 'lucide-react';

export default function StarDisplay({ rating, count, size = 'sm' }) {
  if (!rating) return null;
  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-1">
      <Star className={`${starSize} fill-amber-400 text-amber-400`} />
      <span className={`font-semibold text-foreground ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>{Number(rating).toFixed(1)}</span>
      {count !== undefined && <span className={`text-muted-foreground ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>({count})</span>}
    </div>
  );
}