/**
 * GA4 Event Tracking
 * All events are GDPR-compliant and only track after user consent
 */

const consentKey = 'analytics_consent';

function hasConsent() {
  if (typeof window === 'undefined') return false;
  const consent = localStorage.getItem(consentKey);
  return consent === 'true';
}

/**
 * Track a GA4 event
 * @param {string} eventName - Event name (e.g. 'booking_completed')
 * @param {object} eventData - Event data to track
 */
export function trackEvent(eventName, eventData = {}) {
  if (!hasConsent()) return;

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      ...eventData,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Set user ID for tracking (opt-in only)
 */
export function setUserId(userId) {
  if (!hasConsent()) return;
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', {
      'user_id': userId,
    });
  }
}

/**
 * Set user properties
 */
export function setUserProperties(properties) {
  if (!hasConsent()) return;
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('set', properties);
  }
}

/**
 * LISTING EVENTS
 */
export const listingEvents = {
  viewed: (listing_id, listing_type, location) => {
    trackEvent('listing_viewed', {
      listing_id,
      listing_type,
      location,
    });
  },
  
  detailsOpened: (listing_id, listing_type) => {
    trackEvent('listing_details_opened', {
      listing_id,
      listing_type,
    });
  },
};

/**
 * SEARCH & DISCOVERY EVENTS
 */
export const searchEvents = {
  performed: (query, filters, results_count) => {
    trackEvent('search_performed', {
      query,
      filters: JSON.stringify(filters),
      results_count,
    });
  },
  
  filterApplied: (filter_type, filter_value) => {
    trackEvent('search_filter_applied', {
      filter_type,
      filter_value,
    });
  },
};

/**
 * REQUEST FLOW EVENTS
 */
export const requestEvents = {
  created: (request_type, from_location, to_location, date, passengers) => {
    trackEvent('transport_request_created', {
      request_type,
      from_location,
      to_location,
      travel_date: date,
      passengers,
    });
  },
  
  cabinRequested: (location, check_in, check_out, guests) => {
    trackEvent('cabin_request_created', {
      location,
      check_in,
      check_out,
      guests,
    });
  },
};

/**
 * OFFER FLOW EVENTS
 */
export const offerEvents = {
  received: (request_id, request_type, offer_price) => {
    trackEvent('offer_received', {
      request_id,
      request_type,
      offer_price,
    });
  },
  
  accepted: (request_id, request_type, offer_price) => {
    trackEvent('offer_accepted', {
      request_id,
      request_type,
      offer_price,
    });
  },
  
  declined: (request_id, request_type) => {
    trackEvent('offer_declined', {
      request_id,
      request_type,
    });
  },
};

/**
 * BOOKING EVENTS
 */
export const bookingEvents = {
  started: (listing_id, listing_type, total_price) => {
    trackEvent('booking_started', {
      listing_id,
      listing_type,
      value: total_price,
      currency: 'DKK',
    });
  },
  
  completed: (booking_id, listing_type, listing_id, total_price, location) => {
    trackEvent('booking_completed', {
      booking_id,
      listing_type,
      listing_id,
      value: total_price,
      currency: 'DKK',
      location,
    });
  },
  
  cancelled: (booking_id, listing_type, cancellation_reason) => {
    trackEvent('booking_cancelled', {
      booking_id,
      listing_type,
      reason: cancellation_reason,
    });
  },
};

/**
 * CHAT EVENTS
 */
export const chatEvents = {
  started: (request_id, request_type) => {
    trackEvent('chat_started', {
      request_id,
      request_type,
    });
  },
  
  messageSent: (request_id, request_type, message_type = 'text') => {
    trackEvent('message_sent', {
      request_id,
      request_type,
      message_type,
    });
  },
};

/**
 * SAFETY & TRUST EVENTS
 */
export const safetyEvents = {
  incidentReported: (incident_type, involved_parties_count) => {
    trackEvent('incident_report_created', {
      incident_type,
      involved_parties_count,
    });
  },
  
  lowRatingGiven: (listing_type, listing_id, rating) => {
    trackEvent('low_rating_given', {
      listing_type,
      listing_id,
      rating,
    });
  },
};

/**
 * USER ENGAGEMENT EVENTS
 */
export const engagementEvents = {
  pageViewed: (page_path) => {
    trackEvent('page_viewed', {
      page_path,
    });
  },
  
  profileViewed: (profile_type) => {
    trackEvent('profile_viewed', {
      profile_type,
    });
  },
  
  reviewsRead: (listing_id, listing_type, review_count) => {
    trackEvent('reviews_read', {
      listing_id,
      listing_type,
      review_count,
    });
  },
  
  trustScoreViewed: () => {
    trackEvent('trust_score_viewed', {});
  },
};

/**
 * AUTHENTICATION EVENTS
 */
export const authEvents = {
  signedUp: (registration_source) => {
    trackEvent('user_signed_up', {
      source: registration_source,
    });
  },
  
  loggedIn: () => {
    trackEvent('user_logged_in', {});
  },
};

/**
 * LISTING CREATION EVENTS (for hosts/providers)
 */
export const hostEvents = {
  listingCreated: (listing_type, location) => {
    trackEvent('listing_created', {
      listing_type,
      location,
    });
  },
  
  listingEdited: (listing_type, listing_id) => {
    trackEvent('listing_edited', {
      listing_type,
      listing_id,
    });
  },
  
  listingDeactivated: (listing_type, listing_id, reason) => {
    trackEvent('listing_deactivated', {
      listing_type,
      listing_id,
      reason,
    });
  },
};