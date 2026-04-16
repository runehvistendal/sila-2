import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Calendar, Users, Send, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { AnimatePresence, motion } from 'framer-motion';

const LOCATIONS = [
  'Nuuk', 'Ilulissat', 'Sisimiut', 'Aasiaat', 'Maniitsoq',
  'Tasiilaq', 'Nanortalik', 'Qaqortoq', 'Paamiut', 'Uummannaq',
];

export default function RequestCabinCTA() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const [form, setForm] = useState({
    location: '',
    check_in: '',
    check_out: '',
    guests: 2,
    note: '',
  });

  const mutation = useMutation({
    mutationFn: () =>
      base44.entities.CabinRequest.create({
        ...form,
        guests: Number(form.guests),
        guest_name: user.full_name || '',
        guest_email: user.email,
        status: 'pending',
      }),
    onSuccess: () => {
      qc.invalidateQueries(['my-cabin-requests']);
      setSent(true);
      toast({ title: t('request_sent_exclaim'), description: t('request_desc') });
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setForm({ location: '', check_in: '', check_out: '', guests: 2, note: '' });
      }, 2000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    if (!form.location || !form.check_in || !form.check_out) return;
    mutation.mutate();
  };

  return (
    <>
      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-8 my-12">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground mb-1">{t('cant_find_cabin_heading') || 'Kan du ikke finde din drømmehytte?'}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t('request_transport_desc')}</p>
            <Button onClick={() => setOpen(true)} className="bg-primary text-white hover:bg-primary/90 rounded-xl gap-2">
              <Send className="w-4 h-4" />
              {t('request_cabin_btn') || 'Anmod om hytte'}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => !sent && setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                {sent ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{t('request_sent_exclaim')}</h3>
                    <p className="text-sm text-muted-foreground">{t('request_desc')}</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-foreground mb-2">{t('request_cabin_btn') || 'Anmod om hytte'}</h2>
                      <p className="text-sm text-muted-foreground">{t('request_transport_desc')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Location */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">{t('location')}</label>
                        <Select value={form.location} onValueChange={v => setForm(f => ({ ...f, location: v }))}>
                          <SelectTrigger className="h-10 rounded-lg">
                            <SelectValue placeholder={t('select_destination')} />
                          </SelectTrigger>
                          <SelectContent>
                            {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {t('check_in')}
                          </label>
                          <Input type="date" value={form.check_in} onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))} className="h-10 rounded-lg" required min={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {t('check_out')}
                          </label>
                          <Input type="date" value={form.check_out} onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))} className="h-10 rounded-lg" required min={form.check_in} />
                        </div>
                      </div>

                      {/* Guests */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {t('guests')}
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          value={form.guests}
                          onChange={e => setForm(f => ({ ...f, guests: e.target.value }))}
                          className="h-10 rounded-lg"
                        />
                      </div>

                      {/* Note */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">{t('message_optional')}</label>
                        <Textarea
                          placeholder={t('describe_placeholder')}
                          value={form.note}
                          onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                          className="h-20 rounded-lg resize-none text-sm"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setOpen(false)}
                          className="flex-1 rounded-xl"
                        >
                          {t('cancel') || 'Annuller'}
                        </Button>
                        <Button
                          type="submit"
                          disabled={mutation.isPending || !form.location || !form.check_in || !form.check_out}
                          className="flex-1 bg-primary text-white rounded-xl font-semibold gap-2"
                        >
                          {mutation.isPending ? t('sending_dots') : (
                            <><Send className="w-4 h-4" /> {t('send_request')}</>
                          )}
                        </Button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}