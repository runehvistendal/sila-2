import React, { createContext, useContext, useEffect, useState } from 'react';

const NetworkContext = createContext();

export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionSpeed, setConnectionSpeed] = useState('fast'); // fast, slow, offline
  const [lowDataMode, setLowDataMode] = useState(() => {
    try {
      return localStorage.getItem('lowDataMode') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionSpeed('fast');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionSpeed('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Detect connection speed using navigator.connection if available
    if ('connection' in navigator) {
      const connection = navigator.connection;
      const updateSpeed = () => {
        if (!navigator.onLine) {
          setConnectionSpeed('offline');
        } else if (connection.effectiveType === '4g' || connection.effectiveType === 'wifi') {
          setConnectionSpeed('fast');
        } else {
          setConnectionSpeed('slow');
        }
      };

      connection.addEventListener('change', updateSpeed);
      updateSpeed();

      return () => {
        connection.removeEventListener('change', updateSpeed);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleLowDataMode = (enabled) => {
    setLowDataMode(enabled);
    try {
      localStorage.setItem('lowDataMode', String(enabled));
    } catch (e) {
      console.warn('Could not save low data mode preference', e);
    }
  };

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        connectionSpeed,
        lowDataMode,
        toggleLowDataMode,
        isSlow: connectionSpeed === 'slow',
        isOffline: connectionSpeed === 'offline',
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider');
  return ctx;
}