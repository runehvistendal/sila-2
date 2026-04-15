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
  const { language } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    reporter_email: '',
    incident_type: '',
    description: '',
    booking_id: '',
    involved_parties: '',
  });

  const labels = {
    en: {
      title: 'Report an Incident',
      email: 'Your Email',
      type: 'Incident Type',
      description: 'Description',
      booking: 'Booking ID (optional)',
      involved: 'Involved Parties (emails, comma-separated)',
      submit: 'Submit Report',
      success: 'Incident reported successfully. Our team will review and contact you within 24 hours.',
      error: 'Error submitting report',
    },
    da: {
      title: 'Rapportér en hændelse',
      email: 'Din e-mail',
      type: 'Hændelses type',
      description: 'Beskrivelse',
      booking: 'Booking ID (valgfrit)',
      involved: 'Involverede parter (e-mails, komma-adskilt)',
      submit: 'Indsend rapport',
      success: 'Hændelse rapporteret med succes. Vores team vil gennemgå og kontakte dig inden 24 timer.',
      error: 'Fejl ved indsendelse af rapport',
    },
    kl: {
      title: 'Inerniarneq Rapporterneq',
      email: 'Kina E-mail',
      type: 'Inerniarneq Taqqaq',
      description: 'Inugujoq',
      booking: 'Booking ID (uugujoq)',
      involved: 'Ataasinnguut (e-mails, komma-asigissarneq)',
      submit: 'Rapporterneq Iluaasigneri',
      success: 'Inerniarneq rapporterneq alluunnik. Team-ip ataasunnguinneri 24-imi naatsumenera asigissarpoq.',
      error: 'Alluugujoq rapporterneq iluaasigineqq',
    }
  };

  const t = labels[language] || labels.en;

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
      toast({ title: t.success });
      setForm({ reporter_email: '', incident_type: '', description: '', booking_id: '', involved_parties: '' });
    } catch (err) {
      toast({ title: t.error, description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">{language === 'en' ? 'Report Submitted' : language === 'da' ? 'Rapport indsendt' : 'Rapporterneq iluaasigineqq'}</h3>
        <p className="text-green-700 text-sm mb-6">{t.success}</p>
        <Button onClick={() => setSubmitted(false)} className="rounded-xl">{language === 'en' ? 'Submit Another' : language === 'da' ? 'Indsend en anden' : 'Inuugujoq Rapporterneq'}</Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-8">
      <div className="flex items-start gap-4 mb-6">
        <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
        <div>
          <h2 className="text-2xl font-bold">{t.title}</h2>
          <p className="text-muted-foreground mt-1">{language === 'en' ? 'Help us maintain safety' : language === 'da' ? 'Hjælp os med at opretholde sikkerhed' : 'Inugujoq taperneq ajunnginneri'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">{t.email}</label>
          <Input
            type="email"
            value={form.reporter_email}
            onChange={(e) => setForm({ ...form, reporter_email: e.target.value })}
            required
            className="rounded-xl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t.type}</label>
          <Select value={form.incident_type} onValueChange={(v) => setForm({ ...form, incident_type: v })}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder={language === 'en' ? 'Select type' : language === 'da' ? 'Vælg type' : 'Taqqaq uugujoq'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="safety_concern">{language === 'en' ? 'Safety Concern' : language === 'da' ? 'Sikkerhedsproblemer' : 'Inugujoq'}</SelectItem>
              <SelectItem value="harassment">{language === 'en' ? 'Harassment' : language === 'da' ? 'Chikane' : 'Ataasunnguinneri'}</SelectItem>
              <SelectItem value="fraud">{language === 'en' ? 'Fraud' : language === 'da' ? 'Bedrageri' : 'Taatsinngisoq'}</SelectItem>
              <SelectItem value="property_damage">{language === 'en' ? 'Property Damage' : language === 'da' ? 'Ejendomsskade' : 'Pilersuaq Alluugujoq'}</SelectItem>
              <SelectItem value="other">{language === 'en' ? 'Other' : language === 'da' ? 'Andet' : 'Inuugujoq'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t.description}</label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            rows={4}
            className="rounded-xl resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t.booking}</label>
          <Input
            value={form.booking_id}
            onChange={(e) => setForm({ ...form, booking_id: e.target.value })}
            className="rounded-xl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t.involved}</label>
          <Textarea
            value={form.involved_parties}
            onChange={(e) => setForm({ ...form, involved_parties: e.target.value })}
            rows={2}
            className="rounded-xl resize-none"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 rounded-xl">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
          {t.submit}
        </Button>
      </form>
    </div>
  );
}