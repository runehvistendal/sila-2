import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { BadgeCheck, CheckCircle2 } from 'lucide-react';

export default function ProviderBadge({ providerEmail, isVerified }) {
  const { t } = useLanguage();

  const { data: trust } = useQuery({
    queryKey: ['provider-trust', providerEmail],
    queryFn: () => base44.entities.ProviderTrust.filter({ provider_email: providerEmail }, null, 1).then(r => r[0] || null),
    enabled: !!providerEmail,
    staleTime: 5 * 60 * 1000,
  });

  const score = trust?.trust_score;

  if (isVerified || score >= 85) {
    return (
      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-200">
        <BadgeCheck className="w-3 h-3" />
        {t('verified')}
      </span>
    );
  }

  if (score >= 70) {
    return (
      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-green-200">
        <CheckCircle2 className="w-3 h-3" />
        {t('active_provider')}
      </span>
    );
  }

  return null;
}