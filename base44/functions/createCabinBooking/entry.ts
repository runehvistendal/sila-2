import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { requestId, guestEmail, guestName, price, message } = body;

    console.log('Creating cabin booking for request:', requestId);

    // Create booking record
    const booking = await base44.entities.Booking.create({
      type: 'cabin',
      listing_id: requestId,
      listing_title: '',
      guest_name: guestName,
      guest_email: guestEmail,
      guests: 1,
      total_price: price,
      message: message,
      status: 'on_hold',
    });

    console.log('Booking created:', booking.id);
    return Response.json({ bookingId: booking.id, status: 'ok' });
  } catch (error) {
    console.error('Error creating cabin booking:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});