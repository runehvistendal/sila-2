import React from 'react';
import { useCurrency, CURRENCIES } from '@/lib/CurrencyContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="w-24">
      <Select value={currency} onValueChange={setCurrency}>
        <SelectTrigger className="h-9 border-0 bg-muted rounded-lg text-xs font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {Object.entries(CURRENCIES).map(([code, data]) => (
            <SelectItem key={code} value={code}>
              {code} ({data.symbol})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}