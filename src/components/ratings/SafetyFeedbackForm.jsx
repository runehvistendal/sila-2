import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function SafetyFeedbackForm({ bookingId, guestEmail, providerEmail, onSubmitted }) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    life_vests_offered: null,
    equipment_visible: null,
    felt_safe: null,
    additional_comments: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.life_vests_offered === null || form.equipment_visible === null || form.felt_safe === null) {
      toast({ title: 'Fejl', description: 'Besvar venligst alle spørgsmål' });
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.functions.invoke('processSafetyFeedback', {
        booking_id: bookingId,
        guest_email: guestEmail,
        provider_email: providerEmail,
        life_vests_offered: form.life_vests_offered,
        equipment_visible: form.equipment_visible,
        felt_safe: form.felt_safe,
        additional_comments: form.additional_comments,
      });
      setSubmitted(true);
      toast({ title: 'Tak!', description: 'Din feedback er modtaget' });
      onSubmitted?.();
    } catch (error) {
      toast({ title: 'Fejl', description: 'Der opstod en fejl ved indsendelse' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
        <CheckCircle2 className="w-5 h-5 shrink-0" />
        <span className="font-medium">Tak for din feedback!</span>
      </div>
    );
  }

  const Question = ({ label, field }) => (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={form[field] === true ? 'default' : 'outline'}
          onClick={() => setForm({ ...form, [field]: true })}
          className="flex-1"
        >
          Ja
        </Button>
        <Button
          type="button"
          variant={form[field] === false ? 'default' : 'outline'}
          onClick={() => setForm({ ...form, [field]: false })}
          className="flex-1"
        >
          Nej
        </Button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-foreground">Sikkerhedsfeedback</h3>
      </div>

      <Question label="Blev der tilbudt redningsveste til alle passagerer?" field="life_vests_offered" />
      <Question label="Var sikkerhedsudstyret synligt og tilgængeligt?" field="equipment_visible" />
      <Question label="Følte du dig sikker under turen?" field="felt_safe" />

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Yderligere kommentarer (valgfrit)</label>
        <Textarea
          placeholder="Dine kommentarer..."
          value={form.additional_comments}
          onChange={(e) => setForm({ ...form, additional_comments: e.target.value })}
          className="resize-none h-20 rounded-lg"
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
      >
        {isSubmitting ? 'Sender...' : 'Indsend feedback'}
      </Button>
    </form>
  );
}