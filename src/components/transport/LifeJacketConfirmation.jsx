import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * Safety compliance gate for providers.
 * Must be confirmed before a quote can be sent / booking accepted.
 */
export default function LifeJacketConfirmation({ requestId, providerEmail, passengerCount, onConfirmed, alreadyConfirmed = false }) {
  const [checked, setChecked] = useState(false);
  const [submitted, setSubmitted] = useState(alreadyConfirmed);
  const qc = useQueryClient();

  const confirmMutation = useMutation({
    mutationFn: async () => {
      // Check / create ProviderTrust record
      const existing = await base44.entities.ProviderTrust.filter({ provider_email: providerEmail }, null, 1);
      if (existing.length === 0) {
        await base44.entities.ProviderTrust.create({
          provider_email: providerEmail,
          trust_score: 100,
          total_confirmations: 1,
          total_violations: 0,
          status: 'active',
        });
      } else {
        await base44.entities.ProviderTrust.update(existing[0].id, {
          total_confirmations: (existing[0].total_confirmations || 0) + 1,
        });
      }

      // Create compliance record
      await base44.entities.SafetyCompliance.create({
        booking_id: requestId,
        provider_email: providerEmail,
        life_jackets_confirmed: true,
        passenger_count: passengerCount,
        confirmed_at: new Date().toISOString(),
        compliance_status: 'confirmed',
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      qc.invalidateQueries(['provider-trust', providerEmail]);
      onConfirmed?.();
    },
  });

  if (submitted) {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-700">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span className="font-medium">Sikkerhedskrav bekræftet — redningsveste til alle passagerer</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-2.5">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Obligatorisk sikkerhedskrav</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Du skal bekræfte dette krav inden du kan sende et tilbud eller acceptere bookingen.
          </p>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer group select-none">
        <div className="relative mt-0.5">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="sr-only"
          />
          <div
            onClick={() => setChecked(!checked)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              checked ? 'bg-amber-500 border-amber-500' : 'border-amber-400 bg-white group-hover:border-amber-500'
            }`}
          >
            {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
          </div>
        </div>
        <span className="text-sm text-amber-900 font-medium leading-snug">
          Jeg bekræfter at jeg har redningsveste til alle{' '}
          <span className="font-bold">{passengerCount} passager{passengerCount !== 1 ? 'er' : ''}</span>
        </span>
      </label>

      <Button
        size="sm"
        disabled={!checked || confirmMutation.isPending}
        onClick={() => confirmMutation.mutate()}
        className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg h-9 text-xs w-full font-semibold"
      >
        <ShieldCheck className="w-4 h-4 mr-1.5" />
        Bekræft sikkerhedskrav
      </Button>

      <p className="text-xs text-amber-600 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3 shrink-0" />
        Manglende bekræftelse registreres og kan påvirke din trust score.
      </p>
    </div>
  );
}