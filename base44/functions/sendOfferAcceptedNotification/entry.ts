import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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
  accepted_subject: { da: 'Tilbud accepteret', en: 'Offer accepted', kl: 'Tilbud accepteret' },
  accepted_heading: { da: 'Gæsten har accepteret dit tilbud!', en: 'The guest has accepted your offer!', kl: 'Gæsten har accepteret dit tilbud!' },
  listing: { da: 'Booking', en: 'Booking', kl: 'Nalunaarsorneq' },
  guest: { da: 'Gæst', en: 'Guest', kl: 'Nalunaarsuisoq' },
  price: { da: 'Pris', en: 'Price', kl: 'Akissorsaat' },
  check_in: { da: 'Check-in', en: 'Check-in', kl: 'Check-in' },
  check_out: { da: 'Check-ud', en: 'Check-out', kl: 'Check-ud' },
  guests: { da: 'Gæster', en: 'Guests', kl: 'Nalunaarsuisoqatigiit' },
  seats: { da: 'Pladser', en: 'Seats', kl: 'Inissiat' },
  dashboard_link: { da: 'Se detaljer på dit dashboard', en: 'View details on your dashboard', kl: 'Se detaljer på dit dashboard' },
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

function htmlEmail({ greeting: greet, heading, rows, closing: close, dashboardText }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#0D2137;padding:24px 32px;">
      <span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">Sila</span>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 8px;color:#111827;font-size:15px;">${greet}</p>
      <p style="margin:0 0 24px;color:#111827;font-size:18px;font-weight:700;">${heading}</p>
      <table style="border-collapse:collapse;width:100%;margin-bottom:24px;">${rows}</table>
      <p style="margin:0 0 4px;color:#374151;font-size:14px;">
        <a href="${SILA_URL}/dashboard" style="color:#1d4ed8;text-decoration:none;">${dashboardText}</a>
      </p>
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;">
      <p style="margin:0;color:#6b7280;font-size:13px;">${close}</p>
      <p style="margin:6px 0 0;color:#9ca3af;font-size:12px;"><a href="${SILA_URL}" style="color:#9ca3af;">${SILA_URL}</a></p>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { booking_id, request_type } = await req.json();
    if (!booking_id || !request_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.filter({ id: booking_id }, null, 1).then(r => r[0]);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    if (booking.host_email) {
      const hostUsers = await base44.asServiceRole.entities.User.filter({ email: booking.host_email }, null, 1).catch(() => []);
      const lang = getLang(hostUsers[0]);

      const rows = [
        tableRow(t('listing', lang), booking.listing_title),
        tableRow(t('guest', lang), booking.guest_name || booking.guest_email),
        tableRow(t('price', lang), booking.total_price ? `${booking.total_price} DKK` : null),
        tableRow(t('check_in', lang), booking.check_in),
        tableRow(t('check_out', lang), booking.check_out),
        tableRow(t('guests', lang), booking.guests),
        tableRow(t('seats', lang), booking.seats),
      ].join('');

      const html = htmlEmail({
        greeting: greeting('', lang).replace(',', ''),
        heading: t('accepted_heading', lang),
        rows,
        dashboardText: t('dashboard_link', lang),
        closing: closing(lang),
      });

      await base44.integrations.Core.SendEmail({
        to: booking.host_email,
        subject: `${t('accepted_subject', lang)}: ${booking.listing_title}`,
        body: html,
        from_name: 'Sila',
      });
    }

    console.log(`Offer accepted notification sent for booking ${booking_id}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending offer accepted notification:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});