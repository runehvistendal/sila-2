import React, { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Download, Trash2, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function PrivacyCenter() {
  const { t, language } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteRequestSent, setDeleteRequestSent] = useState(false);

  const handleDownloadData = async () => {
    if (!email) {
      toast({ title: language === 'en' ? 'Email required' : language === 'da' ? 'Email påkrævet' : 'Email inugujoq' });
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('downloadUserData', { email });
      // Trigger download
      const link = document.createElement('a');
      link.href = 'data:application/json,' + encodeURIComponent(JSON.stringify(response.data));
      link.download = `sila-data-${email}-${Date.now()}.json`;
      link.click();
      toast({ title: language === 'en' ? 'Data downloaded' : language === 'da' ? 'Data downloadet' : 'Erfarnera naammagalaarpoq' });
    } catch (err) {
      toast({ title: language === 'en' ? 'Error' : language === 'da' ? 'Fejl' : 'Alluugujoq', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!email) {
      toast({ title: language === 'en' ? 'Email required' : language === 'da' ? 'Email påkrævet' : 'Email inugujoq' });
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('requestAccountDeletion', { email, reason: deleteReason });
      setDeleteRequestSent(true);
      setShowDeleteConfirm(false);
      toast({ title: language === 'en' ? 'Deletion request sent' : language === 'da' ? 'Sletningsanmodning sendt' : 'Aallarnivinnilassusuk naatsumik naajuffiffia' });
    } catch (err) {
      toast({ title: language === 'en' ? 'Error' : language === 'da' ? 'Fejl' : 'Alluugujoq', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">
          {language === 'en' ? 'Privacy & Data Center' : language === 'da' ? 'Privatlivs- og Datacenter' : 'Inugujoq & Erfarnera Sikkernut'}
        </h1>
        <p className="text-muted-foreground mb-8">
          {language === 'en'
            ? 'Manage your personal data and privacy settings.'
            : language === 'da'
            ? 'Administrer dine personlige data og privatlivsindstillinger.'
            : 'Inugujoq majoq iluaasigineqq'}
        </p>

        {/* Download Data Section */}
        <div className="bg-white rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-2">
                {language === 'en' ? 'Download Your Data' : language === 'da' ? 'Download dine data' : 'Erfarnera naajunnili'}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {language === 'en'
                  ? 'Get a copy of all your personal data in JSON format.'
                  : language === 'da'
                  ? 'Få en kopi af alle dine personlige data i JSON-format.'
                  : 'Inugujoq majoq kopiallarnarniartarpoq JSON attumarissusumik.'}
              </p>
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="your@email.com"
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
                  {language === 'en' ? 'Download Data' : language === 'da' ? 'Download data' : 'Erfarnera naajunnili'}
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
              <h2 className="text-lg font-semibold mb-2">
                {language === 'en' ? 'Delete Account' : language === 'da' ? 'Slet konto' : 'Konto aallarninnili'}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {language === 'en'
                  ? 'Permanently delete your account and all associated data. This action cannot be undone.'
                  : language === 'da'
                  ? 'Slet din konto og alle tilknyttede data permanent. Denne handling kan ikke fortrydes.'
                  : 'Konto inugujoq majoq qanuraallu aaqqiniartu aallarninnili. Inugujoq taamaannik naliveqarsinnaavigippaa.'}
              </p>

              {deleteRequestSent ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 text-sm">
                      {language === 'en'
                        ? 'Deletion request sent'
                        : language === 'da'
                        ? 'Sletningsanmodning sendt'
                        : 'Aallarnivinnilassusuk naatsumik naajuffiffia'}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      {language === 'en'
                        ? 'Check your email for confirmation link. You have 30 days to confirm.'
                        : language === 'da'
                        ? 'Tjek din e-mail for bekræftelseslink. Du har 30 dage til at bekræfte.'
                        : 'E-mail inernerata naatumerinerpaassua. Ulloq 30-a asigissarnikuartarpoq.'}
                    </p>
                  </div>
                </div>
              ) : showDeleteConfirm ? (
                <div className="space-y-4 bg-destructive/5 rounded-xl p-4 border border-destructive/20">
                  <div className="flex gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                    <p className="text-sm font-semibold text-destructive">
                      {language === 'en'
                        ? 'This action is permanent and cannot be undone.'
                        : language === 'da'
                        ? 'Denne handling er permanent og kan ikke fortrydes.'
                        : 'Inugujoq taamaannik naliveqarsinnaavigippaa.'}
                    </p>
                  </div>
                  <Textarea
                    placeholder={language === 'en' ? 'Why are you leaving?' : language === 'da' ? 'Hvorfor forlader du?' : 'Mittarniarlariartarpiit?'}
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="rounded-xl h-24 resize-none"
                  />
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-xl">
                      {language === 'en' ? 'Cancel' : language === 'da' ? 'Annuller' : 'Naleqq'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRequestDeletion}
                      disabled={loading}
                      className="flex-1 rounded-xl"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                      {language === 'en' ? 'Delete Account' : language === 'da' ? 'Slet konto' : 'Konto aallarninnili'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/5 rounded-xl w-full"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  {language === 'en' ? 'Request Deletion' : language === 'da' ? 'Anmod om sletning' : 'Aallarnivinnilassusuk'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}