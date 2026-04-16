import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Shield, CheckCircle, AlertTriangle, BookOpen } from 'lucide-react';

export default function VerifiedSafety() {
  const { lang } = useLanguage();

  const content = {
    en: {
      title: 'Verified Safety Standards',
      intro: 'Sila is committed to ensuring all travelers and hosts maintain the highest safety standards.',
      requirements: [
        {
          icon: Shield,
          title: 'Life Jackets',
          desc: 'All boat transports must provide Coast Guard-approved life jackets for every passenger.'
        },
        {
          icon: BookOpen,
          title: 'Safety Briefing',
          desc: 'Hosts and providers must conduct safety briefings before trips.'
        },
        {
          icon: CheckCircle,
          title: 'Equipment Inspection',
          desc: 'Regular safety equipment inspections are required.'
        },
        {
          icon: AlertTriangle,
          title: 'Incident Reporting',
          desc: 'All safety incidents must be reported within 24 hours.'
        }
      ]
    },
    da: {
      title: 'Certificerede sikkerhedsstandarder',
      intro: 'Sila er dedikeret til at sikre, at alle rejsende og værter opretholder de højeste sikkerhedsstandarder.',
      requirements: [
        {
          icon: Shield,
          title: 'Redningsveste',
          desc: 'Alle båd transporter skal have kystvagts-godkendte redningsveste for hver passager.'
        },
        {
          icon: BookOpen,
          title: 'Sikkerhedsbriefing',
          desc: 'Værter og udbydere skal afholde sikkerhedsbriefinger før ture.'
        },
        {
          icon: CheckCircle,
          title: 'Udstyrskontrol',
          desc: 'Regelmæssige sikkerhedsudstyrskontroller er påkrævet.'
        },
        {
          icon: AlertTriangle,
          title: 'Hændelsesrapportering',
          desc: 'Alle sikkerhedshændelser skal rapporteres inden 24 timer.'
        }
      ]
    },
    kl: {
      title: 'Inugujoq Taperneq',
      intro: 'Sila atoriarrinillarmu inugujoq taperneq nanlerneq ajunngipeq.',
      requirements: [
        {
          icon: Shield,
          title: 'Redningsveste',
          desc: 'Ataasinnguuq tuupeq inugujoq taperneq inerniarinermi.'
        },
        {
          icon: BookOpen,
          title: 'Inugujoq Ataasinnguuq',
          desc: 'Ataasinnguuq inerniarinermi asigissarnikuartarpoq.'
        },
        {
          icon: CheckCircle,
          title: 'Taperneq Ataasinnguuq',
          desc: 'Taperneq ataasinnguuq kalaallinik asigissarneri inugujoq.'
        },
        {
          icon: AlertTriangle,
          title: 'Inerniarneq Ataasunnguinneri',
          desc: 'Inerniarneq ataasunnguinneri 24-imi ataasunnguinneri.'
        }
      ]
    }
  };

  const c = content[lang] || content.en;

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold mb-4">{c.title}</h1>
        <p className="text-lg text-muted-foreground mb-12">{c.intro}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {c.requirements.map((req, idx) => {
            const Icon = req.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl border border-border p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{req.title}</h3>
                    <p className="text-sm text-muted-foreground">{req.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}