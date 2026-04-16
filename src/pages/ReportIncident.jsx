import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import IncidentReportForm from '@/components/safety/IncidentReportForm';
import { AlertTriangle, Phone, Mail } from 'lucide-react';

export default function ReportIncident() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold mb-2">{t('incident_title')}</h1>
        <p className="text-muted-foreground mb-10">{t('incident_subtitle')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">{t('incident_urgent')}</h3>
                <p className="text-sm text-red-700">{t('incident_emergency_text')}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="font-semibold text-blue-900 mb-4">{t('incident_contact')}</h3>
            <div className="space-y-2">
              <a href="mailto:support@sila.gl" className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900">
                <Mail className="w-4 h-4" />
                support@sila.gl
              </a>
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Phone className="w-4 h-4" />
                +299 XXXXXX
              </div>
            </div>
          </div>
        </div>

        <IncidentReportForm />
      </div>
    </div>
  );
}