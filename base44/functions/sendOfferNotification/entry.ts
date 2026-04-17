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
  offer_subject: { da: 'Nyt tilbud modtaget', en: 'New offer received', kl: 'Nyt tilbud modtaget' },
  offer_heading: { da: 'Du har modtaget et nyt tilbud!', en: 'You have received a new offer!', kl: 'Du har modtaget et nyt tilbud!' },
  offer_body: { da: 'Se detaljer og accepter tilbuddet på dit dashboard.', en: 'View details and accept the offer on your dashboard.', kl: 'Se detaljer og accepter tilbuddet på dit dashboard.' },
  sender: { da: 'Tilbud fra', en: 'Offer from', kl: 'Tilbud fra' },
  price: { da: 'Pris', en: 'Price', kl: 'Akissorsaat' },
  seats: { da: 'Pladser', en: 'Seats', kl: 'Inissiat' },
  note: { da: 'Besked', en: 'Note', kl: 'Nalunaarsuiffik' },
  dashboard_link: { da: 'Se tilbuddet på dit dashboard', en: 'View the offer on your dashboard', kl: 'Se tilbuddet på dit dashboard' },
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
    <div style="background:#0D2137;padding:24px 32px;">
      <span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">Sila</span>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 8px;color:#111827;font-size:15px;">${greet}</p>
      <p style="margin:0 0 24px;color:#111827;font-size:18px;font-weight:700;">${heading}</p>
      <table style="border-collapse:collapse;width:100%;margin-bottom:24px;">${rows}</table>
      ${bodyText ? `<p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">${bodyText}</p>` : ''}
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

    const { message_id, request_id, request_type } = await req.json();
    if (!message_id || !request_id || !request_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const message = await base44.asServiceRole.entities.Message.filter({ id: message_id }, null, 1).then(r => r[0]);
    if (!message || message.message_type !== 'offer') {
      return Response.json({ error: 'Message not found or not an offer' }, { status: 404 });
    }

    const isAdmin = user.role === 'admin';
    if (message.sender_email !== user.email && !isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let request, guestEmail, guestName;
    if (request_type === 'transport') {
      request = await base44.asServiceRole.entities.TransportRequest.filter({ id: request_id }, null, 1).then(r => r[0]);
    } else if (request_type === 'cabin') {
      request = await base44.asServiceRole.entities.CabinRequest.filter({ id: request_id }, null, 1).then(r => r[0]);
    }
    guestEmail = request?.guest_email;
    guestName = request?.guest_name || guestEmail?.split('@')[0];

    if (!request || !guestEmail) {
      return Response.json({ error: 'Request or guest email not found' }, { status: 404 });
    }

    const guestUsers = await base44.asServiceRole.entities.User.filter({ email: guestEmail }, null, 1).catch(() => []);
    const lang = getLang(guestUsers[0]);

    const offerData = message.offer_data || {};
    const rows = [
      tableRow(t('sender', lang), message.sender_name),
      tableRow(t('price', lang), offerData.price_dkk ? `${offerData.price_dkk} DKK` : null),
      tableRow(t('seats', lang), offerData.seats),
      tableRow(t('note', lang), offerData.note),
    ].join('');

    const html = htmlEmail({
      greeting: greeting(guestName, lang),
      heading: t('offer_heading', lang),
      rows,
      bodyText: t('offer_body', lang),
      dashboardText: t('dashboard_link', lang),
      closing: closing(lang),
    });

    await base44.integrations.Core.SendEmail({
      to: guestEmail,
      subject: t('offer_subject', lang),
      body: html,
      from_name: 'Sila',
    });

    console.log(`Offer notification sent to ${guestEmail}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending offer notification:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});