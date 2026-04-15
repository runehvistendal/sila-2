import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const bookingId = session.metadata?.booking_id;

    if (bookingId) {
      try {
        await base44.asServiceRole.entities.Booking.update(bookingId, {
          status: 'confirmed',
          stripe_session_id: session.id,
        });
        console.log(`Booking ${bookingId} confirmed via Stripe`);
      } catch (err) {
        console.error('Failed to confirm booking:', err.message);
      }
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object;
    const bookingId = session.metadata?.booking_id;

    if (bookingId) {
      try {
        await base44.asServiceRole.entities.Booking.update(bookingId, { status: 'cancelled' });
        console.log(`Hold released for booking ${bookingId} – session expired`);
      } catch (err) {
        console.error('Failed to release hold:', err.message);
      }
    }
  }

  return Response.json({ received: true });
});