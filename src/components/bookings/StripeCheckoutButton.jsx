import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Lock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function StripeCheckoutButton({ payload, disabled, label = 'Betal sikkert', onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    // Block if in iframe
    if (window.self !== window.top) {
      alert('Betaling virker kun fra den publicerede app. Åbn appen i en ny fane.');
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke('createCheckout', payload);
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        throw new Error(res.data?.error || 'Ukendt fejl');
      }
    } catch (err) {
      toast({ title: 'Fejl ved betaling', description: err.message, variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || loading}
      className="w-full h-12 bg-primary text-white hover:bg-primary/90 rounded-xl font-semibold gap-2"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
      {loading ? 'Sender til betaling...' : label}
    </Button>
  );
}