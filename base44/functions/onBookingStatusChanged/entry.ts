import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event } = payload;

    // Verify this is a trusted internal entity automation event
    if (!event || !event.type || !event.entity_name || !event.entity_id) {
      return Response.json({ error: 'Invalid event source' }, { status: 400 });
    }

    // Only accept update events from the Booking entity
    if (event.type !== 'update' || event.entity_name !== 'Booking') {
      return Response.json({ status: 'skipped', reason: 'Invalid event type or entity' }, { status: 400 });
    }

    const booking = event.data;
    
    // Send confirmation email when status changes to confirmed
    if (booking.status === 'confirmed') {
      await base44.functions.invoke('sendBookingConfirmation', {
        booking_id: booking.id
      });
    }

    // Send rejection email when status changes to declined
    if (booking.status === 'declined') {
      await base44.functions.invoke('sendBookingRejection', {
        booking_id: booking.id
      });
    }

    return Response.json({ success: true, status: booking.status });
  } catch (error) {
    console.error('Error in onBookingStatusChanged:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});