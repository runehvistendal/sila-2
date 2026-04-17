import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── i18n helpers ──────────────────────────────────────────────────────────────
const SILA_URL = 'https://sila.gl';

function getLang(user) {
  return user?.preferred_language || 'da';
}

function greeting(name, lang) {
  if (lang === 'en') return `Dear ${name},`;
  if (lang === 'kl') return `Kissaanngitsumik ${name},`;
  return `Kære ${name},`;
}

function closing(lang) {
  if (lang === 'en') return 'Kind regards,<br>The Sila Team';
  if (lang === 'kl') return 'Inuiaqatigiinni nalunaarsuineq,<br>Sila-holdet';
  return 'Med venlig hilsen,<br>Sila-teamet';
}

const i18n = {
  booking_confirmed_subject: { da: 'Booking bekræftet', en: 'Booking confirmed', kl: 'Nalunaarsorneqarpoq' },
  booking_confirmed_heading: { da: 'Din booking er bekræftet!', en: 'Your booking is confirmed!', kl: 'Nalunaarsorneqarpoq!' },
  new_booking_subject: { da: 'Ny booking', en: 'New booking', kl: 'Nalunaarsorneqarpoq neriuiffigeqataanissaminnik' },
  new_booking_heading: { da: 'Du har modtaget en ny booking!', en: 'You have received a new booking!', kl: 'Nalunaarsorneqarpoq!' },
  listing: { da: 'Opslag', en: 'Listing', kl: 'Nalunaarsorneq' },
  check_in: { da: 'Check-in', en: 'Check-in', kl: 'Check-in' },
  check_out: { da: 'Check-ud', en: 'Check-out', kl: 'Check-ud' },
  guests: { da: 'Gæster', en: 'Guests', kl: 'Nalunaarsuisoqatigiit' },
  seats: { da: 'Pladser', en: 'Seats', kl: 'Inissiat' },
  price: { da: 'Pris', en: 'Price', kl: 'Akissorsaat' },
  booking_id: { da: 'Booking ID', en: 'Booking ID', kl: 'Booking ID' },
  guest: { da: 'Gæst', en: 'Guest', kl: 'Nalunaarsuisoq' },
  dashboard_link: { da: 'Se dine bookinger på dit dashboard', en: 'View your bookings on your dashboard', kl: 'Se dine bookinger på dit dashboard' },
};

function t(key, lang) {
  return (i18n[key] || {})[lang] || (i18n[key] || {})['da'] || key;
}

function tableRow(label, value) {
  if (!value) return '';
  return `<tr>
    <td style="padding:6px 12px 6px 0;color:#6b7280;font-size:14px;white-space:nowrap;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;">${value}</td>
  </tr>`;
}

function htmlEmail({ greeting: greet, heading, rows, bodyText, closing: close, dashboardText }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:#0D2137;padding:24px 32px;">
      <span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">Sila</span>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 8px;color:#111827;font-size:15px;">${greet}</p>
      <p style="margin:0 0 24px;color:#111827;font-size:18px;font-weight:700;">${heading}</p>
      <table style="border-collapse:collapse;width:100%;margin-bottom:24px;">
        ${rows}
      </table>
      ${bodyText ? `<p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">${bodyText}</p>` : ''}
      <p style="margin:0 0 4px;color:#374151;font-size:14px;">
        <a href="${SILA_URL}/dashboard" style="color:#1d4ed8;text-decoration:none;">${dashboardText}</a>
      </p>
    </div>
    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;">
      <p style="margin:0;color:#6b7280;font-size:13px;">${close}</p>
      <p style="margin:6px 0 0;color:#9ca3af;font-size:12px;"><a href="${SILA_URL}" style="color:#9ca3af;">${SILA_URL}</a></p>
    </div>
  </div>
</body>
</html>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { booking_id } = await req.json();
    if (!booking_id) return Response.json({ error: 'Missing booking_id' }, { status: 400 });

    const booking = await base44.asServiceRole.entities.Booking.filter({ id: booking_id }, null, 1).then(r => r[0]);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    const isHost = booking.host_email === user.email;
    const isAdmin = user.role === 'admin';
    if (!isHost && !isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Look up guest's preferred language
    const guestUsers = await base44.asServiceRole.entities.User.filter({ email: booking.guest_email }, null, 1).catch(() => []);
    const guestLang = getLang(guestUsers[0]);
    const guestName = booking.guest_name || booking.guest_email;

    // Guest email
    const guestRows = [
      tableRow(t('booking_id', guestLang), booking.id),
      tableRow(t('listing', guestLang), booking.listing_title),
      tableRow(t('check_in', guestLang), booking.check_in),
      tableRow(t('check_out', guestLang), booking.check_out),
      tableRow(t('guests', guestLang), booking.guests),
      tableRow(t('seats', guestLang), booking.seats),
      tableRow(t('price', guestLang), booking.total_price ? `${booking.total_price} DKK` : null),
    ].join('');

    const guestHtml = htmlEmail({
      greeting: greeting(guestName, guestLang),
      heading: t('booking_confirmed_heading', guestLang),
      rows: guestRows,
      dashboardText: t('dashboard_link', guestLang),
      closing: closing(guestLang),
    });

    await base44.integrations.Core.SendEmail({
      to: booking.guest_email,
      subject: `${t('booking_confirmed_subject', guestLang)}: ${booking.listing_title}`,
      body: guestHtml,
      from_name: 'Sila',
    });

    // Host email
    if (booking.host_email) {
      const hostUsers = await base44.asServiceRole.entities.User.filter({ email: booking.host_email }, null, 1).catch(() => []);
      const hostLang = getLang(hostUsers[0]);

      const hostRows = [
        tableRow(t('booking_id', hostLang), booking.id),
        tableRow(t('guest', hostLang), booking.guest_name || booking.guest_email),
        tableRow(t('listing', hostLang), booking.listing_title),
        tableRow(t('check_in', hostLang), booking.check_in),
        tableRow(t('check_out', hostLang), booking.check_out),
        tableRow(t('guests', hostLang), booking.guests),
        tableRow(t('seats', hostLang), booking.seats),
        tableRow(t('price', hostLang), booking.total_price ? `${booking.total_price} DKK` : null),
      ].join('');

      const hostHtml = htmlEmail({
        greeting: greeting('', hostLang).replace(',', ''),
        heading: t('new_booking_heading', hostLang),
        rows: hostRows,
        dashboardText: t('dashboard_link', hostLang),
        closing: closing(hostLang),
      });

      await base44.integrations.Core.SendEmail({
        to: booking.host_email,
        subject: `${t('new_booking_subject', hostLang)}: ${booking.listing_title}`,
        body: hostHtml,
        from_name: 'Sila',
      });
    }

    console.log(`Confirmation emails sent for booking ${booking_id}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending confirmation:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});