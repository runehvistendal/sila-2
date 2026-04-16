import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require authenticated user — prevents unauthenticated ticket creation and spam
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const { subject, message, booking_id } = await req.json();

    if (!message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use authenticated user's identity — cannot be spoofed via request body
    const customer_email = user.email;
    const customer_name = user.full_name || user.email;

    // Fetch booking details if provided
    let bookingStatus = null;
    if (booking_id) {
      const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id }, null, 1);
      if (bookings.length > 0) {
        bookingStatus = bookings[0].status;
      }
    }

    // Simple FAQ detection based on keywords
    const faqKeywords = ['cancel', 'change date', 'modify', 'refund', 'payment', 'how do i', 'what is', 'when is'];
    const isFaq = faqKeywords.some(kw => message.toLowerCase().includes(kw));

    let response = '';
    let escalationReason = null;

    if (isFaq) {
      if (message.toLowerCase().includes('cancel')) {
        response = `You can cancel your booking up to 7 days before the scheduled date for a full refund. To cancel, go to your dashboard and select "Cancel Booking". The refund will be processed within 5-7 business days.`;
      } else if (message.toLowerCase().includes('change') || message.toLowerCase().includes('modify')) {
        response = `You can modify your booking dates if available. Please contact the host/provider directly through the chat or go to your dashboard. Availability and any fees depend on the provider's policies.`;
      } else if (message.toLowerCase().includes('payment')) {
        response = `We accept all major credit cards (Visa, Mastercard, American Express) through Stripe. Payments are secure and encrypted. Your card information is never stored on our servers.`;
      } else {
        response = `Thank you for your inquiry. We're here to help! Based on your question, we recommend visiting our FAQ page or contacting the provider directly for the most accurate information.`;
      }
    } else {
      escalationReason = 'Requires detailed review or special handling';
      response = `Thank you for reaching out. Your inquiry has been escalated to our support team. We'll review your message and get back to you within 24 hours.`;
    }

    // Create support ticket
    const ticket = await base44.asServiceRole.entities.Support.create({
      customer_email,
      customer_name,
      subject,
      message,
      booking_id: booking_id || null,
      inquiry_type: isFaq ? 'faq' : 'complaint',
      ai_response: response,
      escalated: !isFaq,
      escalation_reason: escalationReason,
      status: isFaq ? 'ai_answered' : 'escalated',
    });

    console.log('[Support] Ticket created:', { id: ticket.id, escalated: !isFaq });

    return Response.json({
      ticket_id: ticket.id,
      response,
      escalated: !isFaq,
      booking_status: bookingStatus,
    });
  } catch (error) {
    console.error('[Support] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});