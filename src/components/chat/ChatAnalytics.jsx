import { useEffect } from 'react';
import { useAnalytics } from '@/lib/AnalyticsContext';
import { chatEvents } from '@/lib/ga4';

/**
 * Wrapper to track chat events
 */
export function trackChatStarted(requestId, requestType) {
  chatEvents.started(requestId, requestType);
}

export function trackMessageSent(requestId, requestType, messageType = 'text') {
  chatEvents.messageSent(requestId, requestType, messageType);
}