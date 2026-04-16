import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify scheduler authorization
    const schedulerSecret = Deno.env.get('SCHEDULER_SECRET');
    const authHeader = req.headers.get('authorization') || '';
    
    if (!schedulerSecret || authHeader !== `Bearer ${schedulerSecret}`) {
      return Response.json({ error: 'Forbidden: Scheduler access required' }, { status: 403 });
    }

    // Find confirmed bookings that are in 7 days
    const bookings = await base44.asServiceRole.entities.Booking.filter(
      { status: 'confirmed' },
      '-created_date',
      100
    );

    const today = new Date();
    const inSevenDays = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingBookings = bookings.filter(b => {
      const checkInDate = new Date(b.check_in);
      return checkInDate >= today && checkInDate <= inSevenDays && !b.reminder_sent;
    });

    for (const booking of upcomingBookings) {
      const guestSubject = `Påmindelse: Din booking starter snart - ${booking.listing_title}`;
      const guestBody = `
Hej ${booking.guest_name || booking.guest_email},

Din booking starter snart!

Listing: ${booking.listing_title}
Check-in: ${booking.check_in}
${booking.guests ? `Gæster: ${booking.guests}` : ''}

Se alle detaljer på dit dashboard: https://app.example.com/dashboard

Vi glæder os til at se dig!
      `;

      await base44.integrations.Core.SendEmail({
        to: booking.guest_email,
        subject: guestSubject,
        body: guestBody,
        from_name: 'Sila'
      });

      // Mark reminder as sent
      await base44.asServiceRole.entities.Booking.update(booking.id, { reminder_sent: true });
    }

    console.log(`Sent ${upcomingBookings.length} booking reminders`);
    return Response.json({ sent: upcomingBookings.length });
  } catch (error) {
    console.error('Error sending reminders:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});