import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { booking_id, request_type } = await req.json();

    if (!booking_id || !request_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get booking
    const booking = await base44.asServiceRole.entities.Booking.filter({ id: booking_id }, null, 1).then(r => r[0]);
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get request for context
    let request;
    if (request_type === 'transport') {
      request = await base44.asServiceRole.entities.TransportRequest.filter({ id: booking.listing_id }, null, 1).then(r => r[0]);
    } else if (request_type === 'cabin') {
      request = await base44.asServiceRole.entities.CabinRequest.filter({ id: booking.listing_id }, null, 1).then(r => r[0]);
    }

    // Email to provider/host
    if (booking.host_email) {
      const subject = `Tilbud accepteret: ${booking.listing_title}`;
      const body = `
Hej,

Gæsten har accepteret dit tilbud!

Booking: ${booking.listing_title}
Gæst: ${booking.guest_name || booking.guest_email}
Pris: ${booking.total_price} DKK
${booking.check_in ? `Check-in: ${booking.check_in}` : ''}
${booking.check_out ? `Check-out: ${booking.check_out}` : ''}
${booking.guests ? `Gæster: ${booking.guests}` : ''}
${booking.seats ? `Pladser: ${booking.seats}` : ''}

Se detaljer på dit dashboard.

Med venlig hilsen
Sila
      `;

      await base44.integrations.Core.SendEmail({
        to: booking.host_email,
        subject,
        body,
        from_name: 'Sila'
      });
    }

    console.log(`Offer accepted notification sent for booking ${booking_id}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending offer accepted notification:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});