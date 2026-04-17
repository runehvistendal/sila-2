import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SILA_URL = 'https://sila.gl';

function buildLowScoreEmailHtml(providerName, lang) {
  const texts = {
    da: {
      subject: 'Din trustscore er lav — læs hvordan du kan forbedre den',
      heading: 'Din Trust Score er lav',
      body: 'Vi har bemærket, at din Trust Score er faldet under 50. En lav score kan påvirke synlighed og booking-muligheder på Sila.',
      cta: 'Læs hvordan du forbedrer din score',
      closing: 'Med venlig hilsen,<br>Sila-teamet',
      greeting: `Kære ${providerName},`,
    },
    en: {
      subject: 'Your trust score is low — learn how to improve it',
      heading: 'Your Trust Score is Low',
      body: 'We noticed your Trust Score has dropped below 50. A low score may affect your visibility and booking opportunities on Sila.',
      cta: 'Learn how to improve your score',
      closing: 'Kind regards,<br>The Sila Team',
      greeting: `Dear ${providerName},`,
    },
    kl: {
      subject: 'Din trustscore er lav — læs hvordan du kan forbedre den',
      heading: 'Din Trust Score er lav',
      body: 'Vi har bemærket, at din Trust Score er faldet under 50.',
      cta: 'Læs hvordan du forbedrer din score',
      closing: 'Inuiaqatigiinni nalunaarsuineq,<br>Sila-holdet',
      greeting: `Kissaanngitsumik ${providerName},`,
    },
  };
  const c = texts[lang] || texts['da'];
  return {
    subject: c.subject,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#0D2137;padding:24px 32px;">
      <span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">Sila</span>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 8px;color:#111827;font-size:15px;">${c.greeting}</p>
      <p style="margin:0 0 16px;color:#111827;font-size:18px;font-weight:700;">${c.heading}</p>
      <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.6;">${c.body}</p>
      <p style="margin:0 0 4px;"><a href="${SILA_URL}/trust-score" style="color:#1d4ed8;font-size:14px;">${c.cta}</a></p>
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;">
      <p style="margin:0;color:#6b7280;font-size:13px;">${c.closing}</p>
      <p style="margin:6px 0 0;"><a href="${SILA_URL}" style="color:#9ca3af;font-size:12px;">${SILA_URL}</a></p>
    </div>
  </div>
</body>
</html>`,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduler secret OR admin user
    const schedulerSecret = Deno.env.get('SCHEDULER_SECRET');
    const authHeader = req.headers.get('authorization') || '';
    const isScheduler = schedulerSecret && authHeader === `Bearer ${schedulerSecret}`;

    let isAdmin = false;
    if (!isScheduler) {
      const user = await base44.auth.me().catch(() => null);
      isAdmin = user?.role === 'admin';
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    // Support direct call with provider_email OR automation payload from entity events
    let provider_email = body.provider_email;
    if (!provider_email && body.data) {
      // Booking completed: host_email is the provider
      if (body.data.host_email) provider_email = body.data.host_email;
      // Rating submitted: to_email is the provider being rated
      if (body.data.to_email) provider_email = body.data.to_email;
    }

    // Determine which providers to calculate for
    let providerEmails = [];
    if (provider_email) {
      providerEmails = [provider_email];
    } else {
      // Recalculate for all providers with existing trust records
      const existing = await base44.asServiceRole.entities.ProviderTrust.list();
      providerEmails = existing.map(p => p.provider_email).filter(Boolean);
      // Also include any providers who have received ratings recently
      const ratings = await base44.asServiceRole.entities.Rating.list('-created_date', 200);
      for (const r of ratings) {
        if (r.to_email && !providerEmails.includes(r.to_email)) providerEmails.push(r.to_email);
      }
    }

    const results = [];

    for (const email of providerEmails) {
      // 1. Ratings component (60%)
      const ratings = await base44.asServiceRole.entities.Rating.filter({ to_email: email });
      const avgStars = ratings.length > 0
        ? ratings.reduce((s, r) => s + (r.stars || 0), 0) / ratings.length
        : 0;
      const ratingsScore = (avgStars / 5) * 60;

      // 2. Disputes / incidents component (20%)
      const disputes = await base44.asServiceRole.entities.Dispute.filter({ respondent_email: email });
      const incidents = await base44.asServiceRole.entities.IncidentReport.filter({});
      const providerIncidents = incidents.filter(i => (i.involved_parties || []).includes(email));
      const violationCount = disputes.length + providerIncidents.length;
      const disputeScore = Math.max(0, 20 - violationCount * 5);

      // 3. Response time component (15%)
      const confirmedBookings = await base44.asServiceRole.entities.Booking.filter({
        host_email: email, status: 'confirmed',
      }, '-created_date', 50);
      let responseScore = 7.5; // default mid score if no data
      if (confirmedBookings.length > 0) {
        const responseTimes = confirmedBookings
          .filter(b => b.created_date && b.updated_date)
          .map(b => (new Date(b.updated_date) - new Date(b.created_date)) / (1000 * 60 * 60)); // hours
        if (responseTimes.length > 0) {
          const avgHours = responseTimes.reduce((s, h) => s + h, 0) / responseTimes.length;
          // < 2 hours = full 15, < 24 hours = 10, < 72h = 5, else = 2
          responseScore = avgHours < 2 ? 15 : avgHours < 24 ? 10 : avgHours < 72 ? 5 : 2;
        }
      }

      // 4. Account age component (5%)
      const providerUsers = await base44.asServiceRole.entities.User.filter({ email }, null, 1).catch(() => []);
      const providerUser = providerUsers[0];
      let ageScore = 0;
      if (providerUser?.created_date) {
        const ageDays = (Date.now() - new Date(providerUser.created_date).getTime()) / (1000 * 60 * 60 * 24);
        ageScore = Math.min(1, ageDays / 365) * 5;
      }

      const totalScore = Math.round(ratingsScore + disputeScore + responseScore + ageScore);
      const clampedScore = Math.min(100, Math.max(0, totalScore));

      // Upsert ProviderTrust record
      const existing = await base44.asServiceRole.entities.ProviderTrust.filter({ provider_email: email }, null, 1);
      const previousScore = existing[0]?.trust_score;

      if (existing[0]) {
        await base44.asServiceRole.entities.ProviderTrust.update(existing[0].id, {
          trust_score: clampedScore,
          safety_violation_count: violationCount,
          status: clampedScore >= 70 ? 'active' : clampedScore >= 50 ? 'active' : 'warning',
        });
      } else {
        await base44.asServiceRole.entities.ProviderTrust.create({
          provider_email: email,
          trust_score: clampedScore,
          safety_violation_count: violationCount,
          status: clampedScore >= 70 ? 'active' : 'warning',
        });
      }

      // Low score warning: if just dropped below 50
      if (clampedScore < 50 && (previousScore === undefined || previousScore >= 50)) {
        const lang = providerUser?.preferred_language || 'da';
        const providerName = providerUser?.full_name || email;
        const { subject, html } = buildLowScoreEmailHtml(providerName, lang);

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject,
          body: html,
          from_name: 'Sila',
        });

        // Log as IncidentReport
        await base44.asServiceRole.entities.IncidentReport.create({
          reporter_email: 'system@sila.gl',
          incident_type: 'safety_concern',
          description: `Automatisk: Udbyderens Trust Score er faldet under 50. Score: ${clampedScore}. Provider: ${email}`,
          involved_parties: [email],
          status: 'open',
          admin_notes: `Auto-generated low trust score alert. Score: ${clampedScore}`,
        });

        console.log(`Low score warning sent to ${email} (score: ${clampedScore})`);
      }

      results.push({ email, score: clampedScore });
      console.log(`Trust score calculated for ${email}: ${clampedScore}`);
    }

    return Response.json({ success: true, results });
  } catch (error) {
    console.error('Error calculating trust score:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});