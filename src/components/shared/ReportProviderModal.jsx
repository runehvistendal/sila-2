import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Flag, X, CheckCircle2 } from 'lucide-react';

const CATEGORIES = {
  da: [
    { value: 'no_show', label: 'Udbyder mødte ikke op' },
    { value: 'false_description', label: 'Falsk/vildledende beskrivelse' },
    { value: 'inappropriate_behavior', label: 'Upassende adfærd' },
    { value: 'safety_concern', label: 'Sikkerhedsbekymring' },
  ],
  en: [
    { value: 'no_show', label: 'Provider did not show up' },
    { value: 'false_description', label: 'False/misleading description' },
    { value: 'inappropriate_behavior', label: 'Inappropriate behavior' },
    { value: 'safety_concern', label: 'Safety concern' },
  ],
  kl: [
    { value: 'no_show', label: 'Udbyder mødte ikke op' },
    { value: 'false_description', label: 'Falsk beskrivelse' },
    { value: 'inappropriate_behavior', label: 'Upassende adfærd' },
    { value: 'safety_concern', label: 'Sikkerhedsproblem' },
  ],
};

export default function ReportProviderModal({ providerEmail, providerName, onClose }) {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = CATEGORIES[lang] || CATEGORIES['da'];

  const handleSubmit = async () => {
    if (!category) return;
    setLoading(true);
    await base44.entities.IncidentReport.create({
      reporter_email: user?.email || 'anonym@sila.gl',
      incident_type: category === 'safety_concern' ? 'safety_concern' : 'other',
      description: `Kategori: ${category}. ${description}`,
      involved_parties: [providerEmail],
      status: 'open',
    });
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            <h2 className="text-lg font-bold text-foreground">
              {lang === 'en' ? 'Report provider' : 'Rapportér udbyder'}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-foreground mb-1">
              {lang === 'en' ? 'Report submitted' : 'Rapport indsendt'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {lang === 'en'
                ? 'Our team will review your report. A single report does not automatically penalize the provider — we look for patterns.'
                : 'Vores team gennemgår din rapport. En enkelt rapport medfører ikke automatisk sanktioner — vi kigger efter mønstre.'}
            </p>
            <Button onClick={onClose} className="rounded-xl">{lang === 'en' ? 'Close' : 'Luk'}</Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {lang === 'en'
                ? `Reporting: ${providerName || providerEmail}`
                : `Rapporterer: ${providerName || providerEmail}`}
            </p>

            <div className="space-y-2 mb-4">
              {categories.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                    category === c.value
                      ? 'border-destructive bg-destructive/5 text-foreground font-medium'
                      : 'border-border bg-white hover:border-destructive/30 text-muted-foreground'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                {lang === 'en' ? 'Additional details (optional)' : 'Yderligere detaljer (valgfrit)'}
              </label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="rounded-xl resize-none"
                placeholder={lang === 'en' ? 'Describe what happened...' : 'Beskriv hvad der skete...'}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
                {lang === 'en' ? 'Cancel' : 'Annuller'}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!category || loading}
                className="flex-1 rounded-xl bg-destructive text-white hover:bg-destructive/90"
              >
                {loading
                  ? (lang === 'en' ? 'Sending...' : 'Sender...')
                  : (lang === 'en' ? 'Submit report' : 'Indsend rapport')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}