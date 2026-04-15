import React from 'react';
import { useNetwork } from '@/lib/NetworkContext';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

export default function NetworkStatus() {
  const { isOnline, isSlow, connectionSpeed } = useNetwork();

  if (isOnline && !isSlow) return null;

  const messages = {
    offline: { icon: WifiOff, text: 'Du er offline', color: 'bg-red-50 border-red-200 text-red-700' },
    slow: { icon: AlertCircle, text: 'Dårlig forbindelse', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  };

  const status = !isOnline ? 'offline' : 'slow';
  const config = messages[status];
  const Icon = config.icon;

  return (
    <div className={`fixed top-0 left-0 right-0 border-b ${config.color} px-4 py-2 flex items-center gap-2 z-50`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm font-medium">{config.text}</span>
      {!isOnline && <span className="text-xs opacity-75">Cached data vises</span>}
    </div>
  );
}