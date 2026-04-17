import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Runs daily. Finds bookings completed ~24 hours ago where no rating exists,
// and sends review reminder emails to both guest and host in their preferred language.

const SILA_URL = 'https://sila.gl';

const STRINGS = {
  guest: {
    da: {
      subject: 'Hvordan var din oplevelse?',
      body: (name, title, link) => `Hej ${name},\n\nVi håber, du havde en fantastisk oplevelse med ${title}!\n\nDu kan dele din anmeldelse her:\n${link}\n\nDet tager kun 2 minutter og hjælper andre rejsende i Grønland.\n\nMange tak,\nSila-teamet`,
    },
    en: {
      subject: 'How was your experience?',
      body: (name, title, link) => `Hi ${name},\n\nWe hope you had a great experience with ${title}!\n\nYou can leave your review here:\n${link}\n\nIt only takes 2 minutes and helps other travelers in Greenland.\n\nThank you,\nThe Sila team`,
    },
    kl: {
      subject: 'Qanoq oqimaatsuuppa?',
      body: (name, title, link) => `Hej ${name},\n\nVi håber, du havde en fantastisk oplevelse med ${title}!\n\nDu kan dele din anmeldelse her:\n${link}\n\nMange tak,\nSila-teamet`,
    },
  },
  host: {
    da: {
      subject: 'Bedøm din gæst',
      body: (name, guestName, link) => `Hej ${name},\n\nHvordan var din gæst ${guestName}? Del en kort bedømmelse – det hjælper andre udlejere.\n\n${link}\n\nMange tak,\nSila-teamet`,
    },
    en: {
      subject: 'Rate your guest',
      body: (name, guestName, link) => `Hi ${name},\n\nHow was your guest ${guestName}? Leave a quick rating – it helps other hosts.\n\n${link}\n\nThank you,\nThe Sila team`,
    },
    kl: {
      subject: 'Bedøm din gæst',
      body: (name, guestName, link) => `Hej ${name},\n\nHvordan var din gæst ${guestName}? Del en kort bedømmelse.\n\n${link}\n\nMange tak,\nSila-teamet`,
    },
  },
};

function getLang(user) {
  return ['da', 'en', 'kl'].includes(user?.language) ? user.language : 'da';
}

function reviewLink(booking) {
  if (booking.type === 'cabin') return `${SILA_URL}/cabins/${booking.listing_id}`;
  if (booking.type === 'transport') return `${SILA_URL}/transport/${booking.listing_id}`;
  return SILA_URL;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verify scheduler authorization
    const schedulerSecret = Deno.env.get('SCHEDULER_SECRET');
    const authHeader = req.headers.get('authorization') || '';
    if (!schedulerSecret || authHeader !== `Bearer ${schedulerSecret}`) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    // Window: completed between 22h and 26h ago (catches daily runs)
    const windowStart = new Date(now.getTime() - 26 * 60 * 60 * 1000);
    const windowEnd   = new Date(now.getTime() - 22 * 60 * 60 * 1000);

    // Fetch recently completed bookings
    const bookings = await base44.asServiceRole.entities.Booking.filter(
      { status: 'completed' }, '-updated_date', 500
    );

    let reminded = 0;

    for (const booking of bookings) {
      if (!booking.guest_email) continue;

      // Use updated_date as proxy for when status became 'completed'
      const completedAt = new Date(booking.updated_date);
      if (completedAt < windowStart || completedAt > windowEnd) continue;

      // Check if a rating already exists from guest → host
      const existingGuestRating = await base44.asServiceRole.entities.Rating.filter(
        { request_id: booking.id, from_email: booking.guest_email }, null, 1
      );

      const link = reviewLink(booking);

      // --- Email guest ---
      if (existingGuestRating.length === 0) {
        // Try to get user's language preference
        let guestLang = 'da';
        try {
          const users = await base44.asServiceRole.entities.User.filter(
            { email: booking.guest_email }, null, 1
          );
          guestLang = getLang(users[0]);
        } catch (_) { /* default da */ }

        const gs = STRINGS.guest[guestLang];
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: booking.guest_email,
          subject: gs.subject,
          body: gs.body(
            booking.guest_name || booking.guest_email,
            booking.listing_title || '',
            link
          ),
        });
        console.log(`Guest reminder sent to ${booking.guest_email} for booking ${booking.id}`);
      }

      // --- Email host ---
      if (booking.host_email) {
        const existingHostRating = await base44.asServiceRole.entities.Rating.filter(
          { request_id: booking.id, from_email: booking.host_email }, null, 1
        );

        if (existingHostRating.length === 0) {
          let hostLang = 'da';
          try {
            const users = await base44.asServiceRole.entities.User.filter(
              { email: booking.host_email }, null, 1
            );
            hostLang = getLang(users[0]);
          } catch (_) { /* default da */ }

          const hs = STRINGS.host[hostLang];
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: booking.host_email,
            subject: hs.subject,
            body: hs.body(
              booking.host_email,
              booking.guest_name || booking.guest_email,
              `${SILA_URL}/dashboard`
            ),
          });
          console.log(`Host reminder sent to ${booking.host_email} for booking ${booking.id}`);
        }
      }

      reminded++;
    }

    return Response.json({ ok: true, reminded });
  } catch (error) {
    console.error('reviewReminder error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});