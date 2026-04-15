# Sila Analytics Setup Guide

## Google Analytics 4 (GA4) Integration

### 1. Setup Instructions

#### Step 1: Create GA4 Property
1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property for Sila
3. Copy your **Measurement ID** (format: G-XXXXXXXXXX)

#### Step 2: Update Measurement ID
Replace `G-MEASUREMENT_ID` in `index.html` with your actual Measurement ID:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR_MEASUREMENT_ID"></script>
```

#### Step 3: Verify Installation
1. Visit your live app
2. Open DevTools → Network tab
3. Filter for "google-analytics" or "gtag"
4. You should see requests to Google Analytics

### 2. Event Tracking

All events are automatically tracked after user accepts cookie consent:

#### Listing Events
- `listing_viewed` - User views a listing
- `listing_details_opened` - User opens full listing details
- `listing_created` - Host/provider creates listing
- `listing_edited` - Host/provider edits listing

#### Request Flow
- `transport_request_created` - User creates transport request
- `cabin_request_created` - User creates cabin request

#### Offer Flow
- `offer_received` - Provider/host sends offer
- `offer_accepted` - User accepts offer
- `offer_declined` - User declines offer

#### Booking Events
- `booking_started` - User starts checkout process
- `booking_completed` - Booking confirmed (Stripe payment)
- `booking_cancelled` - Booking cancelled

#### Chat Events
- `chat_started` - User starts messaging
- `message_sent` - User sends message

#### Safety Events
- `incident_report_created` - User reports incident
- `low_rating_given` - User gives rating below 3 stars

#### Engagement
- `page_viewed` - User views page
- `profile_viewed` - User views profile
- `reviews_read` - User reads reviews
- `trust_score_viewed` - User checks trust score

### 3. GDPR Compliance

✅ **What's Protected:**
- Cookie consent required before tracking
- IP anonymization enabled
- No ad personalization
- No Google Ads tracking
- Privacy policy includes analytics disclosure
- Users can reject analytics entirely

✅ **Cookie Banner:**
- Automatically shown to new visitors
- Stored in `localStorage` as `analytics_consent`
- Available in English, Danish, Greenlandic

✅ **How to Manage Consent:**
```javascript
// Get current consent
const hasConsent = localStorage.getItem('analytics_consent') === 'true';

// Programmatically set consent
localStorage.setItem('analytics_consent', 'true'); // or 'false'
```

### 4. Dashboard & Reports

#### View Conversion Funnels
1. GA4 Dashboard → Explore
2. Create funnel visualization:
   - Step 1: `listing_viewed`
   - Step 2: `transport_request_created`
   - Step 3: `offer_received`
   - Step 4: `booking_completed`

#### View Popular Locations
1. GA4 Dashboard → Reports → Geography
2. Or use custom event dimensions:
   - Dimension: `location`
   - Metric: Count of `listing_viewed` events

#### Track Revenue
1. GA4 Dashboard → Reports → Monetization
2. All booking events include:
   - `value` (booking amount in DKK)
   - `currency` (DKK)

#### View Traffic Sources
1. GA4 Dashboard → Acquisition
2. Segments by:
   - Direct traffic
   - Organic search
   - Social media
   - Referral

### 5. Backend Analytics

#### Daily Report
Run `generateAnalyticsReport()` function to get:
- Conversion funnel rates
- Popular locations (top 10)
- Revenue metrics
- Last 30 days trends

#### Event Data Storage
Events are logged in GA4 and can be exported to BigQuery for advanced analysis.

### 6. Data Privacy & GDPR

**Retention Policy:**
- GA4 defaults to 2 months data retention
- Adjust in GA4 Settings → Data Retention if needed
- User data can be deleted via Privacy Center

**Right to be Forgotten:**
- Users can request account deletion
- `deleteUserAccount()` function removes all associated data
- Analytics tracking respects `analytics_consent` setting

**Data Minimization:**
- We only track necessary user behavior
- No sensitive personal information tracked
- No IP addresses retained (anonymized)

### 7. Troubleshooting

**GA4 Not Tracking?**
1. Check `analytics_consent` in localStorage
2. Ensure Measurement ID is correct
3. Check GA4 Real-time report in dashboard
4. Verify no ad blockers blocking Google Analytics

**Test Event:**
```javascript
// In browser console after accepting consent
gtag('event', 'test_event', {
  'test': true
});
```

### 8. Useful Links

- [GA4 Documentation](https://support.google.com/analytics/answer/10089681)
- [GA4 Events Guide](https://support.google.com/analytics/answer/9322688)
- [GA4 Custom Events](https://support.google.com/analytics/answer/9268042)
- [GDPR Compliance for GA4](https://support.google.com/analytics/answer/9976099)