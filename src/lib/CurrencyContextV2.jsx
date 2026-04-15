import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const CurrencyContext = createContext();

export const CURRENCIES = {
  DKK: { label: 'DKK', flag: '🇩🇰', name: 'Danish Krone' },
  EUR: { label: 'EUR', flag: '🇪🇺', name: 'Euro' },
  USD: { label: 'USD', flag: '🇺🇸', name: 'US Dollar' },
  GBP: { label: 'GBP', flag: '🇬🇧', name: 'British Pound' },
  SEK: { label: 'SEK', flag: '🇸🇪', name: 'Swedish Krona' },
  NOK: { label: 'NOK', flag: '🇳🇴', name: 'Norwegian Krone' },
};

// Country to currency mapping
const COUNTRY_CURRENCY_MAP = {
  DK: 'DKK', SE: 'SEK', NO: 'NOK', GB: 'GBP', IE: 'GBP',
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', AT: 'EUR', NL: 'EUR',
  US: 'USD', CA: 'USD', MX: 'USD',
};

// Fallback rates (updated daily by updateFXRates function)
const DEFAULT_RATES = {
  DKK: 1,
  EUR: 0.134,
  USD: 0.145,
  GBP: 0.115,
  SEK: 1.35,
  NOK: 1.45,
};

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    const saved = localStorage.getItem('sila_currency');
    return saved && CURRENCIES[saved] ? saved : 'DKK';
  });
  
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [isLoading, setIsLoading] = useState(true);

  // Load user preference and fetch rates on mount
  useEffect(() => {
    const initCurrency = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) {
          // Auto-detect based on browser locale
          detectAndSetCurrency();
          setIsLoading(false);
          return;
        }

        // Try to load user preference
        const prefs = await base44.asServiceRole.entities.UserCurrencyPreference.filter({
          user_email: user.email
        });

        if (prefs.length > 0 && !prefs[0].auto_detect) {
          // Use saved preference
          setCurrencyState(prefs[0].preferred_currency);
        } else {
          // Auto-detect
          detectAndSetCurrency();
        }
      } catch (error) {
        console.error('Failed to load currency preference:', error);
        detectAndSetCurrency();
      }

      // Fetch latest FX rates
      try {
        const fxRates = await base44.asServiceRole.entities.FXRate.list();
        if (fxRates.length > 0) {
          const rateMap = { DKK: 1 };
          fxRates.forEach(r => {
            rateMap[r.to_currency] = r.rate;
          });
          setRates(rateMap);
        }
      } catch (error) {
        console.error('Failed to fetch FX rates:', error);
        // Use defaults
      }

      setIsLoading(false);
    };

    initCurrency();
  }, []);

  const detectAndSetCurrency = () => {
    try {
      // Try to detect country from browser language
      const lang = navigator.language || 'en-DK';
      const country = lang.split('-')[1];
      const detectedCurrency = COUNTRY_CURRENCY_MAP[country] || 'DKK';
      setCurrencyState(detectedCurrency);
      localStorage.setItem('sila_currency', detectedCurrency);
    } catch (error) {
      console.error('Failed to detect currency:', error);
      setCurrencyState('DKK');
    }
  };

  const setCurrency = async (newCurrency) => {
    if (!CURRENCIES[newCurrency]) return;
    
    setCurrencyState(newCurrency);
    localStorage.setItem('sila_currency', newCurrency);

    // Save to user profile if authenticated
    try {
      const user = await base44.auth.me();
      if (user) {
        const prefs = await base44.asServiceRole.entities.UserCurrencyPreference.filter({
          user_email: user.email
        });

        if (prefs.length > 0) {
          await base44.asServiceRole.entities.UserCurrencyPreference.update(prefs[0].id, {
            preferred_currency: newCurrency,
            auto_detect: false
          });
        } else {
          await base44.asServiceRole.entities.UserCurrencyPreference.create({
            user_email: user.email,
            preferred_currency: newCurrency,
            auto_detect: false
          });
        }
      }
    } catch (error) {
      console.error('Failed to save currency preference:', error);
    }
  };

  const convertPrice = (priceInDKK) => {
    const rate = rates[currency] || DEFAULT_RATES[currency] || 1;
    return Math.round(priceInDKK * rate * 100) / 100;
  };

  const formatPrice = (priceInDKK, showCurrency = true) => {
    const converted = convertPrice(priceInDKK);
    const label = CURRENCIES[currency]?.label || currency;
    
    // Round to nearest whole number if under 10k
    const displayPrice = converted > 1000 
      ? Math.round(converted) 
      : Math.round(converted * 100) / 100;
    
    return showCurrency ? `${displayPrice} ${label}` : displayPrice.toString();
  };

  // Get label for UI (danish, english, greenlandic)
  const getCurrencyLabel = (lang = 'da') => {
    const labels = {
      da: 'Valuta',
      en: 'Currency',
      kl: 'Valuta'
    };
    return labels[lang] || 'Valuta';
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      convertPrice,
      formatPrice,
      getCurrencyLabel,
      rates,
      isLoading,
      CURRENCIES
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency should be used within CurrencyProvider');
  }
  return context;
}