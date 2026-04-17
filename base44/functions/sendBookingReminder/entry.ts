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
  reminder_subject: { da: 'Påmindelse: Din booking starter snart', en: 'Reminder: Your booking starts soon', kl: 'Påmindelse: Din booking starter snart' },
  reminder_heading: { da: 'Din booking starter snart!', en: 'Your booking is coming up!', kl: 'Din booking starter snart!' },
  listing: { da: 'Opslag', en: 'Listing', kl: 'Nalunaarsorneq' },
  check_in: { da: 'Check-in', en: 'Check-in', kl: 'Check-in' },
  guests: { da: 'Gæster', en: 'Guests', kl: 'Nalunaarsuisoqatigiit' },
  dashboard_link: { da: 'Se dine bookinger på dit dashboard', en: 'View your bookings on your dashboard', kl: 'Se dine bookinger på dit dashboard' },
  looking_forward: { da: 'Vi glæder os til at se dig!', en: 'We look forward to seeing you!', kl: 'Vi glæder os til at se dig!' },
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

    const schedulerSecret = Deno.env.get('SCHEDULER_SECRET');
    const authHeader = req.headers.get('authorization') || '';
    if (!schedulerSecret || authHeader !== `Bearer ${schedulerSecret}`) {
      return Response.json({ error: 'Forbidden: Scheduler access required' }, { status: 403 });
    }

    const bookings = await base44.asServiceRole.entities.Booking.filter({ status: 'confirmed' }, '-created_date', 100);

    const today = new Date();
    const inSevenDays = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingBookings = bookings.filter(b => {
      const checkInDate = new Date(b.check_in);
      return checkInDate >= today && checkInDate <= inSevenDays && !b.reminder_sent;
    });

    for (const booking of upcomingBookings) {
      const guestUsers = await base44.asServiceRole.entities.User.filter({ email: booking.guest_email }, null, 1).catch(() => []);
      const lang = getLang(guestUsers[0]);
      const guestName = booking.guest_name || booking.guest_email;

      const rows = [
        tableRow(t('listing', lang), booking.listing_title),
        tableRow(t('check_in', lang), booking.check_in),
        tableRow(t('guests', lang), booking.guests),
      ].join('');

      const html = htmlEmail({
        greeting: greeting(guestName, lang),
        heading: t('reminder_heading', lang),
        rows,
        bodyText: t('looking_forward', lang),
        dashboardText: t('dashboard_link', lang),
        closing: closing(lang),
      });

      await base44.integrations.Core.SendEmail({
        to: booking.guest_email,
        subject: `${t('reminder_subject', lang)}: ${booking.listing_title}`,
        body: html,
        from_name: 'Sila',
      });

      await base44.asServiceRole.entities.Booking.update(booking.id, { reminder_sent: true });
    }

    console.log(`Sent ${upcomingBookings.length} booking reminders`);
    return Response.json({ sent: upcomingBookings.length });
  } catch (error) {
    console.error('Error sending reminders:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});