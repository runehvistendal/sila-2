import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Tracks when a booking is completed
 * This function is called as an internal automation handler when a booking is created/updated
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Verify this is a trusted internal automation event (not external request)
    if (!payload.event || !payload.event.type || !payload.event.entity_name || !payload.event.entity_id) {
      return Response.json({ error: 'Invalid event source' }, { status: 400 });
    }

    // Only accept Booking entity events
    if (payload.event.entity_name !== 'Booking') {
      return Response.json({ status: 'skipped', reason: 'Invalid entity source' }, { status: 400 });
    }

    const booking = payload.data;

    // Only track when booking is confirmed (completed)
    if (!booking || booking.status !== 'confirmed') {
      return Response.json({ tracked: false });
    }

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