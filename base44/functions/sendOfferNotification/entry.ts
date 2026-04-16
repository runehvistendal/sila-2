import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { message_id, request_id, request_type } = await req.json();

    if (!message_id || !request_id || !request_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get message
    const message = await base44.asServiceRole.entities.Message.filter({ id: message_id }, null, 1).then(r => r[0]);
    if (!message || message.message_type !== 'offer') {
      return Response.json({ error: 'Message not found or not an offer' }, { status: 404 });
    }

    // Get request details
    let request, guestEmail, guestName;
    if (request_type === 'transport') {
      request = await base44.asServiceRole.entities.TransportRequest.filter({ id: request_id }, null, 1).then(r => r[0]);
      guestEmail = request?.guest_email;
      guestName = request?.guest_name || guestEmail?.split('@')[0];
    } else if (request_type === 'cabin') {
      request = await base44.asServiceRole.entities.CabinRequest.filter({ id: request_id }, null, 1).then(r => r[0]);
      guestEmail = request?.guest_email;
      guestName = request?.guest_name || guestEmail?.split('@')[0];
    }

    if (!request || !guestEmail) {
      return Response.json({ error: 'Request or guest email not found' }, { status: 404 });
    }

    // Send email to guest
    const offerData = message.offer_data || {};
    const subject = `Nyt tilbud modtaget`;
    const body = `
Hej ${guestName},

${message.sender_name} har sendt et tilbud på din forespørgsel!

Pris: ${offerData.price_dkk} DKK
${offerData.seats ? `Pladser: ${offerData.seats}` : ''}
${offerData.note ? `Besked: ${offerData.note}` : ''}

Se detaljer og accepter tilbuddet på dit dashboard.

Med venlig hilsen
Sila
    `;

    await base44.integrations.Core.SendEmail({
      to: guestEmail,
      subject,
      body,
      from_name: 'Sila'
    });

    console.log(`Offer notification sent to ${guestEmail}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending offer notification:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});