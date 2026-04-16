import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const { booking_id } = await req.json();

    if (!booking_id) {
      return Response.json({ error: 'Missing booking_id' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.filter({ id: booking_id }, null, 1).then(r => r[0]);
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Only the host or admin may trigger confirmation emails
    const isHost = booking.host_email === user.email;
    const isAdmin = user.role === 'admin';
    if (!isHost && !isAdmin) {
      return Response.json({ error: 'Forbidden: Only the host or an admin can confirm this booking' }, { status: 403 });
    }

    // Guest confirmation email
    const guestSubject = `Booking bekræftet: ${booking.listing_title}`;
    const guestBody = `
Hej ${booking.guest_name || booking.guest_email},

Din booking er blevet bekræftet!

Booking ID: ${booking.id}
Listing: ${booking.listing_title}
${booking.check_in ? `Check-in: ${booking.check_in}` : ''}
${booking.check_out ? `Check-out: ${booking.check_out}` : ''}
${booking.guests ? `Gæster: ${booking.guests}` : ''}
${booking.seats ? `Pladser: ${booking.seats}` : ''}
Pris: ${booking.total_price} DKK

Du kan se flere detaljer på dit dashboard: https://app.example.com/dashboard

Mange tak for din booking!
    `;

    await base44.integrations.Core.SendEmail({
      to: booking.guest_email,
      subject: guestSubject,
      body: guestBody,
      from_name: 'Sila'
    });

    // Host notification email
    if (booking.host_email) {
      const hostSubject = `Ny booking: ${booking.listing_title}`;
      const hostBody = `
Hej,

Du har modtaget en ny booking!

Booking ID: ${booking.id}
Gæst: ${booking.guest_name || booking.guest_email}
Listing: ${booking.listing_title}
${booking.check_in ? `Check-in: ${booking.check_in}` : ''}
${booking.check_out ? `Check-out: ${booking.check_out}` : ''}
${booking.guests ? `Gæster: ${booking.guests}` : ''}
${booking.seats ? `Pladser: ${booking.seats}` : ''}
Pris: ${booking.total_price} DKK

Se detaljer på dit dashboard: https://app.example.com/dashboard
      `;

      await base44.integrations.Core.SendEmail({
        to: booking.host_email,
        subject: hostSubject,
        body: hostBody,
        from_name: 'Sila'
      });
    }

    console.log(`Confirmation emails sent for booking ${booking_id}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending confirmation:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});