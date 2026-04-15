import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Runs every Monday. Closes CabinRequests older than 14 days still in 'pending' status.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const oldRequests = await base44.asServiceRole.entities.CabinRequest.filter({ status: 'pending' }, 'created_date', 500);

    const toClose = oldRequests.filter(r => r.created_date < cutoff);

    let closed = 0;
    for (const r of toClose) {
      await base44.asServiceRole.entities.CabinRequest.update(r.id, { status: 'cancelled' });

      // Notify the guest
      if (r.guest_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: r.guest_email,
          subject: 'Din hytte-forespørgsel er lukket',
          body: `Hej ${r.guest_name || 'rejsende'},

Din hytte-forespørgsel for ${r.location} (${r.check_in} – ${r.check_out}) har ikke modtaget svar inden for 14 dage og er nu lukket.

Du er velkommen til at oprette en ny forespørgsel på Sila – måske er der nye hosts, der kan hjælpe dig!

Sila-teamet`,
        });
      }
      closed++;
    }

    return Response.json({ ok: true, closed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});