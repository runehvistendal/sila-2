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
  rejection_subject: { da: 'Booking afvist', en: 'Booking declined', kl: 'Booking afvist' },
  rejection_heading: { da: 'Din bookinganmodning er desværre afvist', en: 'Your booking request has been declined', kl: 'Din bookinganmodning er desværre afvist' },
  rejection_body: { da: 'Udbyderen har desværre afvist din bookinganmodning. Du kan se andre tilbud på Sila.', en: 'Unfortunately the provider has declined your booking request. You can find other listings on Sila.', kl: 'Udbyderen har desværre afvist din bookinganmodning. Du kan se andre tilbud på Sila.' },
  listing: { da: 'Opslag', en: 'Listing', kl: 'Nalunaarsorneq' },
  booking_id: { da: 'Booking ID', en: 'Booking ID', kl: 'Booking ID' },
  explore_link: { da: 'Udforsk andre tilbud på Sila', en: 'Explore other listings on Sila', kl: 'Udforsk andre tilbud på Sila' },
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

function htmlEmail({ greeting: greet, heading, rows, bodyText, closing: close, footerLinkText }) {
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
      ${bodyText ? `<p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">${bodyText}</p>` : ''}
      <p style="margin:0 0 4px;color:#374151;font-size:14px;">
        <a href="${SILA_URL}/cabins" style="color:#1d4ed8;text-decoration:none;">${footerLinkText}</a>
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

    const { booking_id } = await req.json();
    if (!booking_id) return Response.json({ error: 'Missing booking_id' }, { status: 400 });

    const booking = await base44.asServiceRole.entities.Booking.filter({ id: booking_id }, null, 1).then(r => r[0]);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    const isHost = booking.host_email === user.email;
    const isAdmin = user.role === 'admin';
    if (!isHost && !isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const guestUsers = await base44.asServiceRole.entities.User.filter({ email: booking.guest_email }, null, 1).catch(() => []);
    const lang = getLang(guestUsers[0]);
    const guestName = booking.guest_name || booking.guest_email;

    const rows = [
      tableRow(t('listing', lang), booking.listing_title),
      tableRow(t('booking_id', lang), booking.id),
    ].join('');

    const html = htmlEmail({
      greeting: greeting(guestName, lang),
      heading: t('rejection_heading', lang),
      rows,
      bodyText: t('rejection_body', lang),
      footerLinkText: t('explore_link', lang),
      closing: closing(lang),
    });

    await base44.integrations.Core.SendEmail({
      to: booking.guest_email,
      subject: `${t('rejection_subject', lang)}: ${booking.listing_title}`,
      body: html,
      from_name: 'Sila',
    });

    console.log(`Rejection email sent for booking ${booking_id}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending rejection:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});