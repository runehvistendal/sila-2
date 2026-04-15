import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, name, subject, message, booking_id } = await req.json();

    if (!email || !subject || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create ticket in database
    const ticket = await base44.asServiceRole.entities.SupportTicket.create({
      email,
      name: name || 'Guest',
      subject,
      message,
      booking_id: booking_id || null,
      status: 'open',
      priority: 'medium',
    });

    // Send confirmation email to customer
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: 'Support ticket received - Sila',
      body: `Hi ${name || 'there'},

Thank you for contacting Sila support. We have received your message:

Subject: ${subject}

Our team will get back to you as soon as possible at support@sila.gl.

Ticket ID: ${ticket.id}

Best regards,
Sila Support Team`,
      from_name: 'Sila Support',
    });

    return Response.json({ 
      success: true, 
      ticket_id: ticket.id,
      message: 'Thank you for your inquiry. A confirmation has been sent to your email.' 
    });
  } catch (error) {
    console.error('Error submitting support ticket:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});