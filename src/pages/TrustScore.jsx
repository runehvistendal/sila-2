import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle, BadgeCheck, TrendingUp, Star, Clock, AlertTriangle, Calendar } from 'lucide-react';

const SCORE_LEVELS = {
  en: [
    { min: 85, label: 'Verified', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { min: 70, label: 'Active Provider', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { min: 50, label: 'Fair', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { min: 0, label: 'Under Review', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  ],
  da: [
    { min: 85, label: 'Verificeret', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { min: 70, label: 'Aktiv udbyder', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { min: 50, label: 'Fair', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { min: 0, label: 'Under gennemgang', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  ],
  kl: [
    { min: 85, label: 'Inugujoq', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { min: 70, label: 'Nalunaarsuisoq', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { min: 50, label: 'Fair', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { min: 0, label: 'Ataasunnguinneri', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  ],
};

function getLevel(score, levels) {
  return levels.find(l => score >= l.min) || levels[levels.length - 1];
}

export default function TrustScore() {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const { data: trust } = useQuery({
    queryKey: ['my-trust-score', user?.email],
    queryFn: () => base44.entities.ProviderTrust.filter({ provider_email: user.email }, null, 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const content = {
    en: {
      title: 'Understanding Trust Score',
      description: 'Your trust score helps travelers and hosts make informed decisions.',
      your_score: 'Your Trust Score',
      no_score: 'No score yet — complete bookings to build your score.',
      breakdown: 'Score Breakdown',
      components: [
        { icon: Star, label: 'Star ratings from guests/hosts', pct: '60%' },
        { icon: AlertTriangle, label: 'Absence of disputes & incidents', pct: '20%' },
        { icon: Clock, label: 'Response time on bookings', pct: '15%' },
        { icon: Calendar, label: 'Account age', pct: '5%' },
      ],
      how_title: 'How to improve your score',
      tips: [
        'Respond to booking requests within 2 hours',
        'Deliver the experience exactly as described',
        'Ask guests to leave a review after each trip',
        'Avoid disputes — communicate proactively',
      ],
      levels_title: 'Score Levels',
      levels: [
        { range: '85–100', label: 'Verified', desc: 'Blue checkmark badge shown on your listings' },
        { range: '70–84', label: 'Active Provider', desc: 'Green badge shown on your listings' },
        { range: '50–69', label: 'Fair', desc: 'No badge — keep improving' },
        { range: '0–49', label: 'Under Review', desc: 'Low score warning sent — risk of suspension' },
      ],
    },
    da: {
      title: 'Forståelse af tillidscore',
      description: 'Din tillidscore hjælper rejsende og værter med at tage velinformerede beslutninger.',
      your_score: 'Din Trust Score',
      no_score: 'Ingen score endnu — gennemfør bookinger for at opbygge din score.',
      breakdown: 'Score-sammensætning',
      components: [
        { icon: Star, label: 'Stjernebedømmelser fra gæster/værter', pct: '60%' },
        { icon: AlertTriangle, label: 'Fravær af tvister og hændelser', pct: '20%' },
        { icon: Clock, label: 'Responstid på bookingforespørgsler', pct: '15%' },
        { icon: Calendar, label: 'Kontoalder', pct: '5%' },
      ],
      how_title: 'Sådan forbedrer du din score',
      tips: [
        'Svar på bookingforespørgsler inden for 2 timer',
        'Lever oplevelsen præcist som beskrevet',
        'Bed gæster om at efterlade en anmeldelse',
        'Undgå tvister — kommuniker proaktivt',
      ],
      levels_title: 'Score-niveauer',
      levels: [
        { range: '85–100', label: 'Verificeret', desc: 'Blåt flueben-badge vist på dine opslag' },
        { range: '70–84', label: 'Aktiv udbyder', desc: 'Grønt badge vist på dine opslag' },
        { range: '50–69', label: 'Fair', desc: 'Intet badge — bliv ved med at forbedre dig' },
        { range: '0–49', label: 'Under gennemgang', desc: 'Advarsel sendt — risiko for suspendering' },
      ],
    },
    kl: {
      title: 'Tunngaviguk Iluaquvalirtuq',
      description: 'Tunngaviguk iluaquvalirtuq atoriarrinillarmu inerniarnerminullu inugujoq.',
      your_score: 'Trust Score',
      no_score: 'Score noanngissagut.',
      breakdown: 'Score-alluungissusiarineq',
      components: [
        { icon: Star, label: 'Ataasinnguut naliliinerit', pct: '60%' },
        { icon: AlertTriangle, label: 'Inerniarner taperneq', pct: '20%' },
        { icon: Clock, label: 'Naatumerineq', pct: '15%' },
        { icon: Calendar, label: 'Kontu alluugua', pct: '5%' },
      ],
      how_title: 'Iluaquvalinnilli alluunnik',
      tips: [
        'Booking 2 nalunaaqutap akunnerata nalilersuiffissaminnik',
        'Inerniarneq suliliaq',
        'Naliliinerit nassiuguk',
        'Ataasinnguut naatumerineq',
      ],
      levels_title: 'Asigissaq talleq',
      levels: [
        { range: '85–100', label: 'Inugujoq', desc: 'Bullit blue inugujoq' },
        { range: '70–84', label: 'Nalunaarsuisoq', desc: 'Bullit green nalunaarsuisoq' },
        { range: '50–69', label: 'Fair', desc: 'Noanngissagut badge' },
        { range: '0–49', label: 'Ataasunnguinneri', desc: 'Nalunaarsuiffik nassiunneqarpoq' },
      ],
    },
  };

  const c = content[lang] || content.da;
  const levels = SCORE_LEVELS[lang] || SCORE_LEVELS.da;
  const score = trust?.trust_score;
  const level = score !== undefined ? getLevel(score, levels) : null;

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl sm:text-4xl font-bold">{c.title}</h1>
        </div>
        <p className="text-muted-foreground mb-10">{c.description}</p>

        {/* Personal score card — only shown when logged in */}
        {user && (
          <div className={`rounded-2xl border p-6 mb-10 ${level ? `${level.bg} ${level.border}` : 'bg-muted border-border'}`}>
            <p className="text-sm font-semibold text-muted-foreground mb-2">{c.your_score}</p>
            {score !== undefined ? (
              <>
                <div className="flex items-end gap-3 mb-3">
                  <span className={`text-5xl font-black ${level?.color}`}>{score}</span>
                  <span className={`text-lg font-bold mb-1 ${level?.color}`}>{level?.label}</span>
                  {(score >= 85 || user?.is_verified) && <BadgeCheck className="w-7 h-7 text-blue-600 mb-1" />}
                </div>
                <div className="w-full h-3 bg-white/60 rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full transition-all ${score >= 85 ? 'bg-blue-500' : score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">0 — 100</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{c.no_score}</p>
            )}
          </div>
        )}

        {/* Breakdown */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4">{c.breakdown}</h2>
          <div className="space-y-3">
            {c.components.map((comp, i) => (
              <div key={i} className="flex items-center gap-4 bg-white border border-border rounded-xl px-4 py-3">
                <comp.icon className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm text-foreground flex-1">{comp.label}</span>
                <span className="text-sm font-bold text-primary">{comp.pct}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Score levels */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4">{c.levels_title}</h2>
          <div className="space-y-3">
            {c.levels.map((l, i) => (
              <div key={i} className="flex items-start gap-4 bg-white border border-border rounded-xl px-4 py-3">
                <span className="text-sm font-bold text-muted-foreground w-14 shrink-0">{l.range}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{l.label}</p>
                  <p className="text-xs text-muted-foreground">{l.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">{c.how_title}</h2>
          <ul className="space-y-2">
            {c.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <Link to="/dashboard" className="text-sm text-primary underline">← {lang === 'en' ? 'Back to dashboard' : 'Tilbage til dashboard'}</Link>
      </div>
    </div>
  );
}