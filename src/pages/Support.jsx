import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageCircle, Send, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Support() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    subject: '',
    message: '',
    booking_id: '',
  });
  const [result, setResult] = useState(null);

  const mutation = useMutation({
    mutationFn: (data) =>
      base44.functions.invoke('processSupportInquiry', {
        customer_email: user?.email || 'guest@example.com',
        customer_name: user?.full_name || 'Guest',
        ...data,
      }),
    onSuccess: (res) => {
      setResult(res.data);
      setForm({ subject: '', message: '', booking_id: '' });
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
          <h1 className="text-2xl font-bold text-foreground mb-2">Customer Support</h1>
          <p className="text-muted-foreground">
            Get help with bookings, transport, cabins, and more. Our AI answers FAQs instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-6 shadow-card space-y-4">
              <div>
                <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">Subject</Label>
                <Input
                  placeholder="e.g., How do I cancel my booking?"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="rounded-lg"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">Message</Label>
                <Textarea
                  placeholder="Describe your issue or question..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="resize-none h-32 rounded-lg"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">
                  Booking ID <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  placeholder="If your inquiry is about a specific booking"
                  value={form.booking_id}
                  onChange={(e) => setForm({ ...form, booking_id: e.target.value })}
                  className="rounded-lg"
                />
              </div>

              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-primary text-white hover:bg-primary/90 rounded-lg h-11 gap-2 font-semibold"
              >
                {mutation.isPending ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Inquiry
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
                  <div
                    className={`rounded-2xl border p-6 ${
                      result.escalated
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-accent/10 border-accent/30'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      {result.escalated ? (
                        <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-1" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-1" />
                      )}
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {result.escalated ? 'Escalated to Admin' : 'AI Response'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {result.escalated
                            ? 'Your inquiry has been sent to our support team. You will receive a response soon.'
                            : 'Your inquiry has been answered below.'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-foreground whitespace-pre-line">{result.response}</p>
                    </div>

                    {result.booking_status && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                          Current Booking Status
                        </p>
                        <p className="text-sm font-medium text-foreground">{result.booking_status}</p>
                      </div>
                    )}

                    <Button
                      onClick={() => setResult(null)}
                      variant="outline"
                      className="w-full mt-4"
                    >
                      Ask Another Question
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* FAQ Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-border p-6 sticky top-24">
              <h3 className="font-bold text-foreground mb-4">Common Questions</h3>
              <div className="space-y-3 text-sm">
                {[
                  'How do I cancel a booking?',
                  'Can I modify my travel dates?',
                  'What payment methods are accepted?',
                  'How do I contact my provider?',
                  'What is your cancellation policy?',
                  'How do I report a safety issue?',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setForm({ ...form, subject: q })}
                    className="block text-left p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors text-xs leading-tight"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}