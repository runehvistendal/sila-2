import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    // Verify this is an internal entity automation (not external)
    if (!payload.event || payload.event.type !== 'create') {
      return Response.json({ error: 'Invalid event source' }, { status: 400 });
    }

    const booking = payload.data;

    if (!booking?.guest_email) {
      return Response.json({ ok: true, skipped: 'no guest email' });
    }

    const checkInStr = booking.check_in ? new Date(booking.check_in).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' }) : '–';
    const checkOutStr = booking.check_out ? new Date(booking.check_out).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' }) : '–';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: booking.guest_email,
      subject: `Bookingbekræftelse – ${booking.listing_title || 'Din booking på Sila'}`,
      body: `Hej ${booking.guest_name || 'rejsende'},

Tak for din booking på Sila! Her er en oversigt:

📍 Hytte: ${booking.listing_title || '–'}
📅 Ankomst: ${checkInStr}
📅 Afrejse: ${checkOutStr}
👥 Gæster: ${booking.guests || 1}
💰 Total: ${booking.total_price ? booking.total_price + ' DKK' : '–'}

Din booking er nu sendt til værten, som vil bekræfte snarest.

Spørgsmål? Svar på denne mail eller log ind på Sila.

God tur!
Sila-teamet`,
    });

    // Also notify the host if we have their email
    if (booking.host_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: booking.host_email,
        subject: `Ny bookingforespørgsel – ${booking.listing_title}`,
        body: `Hej,

Du har modtaget en ny bookingforespørgsel på Sila!

👤 Gæst: ${booking.guest_name || booking.guest_email}
📅 Ankomst: ${checkInStr}
📅 Afrejse: ${checkOutStr}
👥 Gæster: ${booking.guests || 1}
💰 Total: ${booking.total_price ? booking.total_price + ' DKK' : '–'}
${booking.message ? `\n💬 Besked: "${booking.message}"` : ''}

Log ind på Sila for at bekræfte eller afvise bookingen.

Sila-teamet`,
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});