import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, MapPin, Star, Anchor, Home, Camera, Check, Edit2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

export default function Profile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  const { data: userData } = useQuery({
    queryKey: ['user-profile', user?.email],
    queryFn: () => base44.auth.me(),
    enabled: !!user,
    onSuccess: (data) => {
      if (!form) setForm({
        full_name: data.full_name || '',
        bio: data.bio || '',
        location: data.location || '',
        languages: data.languages || '',
        role_type: data.role_type || 'traveler',
        avatar_url: data.avatar_url || '',
        phone: data.phone || '',
      });
    },
  });

  const { data: myRatingsReceived = [] } = useQuery({
    queryKey: ['my-ratings-received-profile', user?.email],
    queryFn: () => base44.entities.Rating.filter({ to_email: user.email }, '-created_date', 20),
    enabled: !!user,
  });

  const { data: myReviews = [] } = useQuery({
    queryKey: ['my-reviews-profile', user?.email],
    queryFn: () => base44.entities.Review.filter({ provider_email: user.email }, '-created_date', 20),
    enabled: !!user,
  });

  const { data: myCabins = [] } = useQuery({
    queryKey: ['my-cabins-profile', user?.email],
    queryFn: () => base44.entities.Cabin.filter({ host_email: user.email }, '-created_date', 10),
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: () => base44.auth.updateMe(form),
    onSuccess: () => {
      qc.invalidateQueries(['user-profile']);
      setEditing(false);
      toast({ title: 'Profil opdateret' });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center gap-4 px-4">
        <User className="w-12 h-12 text-muted-foreground/30" />
        <p className="text-muted-foreground font-medium">Log ind for at se din profil</p>
        <Button onClick={() => base44.auth.redirectToLogin()} className="bg-primary text-white rounded-xl px-8">
          Log ind
        </Button>
      </div>
    );
  }

  const allRatingValues = [...myRatingsReceived.map(r => r.stars), ...myReviews.map(r => r.rating)];
  const avgRating = allRatingValues.length > 0
    ? (allRatingValues.reduce((s, r) => s + r, 0) / allRatingValues.length).toFixed(1)
    : null;

  const currentForm = form || {
    full_name: user.full_name || '',
    bio: '',
    location: '',
    languages: '',
    role_type: 'traveler',
    avatar_url: '',
    phone: '',
  };

  const roleLabels = {
    traveler: 'Rejsende',
    host: 'Hytteejer',
    provider: 'Transportudbyder',
    both: 'Host & Transportudbyder',
  };

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 mb-6">
          <div className="flex items-start gap-5 flex-wrap">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden">
                {currentForm.avatar_url ? (
                  <img src={currentForm.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-9 h-9 text-primary" />
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-xl font-bold text-foreground">{user.full_name || user.email.split('@')[0]}</h1>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {currentForm.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5" />{currentForm.location}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => { setEditing(!editing); setForm({ ...currentForm }); }} className="rounded-xl gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" />
                  {editing ? 'Annuller' : 'Rediger'}
                </Button>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {currentForm.role_type && (
                  <Badge className="bg-primary/10 text-primary border-0 text-xs">
                    {roleLabels[currentForm.role_type] || currentForm.role_type}
                  </Badge>
                )}
                {avgRating && (
                  <Badge className="bg-amber-50 text-amber-700 border-0 text-xs gap-1">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {avgRating} ({allRatingValues.length} bedømmelser)
                  </Badge>
                )}
                {myCabins.length > 0 && (
                  <Badge className="bg-green-50 text-green-700 border-0 text-xs gap-1">
                    <Home className="w-3 h-3" /> {myCabins.length} hytte{myCabins.length !== 1 ? 'r' : ''}
                  </Badge>
                )}
              </div>

              {currentForm.bio && !editing && (
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{currentForm.bio}</p>
              )}
              {currentForm.languages && !editing && (
                <p className="text-xs text-muted-foreground mt-1.5">Sprog: {currentForm.languages}</p>
              )}
            </div>
          </div>

          {/* Edit form */}
          {editing && (
            <div className="mt-6 space-y-4 border-t border-border pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Fulde navn</label>
                  <Input value={currentForm.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="h-10 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">By / Sted</label>
                  <Input value={currentForm.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="f.eks. Nuuk, Grønland" className="h-10 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Telefon (valgfri)</label>
                  <Input value={currentForm.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+299 ..." className="h-10 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sprog</label>
                  <Input value={currentForm.languages} onChange={e => setForm(f => ({ ...f, languages: e.target.value }))} placeholder="f.eks. Dansk, Kalaallisut, Engelsk" className="h-10 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Jeg er...</label>
                <Select value={currentForm.role_type} onValueChange={v => setForm(f => ({ ...f, role_type: v }))}>
                  <SelectTrigger className="h-10 rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="traveler">Rejsende – jeg leder efter hytter</SelectItem>
                    <SelectItem value="host">Hytteejer – jeg udlejer hytter</SelectItem>
                    <SelectItem value="provider">Transportudbyder – jeg tilbyder båd/transport</SelectItem>
                    <SelectItem value="both">Begge – host og transportudbyder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Om mig</label>
                <Textarea
                  value={currentForm.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Fortæl andre om dig selv – din erfaring med Grønland, hvad du tilbyder, osv."
                  className="h-24 resize-none text-sm rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Profilbillede URL (valgfri)</label>
                <Input value={currentForm.avatar_url} onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))} placeholder="https://..." className="h-10 rounded-xl text-sm" />
              </div>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-primary text-white rounded-xl gap-2">
                <Check className="w-4 h-4" />
                {saveMutation.isPending ? 'Gemmer...' : 'Gem profil'}
              </Button>
            </div>
          )}
        </div>

        {/* My cabins */}
        {myCabins.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-6 mb-6">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Home className="w-4 h-4 text-primary" /> Mine hytter
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myCabins.map(c => (
                <a key={c.id} href={`/cabins/${c.id}`} className="flex gap-3 items-center hover:bg-muted/50 rounded-xl p-2 transition-colors">
                  <img src={c.images?.[0] || 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=80&h=60&fit=crop'} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.location} · {c.price_per_night} DKK/nat</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Ratings received */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            Bedømmelser
            {avgRating && <span className="text-sm font-normal text-muted-foreground ml-1">{avgRating} ★ gennemsnit</span>}
          </h2>
          {allRatingValues.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen bedømmelser endnu.</p>
          ) : (
            <div className="space-y-3">
              {myRatingsReceived.map(r => (
                <div key={r.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="flex gap-0.5 mb-1">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} className={`w-4 h-4 ${n <= r.stars ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                    ))}
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground italic">"{r.comment}"</p>}
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(r.created_date), 'MMM d, yyyy')}</p>
                </div>
              ))}
              {myReviews.map(r => (
                <div key={r.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="flex gap-0.5 mb-1">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} className={`w-4 h-4 ${n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                    ))}
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground italic">"{r.comment}"</p>}
                  <p className="text-xs text-muted-foreground mt-1">{r.reviewer_name} · {format(new Date(r.created_date), 'MMM d, yyyy')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}