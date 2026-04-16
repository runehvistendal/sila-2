import React, { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function IncidentReportForm() {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    reporter_email: '',
    incident_type: '',
    description: '',
    booking_id: '',
    involved_parties: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.entities.IncidentReport.create({
        ...form,
        involved_parties: form.involved_parties.split(',').map(e => e.trim()).filter(Boolean),
        status: 'open',
      });
      setSubmitted(true);
      toast({ title: t('incident_success') });
      setForm({ reporter_email: '', incident_type: '', description: '', booking_id: '', involved_parties: '' });
    } catch (err) {
      toast({ title: t('incident_error'), description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">{t('incident_report_submitted')}</h3>
        <p className="text-green-700 text-sm mb-6">{t('incident_success')}</p>
        <Button onClick={() => setSubmitted(false)} className="rounded-xl">{t('incident_submit_another')}</Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-8">
      <div className="flex items-start gap-4 mb-6">
        <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
        <div>
          <h2 className="text-2xl font-bold">{t('incident_form_title')}</h2>
          <p className="text-muted-foreground mt-1">{t('incident_form_subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">{t('incident_email')}</label>
          <Input
            type="email"
            value={form.reporter_email}
            onChange={(e) => setForm({ ...form, reporter_email: e.target.value })}
            required
            className="rounded-xl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t('incident_type')}</label>
          <Select value={form.incident_type} onValueChange={(v) => setForm({ ...form, incident_type: v })}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder={t('incident_select_type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="safety_concern">{t('incident_type_safety')}</SelectItem>
              <SelectItem value="harassment">{t('incident_type_harassment')}</SelectItem>
              <SelectItem value="fraud">{t('incident_type_fraud')}</SelectItem>
              <SelectItem value="property_damage">{t('incident_type_damage')}</SelectItem>
              <SelectItem value="other">{t('incident_type_other')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t('incident_description')}</label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            rows={4}
            className="rounded-xl resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t('incident_booking')}</label>
          <Input
            value={form.booking_id}
            onChange={(e) => setForm({ ...form, booking_id: e.target.value })}
            className="rounded-xl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t('incident_involved')}</label>
          <Textarea
            value={form.involved_parties}
            onChange={(e) => setForm({ ...form, involved_parties: e.target.value })}
            rows={2}
            className="rounded-xl resize-none"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 rounded-xl">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
          {t('incident_submit')}
        </Button>
      </form>
    </div>
  );
}