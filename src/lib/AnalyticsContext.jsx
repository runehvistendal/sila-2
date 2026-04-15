import React, { createContext, useContext, useState, useEffect } from 'react';

const AnalyticsContext = createContext();

export function AnalyticsProvider({ children }) {
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentLoaded, setConsentLoaded] = useState(false);

  useEffect(() => {
    // Load consent from localStorage
    const storedConsent = localStorage.getItem('analytics_consent');
    if (storedConsent) {
      setConsentGiven(JSON.parse(storedConsent));
    }
    setConsentLoaded(true);
  }, []);

  const setAnalyticsConsent = (consent) => {
    setConsentGiven(consent);
    localStorage.setItem('analytics_consent', JSON.stringify(consent));
    
    if (consent) {
      initializeGA4();
    }
  };

  const initializeGA4 = () => {
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted',
      });
    }
  };

  return (
    <AnalyticsContext.Provider value={{ consentGiven, setAnalyticsConsent, consentLoaded }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}