import React, { useState, useEffect } from 'react';
import { useAnalytics } from '@/lib/AnalyticsContext';
import { Button } from '@/components/ui/button';
import { Cookie, X } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function CookieConsent() {
  const { consentGiven, setAnalyticsConsent, consentLoaded } = useAnalytics();
  const { language } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if consent already given or on first load
    if (consentLoaded && (consentGiven || dismissed)) {
      setDismissed(true);
    }
  }, [consentLoaded, consentGiven]);

  if (dismissed || !consentLoaded) return null;

  const content = {
    en: {
      title: 'Analytics Consent',
      description: 'We use Google Analytics to understand how you use Sila. Your data is anonymized and protected under GDPR.',
      acceptBtn: 'Accept Analytics',
      rejectBtn: 'Reject',
    },
    da: {
      title: 'Analytik-samtykke',
      description: 'Vi bruger Google Analytics til at forstå, hvordan du bruger Sila. Dine data er anonymiseret og beskyttet under GDPR.',
      acceptBtn: 'Accepter Analytik',
      rejectBtn: 'Afvis',
    },
    kl: {
      title: 'Analytics Samtykkiarneri',
      description: 'Sila analyseernik usummarneq. Kina ataasinnguuq GDPR inerniarnermi ataasinnguuq.',
      acceptBtn: 'Samtykkiarneri',
      rejectBtn: 'Atugassavoq',
    },
  };

  const t = content[language] || content.en;

  const handleAccept = () => {
    setAnalyticsConsent(true);
    setDismissed(true);
  };

  const handleReject = () => {
    setAnalyticsConsent(false);
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-40">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 flex-1 min-w-64">
          <Cookie className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-foreground">{t.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReject}
            className="text-xs rounded-lg"
          >
            {t.rejectBtn}
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            className="text-xs rounded-lg bg-primary text-white hover:bg-primary/90"
          >
            {t.acceptBtn}
          </Button>
        </div>
      </div>
    </div>
  );
}