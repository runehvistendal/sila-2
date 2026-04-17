import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, MapPin, Star, Anchor, Home, Camera, Check, Edit2, Backpack, Users } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { useRole } from '@/lib/RoleContext';
import AvatarUploader from '@/components/image-editor/AvatarUploader';
import LocationAutocomplete from '@/components/shared/LocationAutocomplete';
import { GREENLAND_LOCATIONS } from '@/lib/greenlandLocations';

const ROLE_CARDS = {
  traveler: {
    icon: Backpack,
    title: { da: 'Rejsende', en: 'Traveler', kl: 'Angallattartoq' },
    desc: {
      da: 'Book hytter og sejlture. Du ser dine bookinger og anmodninger.',
      en: 'Book cabins and boat trips. You see your bookings and requests.',
      kl: 'Angallattartoq',
    },
  },
  provider: {
    icon: Home,
    title: { da: 'Udbyder', en: 'Provider', kl: 'Nalunaarsuisartoq' },
    desc: {
      da: 'Opret og sælg hytter og sejlture. Du ser åbne ønsker, annoncer og din indbakke.',
      en: 'List and sell cabins and boat trips. You see open requests, listings and your inbox.',
      kl: 'Nalunaarsuisartoq',
    },
  },
  both: {
    icon: Users,
    title: { da: 'Begge', en: 'Both', kl: 'Marlunnginnardlutik' },
    desc: {
      da: 'Fuld adgang — rejse og udbyde på samme tid.',
      en: 'Full access — travel and provide at the same time.',
      kl: 'Marlunnginnardlutik',
    },
  },
};

const ROLE_NOTE = {
  da: 'Dit valg bestemmer hvilke funktioner der vises i dit dashboard.',
  en: 'Your choice determines which features appear in your dashboard.',
  kl: 'Dit valg bestemmer hvilke funktioner der vises i dit dashboard.',
};

function RoleTypeCards({ value, onChange, lang }) {
  const l = lang || 'da';
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Object.entries(ROLE_CARDS).map(([key, card]) => {
          const Icon = card.icon;
          const selected = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                selected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-white hover:border-primary/40 hover:bg-muted/40'
              }`}
            >
              <Icon className={`w-6 h-6 mb-2 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className={`text-sm font-semibold mb-1 ${selected ? 'text-primary' : 'text-foreground'}`}>
                {card.title[l] || card.title.da}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {card.desc[l] || card.desc.da}
              </p>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground italic">{ROLE_NOTE[l] || ROLE_NOTE.da}</p>
    </div>
  );
}

function OnboardingStep({ user, t, lang }) {
  const navigate = useNavigate();
  const CITIES = [...new Set(GREENLAND_LOCATIONS.map(l => l.name_dk))].sort();
  const [obForm, setObForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '', location: '', role_type: 'traveler' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const l = lang || 'da';

  const handleSubmit = async () => {
    if (!obForm.full_name.trim()) { setError(t('onboarding_name_required')); return; }
    if (!obForm.location) { setError(t('onboarding_city_required')); return; }
    setError('');
    setSaving(true);
    await base44.auth.updateMe({ full_name: obForm.full_name.trim(), phone: obForm.phone, location: obForm.location, role_type: obForm.role_type });
    setSaving(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen pt-16 bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-border shadow-card p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">{t('welcome_to_sila')}</h1>
          <p className="text-muted-foreground text-sm mt-2">{t('complete_profile_subtitle')}</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('full_name')} *</label>
            <Input value={obForm.full_name} onChange={e => setObForm(f => ({ ...f, full_name: e.target.value }))} className="h-10 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('phone_optional')}</label>
            <Input value={obForm.phone} onChange={e => setObForm(f => ({ ...f, phone: e.target.value }))} placeholder="+299 ..." className="h-10 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('city_location')} *</label>
            <Select value={obForm.location} onValueChange={v => setObForm(f => ({ ...f, location: v }))}>
              <SelectTrigger className="h-10 rounded-xl text-sm"><SelectValue placeholder={t('select_departure')} /></SelectTrigger>
              <SelectContent>{CITIES.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('i_am')} *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
              {Object.entries(ROLE_CARDS).map(([key, card]) => {
                const Icon = card.icon;
                const selected = obForm.role_type === key;
                return (
                  <button key={key} type="button" onClick={() => setObForm(f => ({ ...f, role_type: key }))}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-white hover:border-primary/40'}`}>
                    <Icon className={`w-5 h-5 mb-1.5 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className={`text-xs font-semibold mb-1 ${selected ? 'text-primary' : 'text-foreground'}`}>{card.title[l] || card.title.da}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{card.desc[l] || card.desc.da}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground italic mt-2">{ROLE_NOTE[l] || ROLE_NOTE.da}</p>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleSubmit} disabled={saving} className="w-full h-11 bg-primary text-white rounded-xl font-semibold">
          {saving ? t('saving') : t('get_started')}
        </Button>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { currentRole } = useRole();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [providerForm, setProviderForm] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const isOnboarding = urlParams.get('onboarding') === 'true';

  const { data: userData } = useQuery({
    queryKey: ['user-profile', user?.email],
    queryFn: () => base44.auth.me(),
    enabled: !!user,
  });

  // Initialize form when data loads (replaces broken onSuccess)
  useEffect(() => {
    if (userData && !form) {
      setForm({
        full_name: userData.full_name || '',
        bio: userData.bio || '',
        location_id: userData.location_id || null,
        languages: userData.languages || '',
        role_type: userData.role_type || 'traveler',
        avatar_url: userData.avatar_url || '',
        phone: userData.phone || '',
        notification_prefs: userData.notification_prefs || 'email',
      });
    }
    if (userData && !providerForm) {
      setProviderForm({
        provider_name: userData.provider_name || '',
        provider_bio: userData.provider_bio || '',
        provider_location_id: userData.provider_location_id || null,
        provider_phone: userData.provider_phone || '',
        provider_avatar: userData.provider_avatar || '',
      });
    }
  }, [userData]);

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
    mutationFn: () => {
      const data = { ...form };
      // If editing provider profile, include provider fields
      if (currentRole === 'provider' && providerForm) {
        data.provider_name = providerForm.provider_name;
        data.provider_bio = providerForm.provider_bio;
        data.provider_location = providerForm.provider_location;
        data.provider_phone = providerForm.provider_phone;
        data.provider_avatar = providerForm.provider_avatar;
      }
      return base44.auth.updateMe(data);
    },
    onSuccess: () => {
      qc.invalidateQueries(['user-profile']);
      setEditing(false);
      toast({ title: t('saved') });
    },
  });

  // Auto-sync provider data to user on mount
  useEffect(() => {
    if (currentRole === 'user' && providerForm?.provider_name && form && !form.full_name) {
      setForm(f => ({
        ...f,
        full_name: providerForm.provider_name || f.full_name,
        phone: providerForm.provider_phone || f.phone,
        location_id: providerForm.provider_location_id || f.location_id,
        avatar_url: providerForm.provider_avatar || f.avatar_url,
      }));
    }
  }, [providerForm, currentRole]);

  if (!user) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center gap-4 px-4">
        <User className="w-12 h-12 text-muted-foreground/30" />
        <p className="text-muted-foreground font-medium">{t('login_to_see_profile')}</p>
        <Button onClick={() => base44.auth.redirectToLogin()} className="bg-primary text-white rounded-xl px-8">
          {t('login_btn')}
        </Button>
      </div>
    );
  }

  if (isOnboarding) {
    return <OnboardingStep user={user} t={t} lang={lang} />;
  }

  const allRatingValues = [...myRatingsReceived.map(r => r.stars), ...myReviews.map(r => r.rating)];
  const avgRating = allRatingValues.length > 0
    ? (allRatingValues.reduce((s, r) => s + r, 0) / allRatingValues.length).toFixed(1)
    : null;

  const currentForm = form || {
    full_name: user.full_name || '',
    bio: '',
    location_id: null,
    languages: '',
    role_type: 'traveler',
    avatar_url: '',
    phone: '',
    notification_prefs: 'email',
  };

  const roleLabels = {
    traveler: t('traveler_desc'),
    host: t('provider_desc'),
    provider: t('provider_desc'),
    both: t('both_desc'),
  };

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 mb-6">
          <div className="flex items-start gap-5 flex-wrap">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
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
                  {user.location_name && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5" />{user.location_name}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => { setEditing(!editing); setForm({ ...currentForm }); }} className="rounded-xl gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" />
                  {editing ? t('cancel') : t('edit')}
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
                    {avgRating} ({allRatingValues.length} {t('ratings_avg')})
                  </Badge>
                )}
                {myCabins.length > 0 && (
                  <Badge className="bg-green-50 text-green-700 border-0 text-xs gap-1">
                    <Home className="w-3 h-3" /> {myCabins.length} {t('cabins_count')}{myCabins.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {currentForm.bio && !editing && (
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{currentForm.bio}</p>
              )}
              {currentForm.languages && !editing && (
                <p className="text-xs text-muted-foreground mt-1.5">{t('languages')}: {currentForm.languages}</p>
              )}
            </div>
          </div>

          {/* Edit form */}
          {editing && (
            <div className="mt-6 space-y-4 border-t border-border pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('full_name')}</label>
                  <Input value={currentForm.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="h-10 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('city_location')}</label>
                  <LocationAutocomplete 
                    value={currentForm.location_id ? { id: currentForm.location_id } : null}
                    onChange={(loc) => setForm(f => ({ ...f, location_id: loc?.id || null }))}
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('phone_optional')}</label>
                  <Input value={currentForm.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+299 ..." className="h-10 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('languages')}</label>
                  <Input value={currentForm.languages} onChange={e => setForm(f => ({ ...f, languages: e.target.value }))} className="h-10 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('i_am')}</label>
                <RoleTypeCards value={currentForm.role_type} onChange={v => setForm(f => ({ ...f, role_type: v }))} lang={lang} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('notifications')}</label>
                <Select value={currentForm.notification_prefs} onValueChange={v => setForm(f => ({ ...f, notification_prefs: v }))}>
                  <SelectTrigger className="h-10 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">{t('email_only')}</SelectItem>
                    <SelectItem value="sms">{t('sms_only')}</SelectItem>
                    <SelectItem value="both">{t('both_email_sms')}</SelectItem>
                    <SelectItem value="none">{t('no_notifications')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('about_me')}</label>
                <Textarea
                  value={currentForm.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  className="h-24 resize-none text-sm rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('profile_picture')}</label>
                <AvatarUploader
                  currentUrl={currentForm.avatar_url}
                  uploading={saveMutation.isPending}
                  onSave={async (dataUrl) => {
                    const res = await fetch(dataUrl);
                    const blob = await res.blob();
                    const file = new File([blob], 'avatar.png', { type: 'image/png' });
                    const { file_url } = await base44.integrations.Core.UploadFile({ file });
                    setForm(f => ({ ...f, avatar_url: file_url }));
                  }}
                />
              </div>



              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-primary text-white rounded-xl gap-2">
                <Check className="w-4 h-4" />
                {saveMutation.isPending ? t('saving') : t('save_profile')}
              </Button>
              </div>
              )}
        </div>

        {/* Provider profile (when in provider role) */}
         {currentRole === 'provider' && (
           <div className="bg-white rounded-2xl border border-border p-6 mb-6">
             <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
               <Anchor className="w-4 h-4 text-primary" /> {t('provider_profile')}
             </h2>
             {!editing ? (
               <div className="space-y-3">
                 <p className="text-sm text-muted-foreground">
                   {providerForm?.provider_name || t('no_description_provided')}
                 </p>
                 <Button variant="outline" size="sm" onClick={() => { setEditing(true); setForm({ ...currentForm }); }} className="rounded-xl">
                   {t('edit_provider_profile')}
                 </Button>
               </div>
             ) : (
               <div className="space-y-4 border-t border-border pt-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('provider_name')}</label>
                     <Input
                       value={providerForm?.provider_name || ''}
                       onChange={e => setProviderForm(f => ({ ...f, provider_name: e.target.value }))}
                       className="h-10 rounded-xl text-sm"
                     />
                   </div>
                   <div>
                     <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('city_location')}</label>
                     <LocationAutocomplete 
                       value={providerForm?.provider_location_id ? { id: providerForm.provider_location_id } : null}
                       onChange={(loc) => setProviderForm(f => ({ ...f, provider_location_id: loc?.id || null }))}
                       className="h-10"
                     />
                   </div>
                   <div>
                     <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('phone_optional')}</label>
                     <Input
                       value={providerForm?.provider_phone || ''}
                       onChange={e => setProviderForm(f => ({ ...f, provider_phone: e.target.value }))}
                       placeholder="+299 ..."
                       className="h-10 rounded-xl text-sm"
                     />
                   </div>
                 </div>
               </div>
             )}
           </div>
         )}

        {/* My cabins */}
         {myCabins.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-6 mb-6">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Home className="w-4 h-4 text-primary" /> {t('my_cabins')}
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

        {/* Anmeldelser */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            Anmeldelser
            {avgRating && <span className="text-sm font-normal text-muted-foreground ml-1">{avgRating} ★ gennemsnitlig vurdering</span>}
          </h2>
          {allRatingValues.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen anmeldelser endnu</p>
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