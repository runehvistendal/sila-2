import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Du skal være logget ind for at anmelde.' }, { status: 401 });
    }

    const { booking_id, rating, comment } = await req.json();

    if (!booking_id) {
      return Response.json({ error: 'booking_id er påkrævet.' }, { status: 400 });
    }
    if (!rating || rating < 1 || rating > 5) {
      return Response.json({ error: 'Bedømmelse skal være mellem 1 og 5.' }, { status: 400 });
    }

    // Fetch the booking
    const booking = await base44.asServiceRole.entities.Booking.get(booking_id);
    if (!booking) {
      return Response.json({ error: 'Booking ikke fundet.' }, { status: 404 });
    }

    // Only allow reviews for completed bookings
    if (booking.status !== 'completed') {
      return Response.json({ error: 'Du kan kun anmelde gennemførte bookinger.' }, { status: 403 });
    }

    // Check that the user is either the guest or the host of this booking
    const isGuest = booking.guest_email === user.email;
    const isHost = booking.host_email === user.email;

    if (!isGuest && !isHost) {
      return Response.json({ error: 'Du er hverken gæst eller vært på denne booking.' }, { status: 403 });
    }

    // Check if a review already exists for this booking from this user
    const existing = await base44.asServiceRole.entities.Review.filter({
      booking_id,
      reviewer_email: user.email,
    });

    if (existing && existing.length > 0) {
      return Response.json({ error: 'Du har allerede anmeldt denne booking.' }, { status: 409 });
    }

    // Create the review
    const review = await base44.asServiceRole.entities.Review.create({
      booking_id,
      listing_type: booking.type,
      listing_id: booking.listing_id,
      listing_title: booking.listing_title,
      reviewer_name: user.full_name || user.email.split('@')[0],
      reviewer_email: user.email,
      rating,
      comment: comment?.trim() || '',
      provider_email: booking.host_email,
    });

    return Response.json({ success: true, review });
  } catch (error) {
    console.error('createReview error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});