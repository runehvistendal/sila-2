import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { booking_id } = await req.json();

    if (!booking_id) {
      return Response.json({ error: 'Missing booking_id' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.filter({ id: booking_id }, null, 1).then(r => r[0]);
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Guest rejection email
    const guestSubject = `Booking afvist: ${booking.listing_title}`;
    const guestBody = `
Hej ${booking.guest_name || booking.guest_email},

Desværre har værten afvist din bookinganmodning.

Listing: ${booking.listing_title}
Booking ID: ${booking.id}

Du kan se andre tilbud på: https://app.example.com/cabins

Kontakt os hvis du har spørgsmål.
    `;

    await base44.integrations.Core.SendEmail({
      to: booking.guest_email,
      subject: guestSubject,
      body: guestBody,
      from_name: 'Sila'
    });

    console.log(`Rejection email sent for booking ${booking_id}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending rejection:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});