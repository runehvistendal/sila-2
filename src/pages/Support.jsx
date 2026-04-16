import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, CheckCircle, AlertCircle, Loader, ShieldAlert, Paperclip, X, ChevronDown } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const FAQ_QUESTIONS = [
  { value: 'Hvordan annullerer jeg en booking?', label: 'Hvordan annullerer jeg en booking?' },
  { value: 'Kan jeg ændre mine rejsedatoer?', label: 'Kan jeg ændre mine rejsedatoer?' },
  { value: 'Hvilke betalingsmetoder accepteres?', label: 'Hvilke betalingsmetoder accepteres?' },
  { value: 'Hvordan kontakter jeg min udbyder?', label: 'Hvordan kontakter jeg min udbyder?' },
  { value: 'Hvad er jeres afbestillingspolitik?', label: 'Hvad er jeres afbestillingspolitik?' },
  { value: 'Hvordan rapporterer jeg et sikkerhedsproblem?', label: 'Hvordan rapporterer jeg et sikkerhedsproblem?' },
  { value: 'Jeg har ikke modtaget en bekræftelsesmail', label: 'Jeg har ikke modtaget en bekræftelsesmail' },
  { value: 'Jeg vil oprette et opslag som udbyder', label: 'Jeg vil oprette et opslag som udbyder' },
  { value: 'Andet (beskriv manuelt)', label: 'Andet — skriv selv...' },
];

const FAQ_ANSWERS = {
  'Hvordan annullerer jeg en booking?': 'Du kan annullere en booking fra dit dashboard under "Mine bookinger". Find den relevante booking og klik på "Annuller". Bemærk at vores afbestillingspolitik gælder — kontakt os på support@sila.gl hvis du har spørgsmål til refundering.',
  'Kan jeg ændre mine rejsedatoer?': 'Datoer kan ikke ændres direkte. Du skal annullere den eksisterende booking og oprette en ny. Kontakt udbyderen direkte via chat, da de muligvis kan hjælpe med en fleksibel løsning.',
  'Hvilke betalingsmetoder accepteres?': 'Vi accepterer alle større kreditkort (Visa, Mastercard, American Express) via Stripe. Betaling sker sikkert online — vi gemmer ikke kortoplysninger.',
  'Hvordan kontakter jeg min udbyder?': 'Gå til dit dashboard og find din booking eller forespørgsel. Herfra kan du åbne chatten med udbyderen direkte.',
  'Hvad er jeres afbestillingspolitik?': 'Afbestillingsbetingelserne varierer pr. udbyder og er synlige på hvert opslag inden booking. Ved tvivl — kontakt os på support@sila.gl.',
  'Hvordan rapporterer jeg et sikkerhedsproblem?': 'Brug vores hændelsesrapport-formular under Support → "Rapportér en hændelse", eller skriv direkte til support@sila.gl. Alvorlige situationer: kontakt lokale myndigheder.',
  'Jeg har ikke modtaget en bekræftelsesmail': 'Tjek din spam-mappe. Mailen sendes fra no-reply@sila.gl. Har du stadig ikke modtaget den efter 10 minutter, så kontakt os med dit booking-ID.',
  'Jeg vil oprette et opslag som udbyder': 'Log ind og gå til Dashboard → "Nyt opslag". Du kan oprette hytteophold eller bådruter. Har du spørgsmål til onboarding, er du velkommen til at skrive til os.',
};

export default function Support() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    message: '',
    booking_id: '',
  });
  const [result, setResult] = useState(null);

  const handleSubjectSelect = (value) => {
    setSelectedSubject(value);
    if (value === 'Andet (beskriv manuelt)') {
      setForm({ ...form, subject: '' });
      setFaqAnswer('');
    } else {
      setForm({ ...form, subject: value });
      setFaqAnswer(FAQ_ANSWERS[value] || '');
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return { name: file.name, url: file_url };
        })
      );
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch {
      toast({ title: 'Fejl ved upload af fil', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const mutation = useMutation({
    mutationFn: (data) =>
      base44.functions.invoke('submitSupportTicket', {
        email: user?.email || '',
        name: user?.full_name || '',
        ...data,
        attachments: attachments.map((a) => a.url),
      }),
    onSuccess: (res) => {
      setResult({ success: true, message: res.data.message });
      setForm({ subject: '', message: '', booking_id: '' });
      setAttachments([]);
      setSelectedSubject('');
      setFaqAnswer('');
    },
    onError: () => {
      toast({ title: 'Error submitting inquiry', description: 'Please try again' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.subject || !form.message) {
      toast({ title: 'Please fill in all fields' });
      return;
    }
    mutation.mutate(form);
  };

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <MessageCircle className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Kundesupport</h1>
          <p className="text-muted-foreground">
            Få hjælp til bookinger, transport, hytter og mere.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-4">

            {/* FAQ Answer */}
            <AnimatePresence>
              {faqAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-accent/10 border border-accent/30 rounded-2xl p-5"
                >
                  <p className="text-xs font-semibold text-accent uppercase mb-2">Svar på dit spørgsmål</p>
                  <p className="text-sm text-foreground leading-relaxed">{faqAnswer}</p>
                  <p className="text-xs text-muted-foreground mt-3">Hjalp dette ikke? Udfyld formularen nedenfor.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-6 shadow-card space-y-4">
              <div>
                <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">Emne</Label>
                <Select value={selectedSubject} onValueChange={handleSubjectSelect}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Vælg et spørgsmål..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FAQ_QUESTIONS.map((q) => (
                      <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSubject === 'Andet (beskriv manuelt)' && (
                <div>
                  <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">Beskriv dit emne</Label>
                  <Input
                    placeholder="Skriv dit spørgsmål eller emne her..."
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="rounded-lg"
                  />
                </div>
              )}

              <div>
                <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">Besked</Label>
                <Textarea
                  placeholder="Beskriv dit problem eller spørgsmål..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="resize-none h-32 rounded-lg"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">
                  Booking ID <span className="text-muted-foreground font-normal">(valgfrit)</span>
                </Label>
                <Input
                  placeholder="Hvis din henvendelse handler om en specifik booking"
                  value={form.booking_id}
                  onChange={(e) => setForm({ ...form, booking_id: e.target.value })}
                  className="rounded-lg"
                />
              </div>

              {/* File attachments */}
              <div>
                <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">
                  Vedhæft filer <span className="text-muted-foreground font-normal">(valgfrit)</span>
                </Label>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 text-sm text-primary border border-dashed border-primary/40 rounded-lg px-4 py-2.5 hover:bg-primary/5 transition-colors w-full justify-center"
                >
                  {uploading ? <Loader className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                  {uploading ? 'Uploader...' : 'Vælg filer at vedhæfte'}
                </button>
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {attachments.map((file, i) => (
                      <div key={i} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2 text-sm">
                        <span className="text-foreground truncate max-w-[85%]">{file.name}</span>
                        <button type="button" onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-destructive">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-primary text-white hover:bg-primary/90 rounded-lg h-11 gap-2 font-semibold"
              >
                {mutation.isPending ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Sender...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send henvendelse
                  </>
                )}
              </Button>
            </form>

            {/* Response */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-6"
                >
                  <div className="rounded-2xl border border-accent/30 bg-accent/10 p-6">
                   <div className="flex items-start gap-3 mb-4">
                     <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-1" />
                     <div>
                       <h3 className="font-semibold text-foreground">Inquiry Received</h3>
                       <p className="text-sm text-muted-foreground mt-1">
                         Your message has been received and saved. Our support team will respond to your inquiry at support@sila.gl within 24 hours.
                       </p>
                     </div>
                   </div>

                    <div className="bg-white rounded-lg p-4">
                            <p className="text-sm text-foreground">{result.message}</p>
                          </div>

                          <Button
                            onClick={() => setResult(null)}
                            variant="outline"
                            className="w-full mt-4"
                          >
                            Send en ny henvendelse
                          </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* FAQ Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-border p-6 sticky top-24">
              <h3 className="font-bold text-foreground mb-4">Ofte stillede spørgsmål</h3>
              <div className="space-y-2 text-sm">
                {FAQ_QUESTIONS.filter((q) => q.value !== 'Andet (beskriv manuelt)').map((q) => (
                  <button
                    key={q.value}
                    onClick={() => handleSubjectSelect(q.value)}
                    className={`block text-left w-full p-2 rounded-lg transition-colors text-xs leading-tight ${
                      selectedSubject === q.value
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-primary hover:bg-primary/10'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Report Section */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-5">
          <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-foreground text-lg mb-1">Rapportér en hændelse</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Har du oplevet en sikkerhedsmæssig bekymring, chikane, svindel eller en anden alvorlig hændelse i forbindelse med en booking eller transport? Du kan indgive en fortrolig rapport til Sila, og vores team vil behandle den hurtigst muligt.
            </p>
            <Link to="/report-incident">
              <Button variant="destructive" className="gap-2 rounded-xl">
                <ShieldAlert className="w-4 h-4" />
                Indgiv en hændelsesrapport
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}