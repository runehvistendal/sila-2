import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Shield, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

export default function TrustScore() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: 'Understanding Trust Score',
      description: 'Your trust score helps travelers and hosts make informed decisions.',
      sections: [
        {
          title: 'What is Trust Score?',
          text: 'Trust Score is a measure of reliability and safety on Sila. It ranges from 0-100 and is based on your booking history, reviews, and safety compliance.'
        },
        {
          title: 'How It\'s Calculated',
          items: [
            '60% - Guest/Host ratings and reviews',
            '20% - Safety compliance and incident history',
            '15% - Response time and communication',
            '5% - Account age and activity'
          ]
        },
        {
          title: 'Score Levels',
          items: [
            '85-100: Excellent (Verified)',
            '70-84: Good',
            '50-69: Fair',
            'Below 50: Under Review'
          ]
        }
      ]
    },
    da: {
      title: 'Forståelse af tillidscore',
      description: 'Din tillidscore hjælper rejsende og værter med at tage velinformerede beslutninger.',
      sections: [
        {
          title: 'Hvad er tillidscore?',
          text: 'Tillidscore er et mål for pålidelighed og sikkerhed på Sila. Det går fra 0-100 og er baseret på din bookingshistorik, anmeldelser og sikkerhedsefterlevelse.'
        },
        {
          title: 'Hvordan det beregnes',
          items: [
            '60% - Gæst/Vært ratings og anmeldelser',
            '20% - Sikkerhedsefterlevelse og hændelseshistorik',
            '15% - Responsetid og kommunikation',
            '5% - Kontoalder og aktivitet'
          ]
        },
        {
          title: 'Scoreniveauer',
          items: [
            '85-100: Udmærket (Verificeret)',
            '70-84: God',
            '50-69: Fair',
            'Under 50: Under gennemgang'
          ]
        }
      ]
    },
    kl: {
      title: 'Tunngaviguk Iluaquvalirtuq',
      description: 'Tunngaviguk iluaquvalirtuq atoriarrinillarmu inerniarnerminullu inugujoq.',
      sections: [
        {
          title: 'Tunngaviguk iluaquvalirtuq?',
          text: 'Tunngaviguk iluaquvalirtuq iluaquvaannili silaamut asiginnissusumik. 0-100 isumaqarpoq inerniarnermi ataasinnguulermu alerujussumiNilullu.'
        },
        {
          title: 'Kalaallinik asigissarneri',
          items: [
            '60% - Inerniarner iluaquvalinnilli ataasinnguuq',
            '20% - Inugujoq taperneq inerniarneqarneq',
            '15% - Naatumerineq ataasinnguuq',
            '5% - Kontu alluugua inerniarnermi'
          ]
        },
        {
          title: 'Asigissaq talleq',
          items: [
            '85-100: Qajaqum (Inugujoq)',
            '70-84: Alluunnik',
            '50-69: Aseriginnginnerni',
            'Minnguut 50: Ataasunnguinneri'
          ]
        }
      ]
    }
  };

  const t = content[language] || content.en;

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold mb-2">{t.title}</h1>
        <p className="text-muted-foreground mb-8">{t.description}</p>

        {t.sections.map((section, idx) => (
          <div key={idx} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
            {section.text && <p className="text-muted-foreground mb-4">{section.text}</p>}
            {section.items && (
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}