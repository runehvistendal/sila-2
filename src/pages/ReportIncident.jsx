import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import IncidentReportForm from '@/components/safety/IncidentReportForm';
import { AlertTriangle, Phone, Mail } from 'lucide-react';

export default function ReportIncident() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: 'Report an Incident',
      subtitle: 'Your safety matters to us. Report unsafe behavior or policy violations.',
      urgent: 'Emergency?',
      emergencyText: 'If you\'re in immediate danger, please contact local authorities.',
      contact: 'Have questions?',
      contactEmail: 'support@sila.gl',
      contactPhone: '+299 XXXXXX'
    },
    da: {
      title: 'Rapportér en hændelse',
      subtitle: 'Din sikkerhed betyder meget for os. Rapportér usikker adfærd eller politikovertrædelser.',
      urgent: 'Nødsituation?',
      emergencyText: 'Hvis du er i umiddelbar fare, kontakt venligst de lokale myndigheder.',
      contact: 'Har du spørgsmål?',
      contactEmail: 'support@sila.gl',
      contactPhone: '+299 XXXXXX'
    },
    kl: {
      title: 'Inerniarneq Rapporterneq',
      subtitle: 'Kina inugujoq taperneq inerniarninni asigissarpoq. Ataasunnguinneri aput rapporterneq.',
      urgent: 'Alluugujoq?',
      emergencyText: 'Inugujoq alluugujorneq ineriallarnissua, silaannik ataasinnguut tullimat.',
      contact: 'Qujanaq?',
      contactEmail: 'support@sila.gl',
      contactPhone: '+299 XXXXXX'
    }
  };

  const t = content[language] || content.en;

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold mb-2">{t.title}</h1>
        <p className="text-muted-foreground mb-10">{t.subtitle}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">{t.urgent}</h3>
                <p className="text-sm text-red-700">{t.emergencyText}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="font-semibold text-blue-900 mb-4">{t.contact}</h3>
            <div className="space-y-2">
              <a href={`mailto:${t.contactEmail}`} className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900">
                <Mail className="w-4 h-4" />
                {t.contactEmail}
              </a>
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Phone className="w-4 h-4" />
                {t.contactPhone}
              </div>
            </div>
          </div>
        </div>

        <IncidentReportForm />
      </div>
    </div>
  );
}