import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Anchor, Home, ArrowLeft, Calendar, User, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

function StarRow({ rating, size = 'sm' }) {
  const s = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`${s} ${n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
      ))}
    </div>
  );
}

export default function UserProfile() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');
  const type = urlParams.get('type') || 'host'; // 'host' | 'guest'

  if (!email) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            Tilbage
          </button>
          <div className="bg-white rounded-2xl border border-border p-6 text-center">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Brugerinformation blev ikke fundet.</p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch reviews where this person is the provider (as host/transport provider)
  const { data: hostReviews = [], isLoading: isLoadingHostReviews } = useQuery({
    queryKey: ['profile-host-reviews', email],
    queryFn: () => base44.entities.Review.filter({ provider_email: email }, '-created_date', 50),
    enabled: !!email,
  });

  // Fetch reviews written BY this person (as guest)
  const { data: guestReviews = [], isLoading: isLoadingGuestReviews } = useQuery({
    queryKey: ['profile-guest-reviews', email],
    queryFn: () => base44.entities.Review.filter({ reviewer_email: email }, '-created_date', 50),
    enabled: !!email,
  });

  // Fetch cabins listed by this person
  const { data: cabins = [], isLoading: isLoadingCabins } = useQuery({
    queryKey: ['profile-cabins', email],
    queryFn: () => base44.entities.Cabin.filter({ host_email: email, status: 'active' }, '-created_date', 10),
    enabled: !!email,
  });

  // Fetch transports listed by this person
  const { data: transports = [], isLoading: isLoadingTransports } = useQuery({
    queryKey: ['profile-transports', email],
    queryFn: () => base44.entities.Transport.filter({ provider_email: email, status: 'scheduled' }, '-departure_date', 10),
    enabled: !!email,
  });

  const isLoading = isLoadingHostReviews || isLoadingGuestReviews || isLoadingCabins || isLoadingTransports;
  const isProvider = cabins.length > 0 || transports.length > 0 || hostReviews.length > 0;

  // Derive name and avatar from reviews or listings
  const name = cabins[0]?.host_name || transports[0]?.provider_name || hostReviews[0]?.provider_name || guestReviews[0]?.reviewer_name || email?.split('@')[0] || 'Ukendt bruger';
  const avatar = cabins[0]?.host_avatar || transports[0]?.provider_avatar || null;

  const avgRating = hostReviews.length > 0
    ? (hostReviews.reduce((s, r) => s + r.rating, 0) / hostReviews.length).toFixed(1)
    : null;

  const memberSince = cabins[0]?.created_date || transports[0]?.created_date;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <div className="bg-white rounded-2xl border border-border shadow-card p-6 mb-6">
            <div className="flex items-start gap-5">
              <Skeleton className="w-20 h-20 rounded-full shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Tilbage
        </button>

        {/* Profile header */}
        <div className="bg-white rounded-2xl border border-border shadow-card p-6 mb-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary">{name.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{name}</h1>
              {avgRating && (
                <div className="flex items-center gap-2 mt-1">
                  <StarRow rating={Number(avgRating)} size="md" />
                  <span className="text-sm font-semibold text-foreground">{avgRating}</span>
                  <span className="text-sm text-muted-foreground">({hostReviews.length} anmeldelse{hostReviews.length !== 1 ? 'r' : ''})</span>
                </div>
              )}
              {memberSince && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Medlem siden {format(new Date(memberSince), 'MMM yyyy')}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {cabins.length > 0 && (
                  <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                    <Home className="w-3 h-3" /> {cabins.length} hytte{cabins.length !== 1 ? 'r' : ''}
                  </span>
                )}
                {transports.length > 0 && (
                  <span className="inline-flex items-center gap-1 bg-accent/10 text-accent text-xs font-semibold px-2.5 py-1 rounded-full">
                    <Anchor className="w-3 h-3" /> {transports.length} transport
                  </span>
                )}
                {!isProvider && (
                  <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
                    <User className="w-3 h-3" /> Gæst
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Listings */}
        {(cabins.length > 0 || transports.length > 0) && (
          <div className="bg-white rounded-2xl border border-border shadow-card p-6 mb-6">
            <h2 className="text-base font-bold text-foreground mb-4">Opslag</h2>
            {cabins.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Hytter</p>
                {cabins.map(c => (
                  <a key={c.id} href={`/cabins/${c.id}`} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/3 transition-colors">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                      {c.images?.[0] && <img src={c.images[0]} alt={c.title} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{c.location} · {c.price_per_night} DKK/nat</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
            {transports.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Transport</p>
                {transports.map(t => (
                  <a key={t.id} href={`/transport/${t.id}`} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                      {t.images?.[0] && <img src={t.images[0]} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{t.from_location} → {t.to_location}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(t.departure_date), 'd. MMM yyyy')} · {t.round_trip_price} DKK</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews received (as host/provider) */}
        {isProvider && (
          <div className="bg-white rounded-2xl border border-border shadow-card p-6 mb-6">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              Anmeldelser modtaget {hostReviews.length > 0 && `(${hostReviews.length})`}
            </h2>
            {hostReviews.length > 0 ? (
              <div className="space-y-4">
                {hostReviews.map(r => (
                  <div key={r.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                          {(r.reviewer_name || '?').charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-foreground">{r.reviewer_name || 'Anonym'}</span>
                      </div>
                      <StarRow rating={r.rating} />
                    </div>
                    {r.listing_title && (
                      <p className="text-xs text-muted-foreground mb-1 ml-9">om {r.listing_title}</p>
                    )}
                    {r.comment && <p className="text-sm text-muted-foreground leading-relaxed ml-9">{r.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Endnu ingen anmeldelser modtaget.</p>
            )}
          </div>
        )}

        {/* Reviews written (as guest) */}
        <div className="bg-white rounded-2xl border border-border shadow-card p-6">
          <h2 className="text-base font-bold text-foreground mb-4">Anmeldelser skrevet {guestReviews.length > 0 && `(${guestReviews.length})`}</h2>
          {guestReviews.length > 0 ? (
            <div className="space-y-4">
              {guestReviews.map(r => (
                <div key={r.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-foreground">{r.listing_title || 'Opslag'}</p>
                    <StarRow rating={r.rating} />
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Endnu ingen anmeldelser skrevet.</p>
          )}
        </div>

        {hostReviews.length === 0 && guestReviews.length === 0 && cabins.length === 0 && transports.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>{isProvider ? 'Ingen opslag oprettet endnu.' : 'Denne bruger har ikke oprettet nogen opslag.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}