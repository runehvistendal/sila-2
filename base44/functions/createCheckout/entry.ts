import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingType, listingId, listingTitle, checkIn, checkOut, guests, seats, totalPrice, hostEmail, message, transportSeats } = await req.json();

    // Create a temporary "hold" booking
    const holdBooking = await base44.asServiceRole.entities.Booking.create({
      type: bookingType,
      listing_id: listingId,
      listing_title: listingTitle,
      guest_name: user.full_name || '',
      guest_email: user.email,
      check_in: checkIn,
      check_out: checkOut || checkIn,
      guests: guests || 1,
      seats: seats || 1,
      total_price: totalPrice,
      message: message || '',
      host_email: hostEmail || '',
      status: 'on_hold',
    });

    const origin = req.headers.get('origin') || 'https://app.base44.com';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'dkk',
          product_data: {
            name: listingTitle,
            description: bookingType === 'cabin'
              ? `Indcheckning: ${checkIn} – Udtjekning: ${checkOut} · ${guests} gæst(er)`
              : `Dato: ${checkIn} · ${seats} plads(er)`,
          },
          unit_amount: Math.round(totalPrice * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${holdBooking.id}`,
      cancel_url: `${origin}/booking-cancelled?booking_id=${holdBooking.id}`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        booking_id: holdBooking.id,
        listing_id: listingId,
        booking_type: bookingType,
        user_email: user.email,
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min hold
    });

    return Response.json({ url: session.url, bookingId: holdBooking.id, sessionId: session.id });
  } catch (error) {
    console.error('createCheckout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});