import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AskProviderQuestion
 * Props:
 *   providerEmail  — recipient
 *   listingId      — ID of the cabin or transport listing
 *   listingType    — 'cabin' | 'transport'
 */
export default function AskProviderQuestion({ providerEmail, listingId, listingType }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!question.trim()) return;
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    setSending(true);
    try {
      // Create a TransportRequest or CabinRequest as a message vehicle
      // We use the Message entity directly tied to a synthetic request id
      // Instead, we send via an inline SupportTicket to the provider email
      await base44.integrations.Core.SendEmail({
        to: providerEmail,
        subject: `Spørgsmål fra ${user.full_name || user.email}`,
        body: `
<p>Hej,</p>
<p><strong>${user.full_name || user.email}</strong> har stillet dig et spørgsmål om dit opslag på Sila (${listingType} — ID: ${listingId}):</p>
<blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555">${question}</blockquote>
<p>Svar direkte til: <a href="mailto:${user.email}">${user.email}</a></p>
<p style="color:#999;font-size:12px">Sila — arktiske oplevelser på lokale vilkår</p>
        `.trim(),
      });
      setSent(true);
      setQuestion('');
    } catch (err) {
      toast({ title: 'Fejl', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => { setOpen(!open); setSent(false); }}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{t('ask_provider_title')}</p>
          <p className="text-xs text-muted-foreground">{t('ask_provider_placeholder')}</p>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border pt-4">
              {sent ? (
                <div className="flex items-center gap-3 bg-accent/10 border border-accent/30 rounded-xl p-4">
                  <CheckCircle className="w-5 h-5 text-accent shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('ask_provider_sent')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('ask_provider_sent_desc')}</p>
                  </div>
                </div>
              ) : !user ? (
                <Button
                  onClick={() => base44.auth.redirectToLogin()}
                  className="w-full bg-primary text-white rounded-xl"
                >
                  {t('ask_provider_login')}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={t('ask_provider_placeholder')}
                    rows={3}
                    className="resize-none rounded-xl"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={sending || !question.trim()}
                    className="w-full bg-primary text-white hover:bg-primary/90 rounded-xl gap-2"
                  >
                    {sending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />{t('ask_provider_sending')}</>
                    ) : (
                      <><Send className="w-4 h-4" />{t('ask_provider_send')}</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}