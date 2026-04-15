import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId } = await req.json();
    if (!bookingId) return Response.json({ error: 'bookingId required' }, { status: 400 });

    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];

    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.guest_email !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (booking.status !== 'on_hold') return Response.json({ ok: true, message: 'Not on hold' });

    await base44.asServiceRole.entities.Booking.update(bookingId, { status: 'cancelled' });
    console.log(`Hold released for booking ${bookingId} by user ${user.email}`);

    return Response.json({ ok: true });
  } catch (error) {
    console.error('releaseBookingHold error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});