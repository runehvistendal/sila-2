import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Only allow users to download their own data, or admins to download any
    if (user.email !== email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all user-related data
    const [bookings, ratings, reviews, favourites, incidents, disputes] = await Promise.all([
      base44.entities.Booking.filter({ guest_email: email }, null, 1000),
      base44.entities.Rating.filter({ from_email: email }, null, 1000),
      base44.entities.Review.filter({ reviewer_email: email }, null, 1000),
      base44.entities.Favourite.filter({ user_email: email }, null, 1000),
      base44.entities.IncidentReport.filter({ reporter_email: email }, null, 1000),
      base44.entities.Dispute.filter({ claimant_email: email }, null, 1000),
    ]);

    const userData = {
      email,
      exported_at: new Date().toISOString(),
      bookings,
      ratings,
      reviews,
      favourites,
      incidents,
      disputes,
    };

    // Create JSON file
    const jsonData = JSON.stringify(userData, null, 2);
    
    return new Response(jsonData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="sila-data-${email}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Data download error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});