import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const CURRENCIES = {
  DKK: { symbol: 'kr', rate: 1, label: 'DKK' },
  EUR: { symbol: '€', rate: 0.134, label: 'EUR' },
  USD: { symbol: '$', rate: 0.145, label: 'USD' },
  GBP: { symbol: '£', rate: 0.115, label: 'GBP' },
};

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('sila_currency');
    return saved && CURRENCIES[saved] ? saved : 'DKK';
  });

  useEffect(() => {
    localStorage.setItem('sila_currency', currency);
  }, [currency]);

  const convertPrice = (priceInDKK) => {
    const rate = CURRENCIES[currency].rate;
    const converted = priceInDKK * rate;
    // Round up to nearest whole number for non-DKK currencies
    return currency === 'DKK' ? Math.round(converted * 100) / 100 : Math.ceil(converted);
  };

  const formatPrice = (priceInDKK, showCurrency = true) => {
    const converted = convertPrice(priceInDKK);
    const symbol = CURRENCIES[currency].symbol;
    const displayPrice = currency === 'DKK' ? converted : Math.round(converted);
    
    if (currency === 'DKK') {
      return showCurrency ? `${displayPrice} ${symbol}` : displayPrice.toString();
    }
    
    return showCurrency ? `${symbol}${displayPrice}` : displayPrice.toString();
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency skal bruges inden for CurrencyProvider');
  }
  return context;
}