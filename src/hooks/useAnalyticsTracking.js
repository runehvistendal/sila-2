import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useAnalytics } from '@/lib/AnalyticsContext';
import { engagementEvents, authEvents } from '@/lib/ga4';

/**
 * Hook to automatically track page views and auth events
 */
export function usePageTracking(pageName) {
  const { consentGiven } = useAnalytics();

  useEffect(() => {
    if (consentGiven) {
      engagementEvents.pageViewed(pageName);
    }
  }, [pageName, consentGiven]);
}

/**
 * Hook to track auth events
 */
export function useAuthTracking() {
  const { user } = useAuth();
  const { consentGiven } = useAnalytics();

  useEffect(() => {
    if (consentGiven && user) {
      authEvents.loggedIn();
    }
  }, [user, consentGiven]);
}

/**
 * Hook to track time spent on page
 */
export function useTimeOnPage(eventName, minSecondsBeforeTrack = 5) {
  const { consentGiven } = useAnalytics();

  useEffect(() => {
    if (!consentGiven) return;

    const startTime = Date.now();

    const handleBeforeUnload = () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      if (timeSpent >= minSecondsBeforeTrack) {
        // Event would be tracked via navigator.sendBeacon or similar
        // For now, we'll use fetch with keepalive
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', eventName, {
            time_on_page: timeSpent,
          });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [eventName, consentGiven, minSecondsBeforeTrack]);
}