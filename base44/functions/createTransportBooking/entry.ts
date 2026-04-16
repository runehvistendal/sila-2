import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, guestEmail, guestName, price, message } = body;

    // Only allow users to create bookings for themselves
    if (user.email !== guestEmail) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('Creating transport booking for request:', requestId);

    // Create booking record
    const booking = await base44.entities.Booking.create({
      type: 'transport',
      listing_id: requestId,
      listing_title: '',
      guest_name: guestName,
      guest_email: guestEmail,
      seats: 1,
      total_price: price,
      message: message,
      status: 'on_hold',
    });

    console.log('Booking created:', booking.id);
    return Response.json({ bookingId: booking.id, status: 'ok' });
  } catch (error) {
    console.error('Error creating transport booking:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});