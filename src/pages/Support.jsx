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

const FAQ_KEYS = ['faq_q1','faq_q2','faq_q3','faq_q4','faq_q5','faq_q6','faq_q7','faq_q8'];
const FAQ_ANSWER_KEYS = { faq_q1:'faq_a1', faq_q2:'faq_a2', faq_q3:'faq_a3', faq_q4:'faq_a4', faq_q5:'faq_a5', faq_q6:'faq_a6', faq_q7:'faq_a7', faq_q8:'faq_a8' };

export default function Support() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);
  const [selectedKey, setSelectedKey] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    message: '',
    booking_id: '',
  });
  const [result, setResult] = useState(null);

  const faqQuestions = FAQ_KEYS.map(k => ({ key: k, label: t(k) }));

  const handleSubjectSelect = (value) => {
    setSelectedKey(value);
    if (value === 'other') {
      setForm({ ...form, subject: '' });
      setFaqAnswer('');
    } else {
      setForm({ ...form, subject: t(value) });
      const answerKey = FAQ_ANSWER_KEYS[value];
      setFaqAnswer(answerKey ? t(answerKey) : '');
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
      toast({ title: t('support_upload_error'), variant: 'destructive' });
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
      setSelectedKey('');
      setFaqAnswer('');
    },
    onError: () => {
      toast({ title: t('support_fill_fields') });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.subject || !form.message) {
      toast({ title: t('support_fill_fields') });
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
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('support_title')}</h1>
          <p className="text-muted-foreground">{t('support_subtitle')}</p>
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
                  <p className="text-xs font-semibold text-accent uppercase mb-2">{t('support_faq_answer_heading')}</p>
                  <p className="text-sm text-foreground leading-relaxed">{faqAnswer}</p>
                  <p className="text-xs text-muted-foreground mt-3">{t('support_faq_didnt_help')}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-6 shadow-card space-y-4">
              <div>
                <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">{t('support_subject_label')}</Label>
                <Select value={selectedKey} onValueChange={handleSubjectSelect}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder={t('support_subject_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {faqQuestions.map((q) => (
                      <SelectItem key={q.key} value={q.key}>{q.label}</SelectItem>
                    ))}
                    <SelectItem value="other">{t('faq_other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedKey === 'other' && (
                <div>
                  <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">{t('support_custom_subject_label')}</Label>
                  <Input
                    placeholder={t('support_custom_subject_placeholder')}
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="rounded-lg"
                  />
                </div>
              )}

              <div>
                <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">{t('support_message_label')}</Label>
                <Textarea
                  placeholder={t('support_message_placeholder')}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="resize-none h-32 rounded-lg"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">
                  {t('support_booking_id_label')} <span className="text-muted-foreground font-normal">{t('support_booking_id_optional')}</span>
                </Label>
                <Input
                  placeholder={t('support_booking_id_placeholder')}
                  value={form.booking_id}
                  onChange={(e) => setForm({ ...form, booking_id: e.target.value })}
                  className="rounded-lg"
                />
              </div>

              {/* File attachments */}
              <div>
                <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">
                  {t('support_attachments_label')} <span className="text-muted-foreground font-normal">{t('support_attachments_optional')}</span>
                </Label>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 text-sm text-primary border border-dashed border-primary/40 rounded-lg px-4 py-2.5 hover:bg-primary/5 transition-colors w-full justify-center"
                >
                  {uploading ? <Loader className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                  {uploading ? t('support_uploading') : t('support_attach_files')}
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
                    {t('support_sending')}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t('support_send_btn')}
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
                       <h3 className="font-semibold text-foreground">{t('support_received_title')}</h3>
                         <p className="text-sm text-muted-foreground mt-1">{t('support_received_desc')}</p>
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
                            {t('support_new_inquiry')}
                          </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* FAQ Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-border p-6 sticky top-24">
              <h3 className="font-bold text-foreground mb-4">{t('support_faq_title')}</h3>
              <div className="space-y-2 text-sm">
                {faqQuestions.map((q) => (
                  <button
                    key={q.key}
                    onClick={() => handleSubjectSelect(q.key)}
                    className={`block text-left w-full p-2 rounded-lg transition-colors text-xs leading-tight ${
                      selectedKey === q.key
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
            <h2 className="font-bold text-foreground text-lg mb-1">{t('support_incident_title')}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t('support_incident_desc')}</p>
            <Link to="/report-incident">
              <Button variant="destructive" className="gap-2 rounded-xl">
                <ShieldAlert className="w-4 h-4" />
                {t('support_incident_btn')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}