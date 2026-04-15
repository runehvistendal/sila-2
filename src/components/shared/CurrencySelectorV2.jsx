import React from 'react';
import { useCurrency, CURRENCIES } from '@/lib/CurrencyContextV2';
import { useLanguage } from '@/lib/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CurrencySelectorV2() {
  const { currency, setCurrency, getCurrencyLabel } = useCurrency();
  const { language } = useLanguage();

  return (
    <div className="w-32">
      <Select value={currency} onValueChange={setCurrency}>
        <SelectTrigger className="h-9 border-0 bg-muted rounded-lg text-xs font-medium">
          <SelectValue placeholder={currency} />
        </SelectTrigger>
        <SelectContent align="end">
          {Object.entries(CURRENCIES).map(([code, data]) => (
            <SelectItem key={code} value={code}>
              {data.flag} {code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}