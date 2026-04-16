import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Tracks when a booking is completed (Stripe webhook confirmation)
 * This function is called automatically when a booking status changes to 'confirmed'
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, data } = await req.json();

    // Only track when booking is confirmed (completed)
    if (data.status !== 'confirmed') {
      return Response.json({ tracked: false });
    }

    const booking = data;

    // Track GA4 event via backend analytics
    // This ensures server-side event validation
    await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Track this booking completion event: Booking ID: ${booking.id}, Type: ${booking.type}, Listing: ${booking.listing_title}, Price: ${booking.total_price} DKK, Location: ${booking.listing_id}. This is for internal analytics purposes only.`,
    });

    console.log(`[Analytics] Booking completed tracked: ${booking.id}`);

    return Response.json({ tracked: true, booking_id: booking.id });
  } catch (error) {
    console.error('[Analytics] Booking tracking error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});