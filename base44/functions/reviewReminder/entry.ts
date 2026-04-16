import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Runs daily. Finds confirmed bookings completed ~3 days ago and sends review reminder.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    // Get all confirmed bookings
    const bookings = await base44.asServiceRole.entities.Booking.filter({ status: 'confirmed' }, '-created_date', 500);

    let reminded = 0;

    for (const booking of bookings) {
      if (!booking.check_out || !booking.guest_email) continue;

      const checkOut = new Date(booking.check_out);
      // Only remind if check_out was between 3 and 4 days ago
      if (checkOut > threeDaysAgo || checkOut < fourDaysAgo) continue;

      // Check if they already left a review
      const reviews = await base44.asServiceRole.entities.Review.filter({
        listing_id: booking.listing_id,
        reviewer_email: booking.guest_email,
      }, 'created_date', 1);

      if (reviews.length > 0) continue; // Already reviewed

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: booking.guest_email,
        subject: `Hvordan var din oplevelse? Del din anmeldelse af ${booking.listing_title}`,
        body: `Hej ${booking.guest_name || 'rejsende'},

Vi håber, du havde en fantastisk tur til ${booking.listing_title}!

Det er nu 3 dage siden dit ophold sluttede. Vi vil elske at høre din mening – dine anmeldelser hjælper andre rejsende med at finde de bedste hytter i Grønland.

👉 Log ind på Sila og skriv en anmeldelse under din booking eller direkte på hytte-siden.

Det tager kun 2 minutter, og din feedback er meget værdsat af udlejeren!

Tusind tak,
Sila-teamet`,
      });

      reminded++;
    }

    return Response.json({ ok: true, reminded });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});