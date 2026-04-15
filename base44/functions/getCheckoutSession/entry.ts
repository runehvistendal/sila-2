import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return Response.json({ error: 'Missing session ID' }, { status: 400 });
    }

    // Fetch session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent']
    });

    if (!session) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get booking data from metadata
    const { booking_id, original_price, displayed_currency, displayed_price } = session.metadata;

    // Fetch full booking details
    const booking = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });

    if (!booking || booking.length === 0) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const bookingData = booking[0];

    // Fetch listing details (cabin or transport)
    let listing = null;
    if (bookingData.type === 'cabin') {
      const cabins = await base44.asServiceRole.entities.Cabin.filter({ id: bookingData.listing_id });
      listing = cabins[0];
    } else if (bookingData.type === 'transport') {
      const transports = await base44.asServiceRole.entities.BoatTransport.filter({ id: bookingData.listing_id });
      listing = transports[0];
    }

    return Response.json({
      session: {
        id: session.id,
        status: session.payment_status,
        created: new Date(session.created * 1000).toISOString(),
      },
      booking: {
        ...bookingData,
        originalPrice: parseFloat(original_price),
        displayedPrice: parseFloat(displayed_price),
        displayedCurrency: displayed_currency,
      },
      listing: listing || null,
      payment: {
        status: session.payment_status,
        amount: session.amount_total,
        currency: session.currency?.toUpperCase(),
      },
    });
  } catch (error) {
    console.error('Get session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});