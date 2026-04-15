import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Star } from 'lucide-react';

export default function ProviderTrustCard({ providerEmail }) {
  const { data: trustRecord } = useQuery({
    queryKey: ['provider-trust', providerEmail],
    queryFn: () => base44.entities.ProviderTrust.filter({ provider_email: providerEmail }, null, 1),
    enabled: !!providerEmail,
    select: (data) => data?.[0],
  });

  const { data: ratingsReceived = [] } = useQuery({
    queryKey: ['provider-ratings', providerEmail],
    queryFn: () => base44.entities.Rating.filter({ to_email: providerEmail }, '-created_date', 100),
    enabled: !!providerEmail,
  });

  const avgRating = ratingsReceived.length > 0
    ? (ratingsReceived.reduce((sum, r) => sum + r.stars, 0) / ratingsReceived.length).toFixed(1)
    : null;

  const statusConfig = {
    active: { color: 'bg-green-100 text-green-700', label: 'Aktiv' },
    warning: { color: 'bg-amber-100 text-amber-700', label: 'Advarsel' },
    suspended_temp: { color: 'bg-orange-100 text-orange-700', label: 'Temp. suspenderet' },
    suspended_perm: { color: 'bg-red-100 text-red-700', label: 'Permanent suspenderet' },
  };

  const config = statusConfig[trustRecord?.status] || statusConfig.active;

  return (
    <div className="bg-white rounded-xl border border-border p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Din Trust Score</h3>
          </div>
          <p className="text-xs text-muted-foreground">Baseret på sikkerhed og gæstebedømmelser</p>
        </div>
        <Badge className={`${config.color} border-0`}>{config.label}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Trust Score */}
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-1">
            {trustRecord?.trust_score ?? 100}
          </div>
          <p className="text-xs text-muted-foreground">Trust Score</p>
        </div>

        {/* Safety Violations */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertTriangle className={`w-5 h-5 ${(trustRecord?.safety_violation_count ?? 0) > 0 ? 'text-amber-500' : 'text-green-500'}`} />
            <div className="text-3xl font-bold text-foreground">
              {trustRecord?.safety_violation_count ?? 0}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Sikkerhedsovertrædelser</p>
        </div>

        {/* Average Rating */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <div className="text-3xl font-bold text-foreground">
              {avgRating || '—'}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Gæstebedømmelse</p>
        </div>
      </div>

      {/* Info text */}
      {(trustRecord?.safety_violation_count ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
          <p className="font-medium mb-1">Sikkerhedsoversigt:</p>
          <p>
            Du har {trustRecord.safety_violation_count} sikkerhedsovertrædelse{trustRecord.safety_violation_count !== 1 ? 'r' : ''}. 
            {trustRecord.safety_violation_count >= 3 ? ' Din konto er permanent suspenderet.' : ' Gæster bedes være opmærksomme på sikkerhedsbekymringer.'}
          </p>
        </div>
      )}

      {ratingsReceived.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Modtagne bedømmelser:</p>
          <p>{ratingsReceived.length} gæster har bedømt dig</p>
        </div>
      )}
    </div>
  );
}