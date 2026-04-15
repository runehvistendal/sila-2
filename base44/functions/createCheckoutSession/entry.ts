import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

// Currency to smallest unit conversion
const CURRENCY_DECIMALS = {
  DKK: 0,  // øre
  EUR: 2,  // cents
  USD: 2,  // cents
  GBP: 2,  // pence
  SEK: 0,  // öre
  NOK: 0,  // øre
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceInDKK, currency = 'DKK', bookingId, bookingType, successUrl, cancelUrl } = await req.json();

    if (!priceInDKK || !bookingId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if running in iframe (published apps only)
    const origin = req.headers.get('origin') || '';
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return Response.json({ 
        error: 'Checkout only available on published app',
        inIframe: true 
      }, { status: 400 });
    }

    // Convert DKK to chosen currency
    const rates = await base44.asServiceRole.entities.FXRate.filter({
      from_currency: 'DKK'
    });

    let convertedPrice = priceInDKK;
    if (currency !== 'DKK' && rates.length > 0) {
      const rate = rates.find(r => r.to_currency === currency);
      if (rate) {
        convertedPrice = Math.round(priceInDKK * rate.rate * 100) / 100;
      }
    }

    // Convert to smallest currency unit for Stripe
    const decimals = CURRENCY_DECIMALS[currency] || 2;
    const stripeAmount = Math.round(convertedPrice * Math.pow(10, decimals));

    console.log(`Creating checkout: ${priceInDKK} DKK → ${convertedPrice} ${currency} → ${stripeAmount} in smallest unit`);

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: bookingType === 'cabin' ? 'Cabin Booking' : 'Transport Booking',
              description: `Booking ${bookingId}`
            },
            unit_amount: stripeAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${origin}/booking-confirmation?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: cancelUrl || `${origin}/booking-cancelled?booking_id=${bookingId}`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        booking_id: bookingId,
        booking_type: bookingType,
        user_email: user.email,
        original_currency: 'DKK',
        original_price: priceInDKK.toString(),
        displayed_currency: currency,
        displayed_price: convertedPrice.toString(),
      },
      customer_email: user.email,
    });

    console.log(`Checkout session created: ${session.id}`);

    return Response.json({
      sessionId: session.id,
      url: session.url,
      currency,
      amount: convertedPrice,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});