import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Users, Heart, AlertCircle, Handshake } from 'lucide-react';

export default function CommunityGuidelines() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: 'Community Guidelines',
      intro: 'Help us maintain a respectful and safe community for everyone.',
      guidelines: [
        {
          icon: Heart,
          title: 'Be Respectful',
          desc: 'Treat all community members with kindness and respect, regardless of background.'
        },
        {
          icon: Handshake,
          title: 'Keep Your Word',
          desc: 'Honor your bookings and commitments. Cancellations must follow platform policies.'
        },
        {
          icon: AlertCircle,
          title: 'Report Issues',
          desc: 'If you witness unsafe behavior or violations, report them immediately.'
        },
        {
          icon: Users,
          title: 'Be Authentic',
          desc: 'Use your real name and provide accurate information in your profile.'
        }
      ],
      violations: [
        'Harassment, discrimination, or hate speech',
        'Fraudulent bookings or payments',
        'Dangerous behavior or safety violations',
        'Inappropriate or explicit content',
        'Spam or commercial advertising'
      ]
    },
    da: {
      title: 'Samfundsvejledninger',
      intro: 'Hjælp os med at vedligeholde et respektfuldt og sikkert fællesskab for alle.',
      guidelines: [
        {
          icon: Heart,
          title: 'Vær respektfuld',
          desc: 'Behandl alle medlemmer af fællesskabet med venlighed og respekt.'
        },
        {
          icon: Handshake,
          title: 'Hold dine løfter',
          desc: 'Overhold dine bookinger og forpligtelser. Aflysninger skal følge platformens politikker.'
        },
        {
          icon: AlertCircle,
          title: 'Rapportér problemer',
          desc: 'Hvis du ser usikker adfærd eller overtrædelser, rapportér det øjeblikkeligt.'
        },
        {
          icon: Users,
          title: 'Vær autentisk',
          desc: 'Brug dit rigtige navn og giv nøjagtig information i din profil.'
        }
      ],
      violations: [
        'Chikane, diskrimination eller hadtale',
        'Svigagtige bookinger eller betalinger',
        'Farlig adfærd eller sikkerhedsovertrædelser',
        'Upassende eller eksplicit indhold',
        'Spam eller kommerciel annoncering'
      ]
    },
    kl: {
      title: 'Inerniarner Ataasinnguuq',
      intro: 'Atoriarrinillarmu inerniarner taperneq ajunngipeq.',
      guidelines: [
        {
          icon: Heart,
          title: 'Ataasinnguuq Aput',
          desc: 'Inerniarner ataasinnguuq aput ajunngipeq.'
        },
        {
          icon: Handshake,
          title: 'Qujanaq Aput',
          desc: 'Inerniarnermi qujanaq ajunngipeq ajunaerpugut.'
        },
        {
          icon: AlertCircle,
          title: 'Ataasunnguinneri Ataasinnguuq',
          desc: 'Inerniarneq ataasunnguinneri ataasinnguuq asigissarneri.'
        },
        {
          icon: Users,
          title: 'Qujanaq Isumalioq',
          desc: 'Ataa isumalioq qujanaq inugujoq ataasinnguuq.'
        }
      ],
      violations: [
        'Ataasunnguinneri inerniarner',
        'Taatsinngisoq inerniarnermi',
        'Inugujoq ataasunnguinneri',
        'Inerniarner ataasunnguinneri',
        'Ataasinnguuq asigissarneri'
      ]
    }
  };

  const t = content[language] || content.en;

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold mb-4">{t.title}</h1>
        <p className="text-lg text-muted-foreground mb-12">{t.intro}</p>

        <h2 className="text-2xl font-semibold mb-8">
          {language === 'en' ? 'Core Principles' : language === 'da' ? 'Kerneprincipper' : 'Inerniarner Asigissarneq'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {t.guidelines.map((guideline, idx) => {
            const Icon = guideline.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl border border-border p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{guideline.title}</h3>
                    <p className="text-sm text-muted-foreground">{guideline.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h3 className="font-semibold text-red-900 mb-4">
            {language === 'en' ? 'Prohibited Behavior' : language === 'da' ? 'Forbudt adfærd' : 'Ataasunnguinneri Aput'}
          </h3>
          <ul className="space-y-2">
            {t.violations.map((violation, idx) => (
              <li key={idx} className="flex items-start gap-3 text-red-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{violation}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}