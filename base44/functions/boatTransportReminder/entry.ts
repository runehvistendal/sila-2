import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Called every hour by scheduler. Finds BoatTransport departures ~24h from now and notifies booked guests.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Get all scheduled transports
    const transports = await base44.asServiceRole.entities.BoatTransport.filter({ status: 'scheduled' }, 'departure_date', 200);

    let notified = 0;

    for (const transport of transports) {
      if (!transport.departure_date) continue;

      // Build departure datetime
      const depDate = transport.departure_date;
      const depTime = transport.departure_time || '08:00';
      const depDT = new Date(`${depDate}T${depTime}:00`);

      // Only notify if departure is between 24h and 25h from now (1h window to avoid duplicates)
      if (depDT < in24h || depDT > in25h) continue;

      // Find bookings for this transport
      const bookings = await base44.asServiceRole.entities.Booking.filter({
        listing_id: transport.id,
        type: 'transport',
        status: 'confirmed',
      }, 'created_date', 50);

      for (const booking of bookings) {
        if (!booking.guest_email) continue;

        // Get user preferences
        const users = await base44.asServiceRole.entities.User.filter({ email: booking.guest_email }, 'created_date', 1);
        const user = users[0];
        const prefs = user?.notification_prefs || 'email';

        const depFormatted = depDT.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' });
        const subject = `Påmindelse: Din båd afgår om 24 timer – ${transport.from_location} → ${transport.to_location}`;
        const body = `Hej ${booking.guest_name || 'rejsende'},

Din båd afgår om ca. 24 timer!

🚢 Rute: ${transport.from_location} → ${transport.to_location}
📅 Dato: ${depFormatted}
🕐 Afgang: ${depTime}
${transport.boat_type ? `⛵ Båd: ${transport.boat_type}` : ''}
${transport.notes ? `📝 Info: ${transport.notes}` : ''}

Husk at tjekke mødested og medbringe det nødvendige udstyr.

God sejltur!
Sila-teamet`;

        if (prefs === 'email' || prefs === 'both' || !prefs) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: booking.guest_email,
            subject,
            body,
          });
        }

        notified++;
      }
    }

    return Response.json({ ok: true, notified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});