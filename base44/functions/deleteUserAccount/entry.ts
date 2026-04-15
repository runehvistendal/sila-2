import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, confirmation_token } = await req.json();

    if (!email || !confirmation_token) {
      return Response.json({ error: 'Email and token required' }, { status: 400 });
    }

    // Verify token matches pending deletion request
    const deleteRequests = await base44.asServiceRole.entities.DataDeleteRequest.filter(
      { user_email: email, status: 'confirmed' },
      null,
      1
    );

    if (!deleteRequests.length || deleteRequests[0].confirmation_token !== confirmation_token) {
      return Response.json({ error: 'Invalid or expired deletion request' }, { status: 403 });
    }

    // Delete all user data (anonymize rather than hard delete for audit trail)
    const [bookings, ratings, reviews, favourites, incidents, disputes] = await Promise.all([
      base44.asServiceRole.entities.Booking.filter({ guest_email: email }, null, 1000),
      base44.asServiceRole.entities.Rating.filter({ from_email: email }, null, 1000),
      base44.asServiceRole.entities.Review.filter({ reviewer_email: email }, null, 1000),
      base44.asServiceRole.entities.Favourite.filter({ user_email: email }, null, 1000),
      base44.asServiceRole.entities.IncidentReport.filter({ reporter_email: email }, null, 1000),
      base44.asServiceRole.entities.Dispute.filter({ claimant_email: email }, null, 1000),
    ]);

    // Delete all related records
    await Promise.all([
      ...bookings.map(b => base44.asServiceRole.entities.Booking.delete(b.id)),
      ...ratings.map(r => base44.asServiceRole.entities.Rating.delete(r.id)),
      ...reviews.map(r => base44.asServiceRole.entities.Review.delete(r.id)),
      ...favourites.map(f => base44.asServiceRole.entities.Favourite.delete(f.id)),
      ...incidents.map(i => base44.asServiceRole.entities.IncidentReport.delete(i.id)),
      ...disputes.map(d => base44.asServiceRole.entities.Dispute.delete(d.id)),
    ]);

    // Update deletion request status
    const deleteRequest = deleteRequests[0];
    await base44.asServiceRole.entities.DataDeleteRequest.update(deleteRequest.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    console.log(`Account deletion completed for ${email}`);
    return Response.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});