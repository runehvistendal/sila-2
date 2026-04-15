import React, { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Download, Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const translations = {
  en: {
    title: 'Privacy & Data Center',
    description: 'Manage your personal data and privacy settings.',
    downloadTitle: 'Download Your Data',
    downloadDesc: 'Get a copy of all your personal data in JSON format.',
    downloadBtn: 'Download Data',
    deleteTitle: 'Delete Account',
    deleteDesc: 'Permanently delete your account and all associated data. This action cannot be undone.',
    deleteBtn: 'Delete Account',
    requestBtn: 'Request Deletion',
    deleteConfirm: 'This action is permanent and cannot be undone.',
    deleteReason: 'Why are you leaving?',
    deleteCancel: 'Cancel',
    deleteSent: 'Deletion request sent',
    deleteSentDesc: 'Check your email for confirmation link. You have 30 days to confirm.',
    emailPlaceholder: 'your@email.com',
    emailRequired: 'Email required',
    dataDownloaded: 'Data downloaded',
    error: 'Error',
  },
  da: {
    title: 'Privatlivs- og Datacenter',
    description: 'Administrer dine personlige data og privatlivsindstillinger.',
    downloadTitle: 'Download dine data',
    downloadDesc: 'Få en kopi af alle dine personlige data i JSON-format.',
    downloadBtn: 'Download data',
    deleteTitle: 'Slet konto',
    deleteDesc: 'Slet din konto og alle tilknyttede data permanent. Denne handling kan ikke fortrydes.',
    deleteBtn: 'Slet konto',
    requestBtn: 'Anmod om sletning',
    deleteConfirm: 'Denne handling er permanent og kan ikke fortrydes.',
    deleteReason: 'Hvorfor forlader du?',
    deleteCancel: 'Annuller',
    deleteSent: 'Sletningsanmodning sendt',
    deleteSentDesc: 'Tjek din e-mail for bekræftelseslink. Du har 30 dage til at bekræfte.',
    emailPlaceholder: 'your@email.com',
    emailRequired: 'Email påkrævet',
    dataDownloaded: 'Data downloadet',
    error: 'Fejl',
  },
  kl: {
    title: 'Inugujoq & Erfarnera Sikkernut',
    description: 'Inugujoq majoq iluaasigineqq',
    downloadTitle: 'Erfarnera naajunnili',
    downloadDesc: 'Inugujoq majoq kopiallarnarniartarpoq JSON attumarissusumik.',
    downloadBtn: 'Erfarnera naajunnili',
    deleteTitle: 'Konto aallarninnili',
    deleteDesc: 'Konto inugujoq majoq qanuraallu aaqqiniartu aallarninnili. Inugujoq taamaannik naliveqarsinnaavigippaa.',
    deleteBtn: 'Konto aallarninnili',
    requestBtn: 'Aallarnivinnilassusuk',
    deleteConfirm: 'Inugujoq taamaannik naliveqarsinnaavigippaa.',
    deleteReason: 'Mittarniarlariartarpiit?',
    deleteCancel: 'Naleqq',
    deleteSent: 'Aallarnivinnilassusuk naatsumik naajuffiffia',
    deleteSentDesc: 'E-mail inernerata naatumerinerpaassua. Ulloq 30-a asigissarnikuartarpoq.',
    emailPlaceholder: 'your@email.com',
    emailRequired: 'Email inugujoq',
    dataDownloaded: 'Erfarnera naammagalaarpoq',
    error: 'Alluugujoq',
  },
};

export default function PrivacyCenter() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteRequestSent, setDeleteRequestSent] = useState(false);

  const handleDownloadData = async () => {
    if (!email) {
      toast({ title: t.emailRequired });
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('downloadUserData', { email });
      const link = document.createElement('a');
      link.href = 'data:application/json,' + encodeURIComponent(JSON.stringify(response.data));
      link.download = `sila-data-${email}-${Date.now()}.json`;
      link.click();
      toast({ title: t.dataDownloaded });
    } catch (err) {
      toast({ title: t.error, description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!email) {
      toast({ title: t.emailRequired });
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('requestAccountDeletion', { email, reason: deleteReason });
      setDeleteRequestSent(true);
      setShowDeleteConfirm(false);
      toast({ title: t.deleteSent });
    } catch (err) {
      toast({ title: t.error, description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
        <p className="text-muted-foreground mb-8">{t.description}</p>

        {/* Download Data Section */}
        <div className="bg-white rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-2">{t.downloadTitle}</h2>
              <p className="text-sm text-muted-foreground mb-4">{t.downloadDesc}</p>
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl"
                />
                <Button
                  onClick={handleDownloadData}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 rounded-xl"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                  {t.downloadBtn}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Account Section */}
        <div className="bg-white rounded-2xl border border-destructive/30 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-2">{t.deleteTitle}</h2>
              <p className="text-sm text-muted-foreground mb-4">{t.deleteDesc}</p>

              {deleteRequestSent ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 text-sm">{t.deleteSent}</p>
                    <p className="text-xs text-green-700 mt-1">{t.deleteSentDesc}</p>
                  </div>
                </div>
              ) : showDeleteConfirm ? (
                <div className="space-y-4 bg-destructive/5 rounded-xl p-4 border border-destructive/20">
                  <div className="flex gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                    <p className="text-sm font-semibold text-destructive">{t.deleteConfirm}</p>
                  </div>
                  <Textarea
                    placeholder={t.deleteReason}
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="rounded-xl h-24 resize-none"
                  />
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-xl">
                      {t.deleteCancel}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRequestDeletion}
                      disabled={loading}
                      className="flex-1 rounded-xl"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                      {t.deleteBtn}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/5 rounded-xl w-full"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  {t.requestBtn}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}