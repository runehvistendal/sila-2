import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Generate analytics insights from booking and request data
 * Can be called periodically to analyze platform performance
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can access analytics
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all bookings and requests
    const bookings = await base44.asServiceRole.entities.Booking.list('-created_date', 500);
    const transportRequests = await base44.asServiceRole.entities.TransportRequest.list('-created_date', 500);
    const cabinRequests = await base44.asServiceRole.entities.CabinRequest.list('-created_date', 500);
    const offers = await base44.asServiceRole.entities.Message.filter({ message_type: 'offer' }, '-created_date', 500);

    // Calculate funnels
    const totalRequests = transportRequests.length + cabinRequests.length;
    const totalOffers = offers.length;
    const completedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

    const requestToOfferRate = totalRequests > 0 ? ((totalOffers / totalRequests) * 100).toFixed(2) : 0;
    const offerToBookingRate = totalOffers > 0 ? ((completedBookings / totalOffers) * 100).toFixed(2) : 0;
    const conversionRate = totalRequests > 0 ? ((completedBookings / totalRequests) * 100).toFixed(2) : 0;

    // Popular locations
    const locationStats = {};
    transportRequests.forEach(req => {
      const loc = req.to_location;
      if (!locationStats[loc]) {
        locationStats[loc] = { requests: 0, bookings: 0 };
      }
      locationStats[loc].requests++;
    });

    cabinRequests.forEach(req => {
      const loc = req.location;
      if (!locationStats[loc]) {
        locationStats[loc] = { requests: 0, bookings: 0 };
      }
      locationStats[loc].requests++;
    });

    bookings.forEach(booking => {
      // Try to extract location from booking
      const location = booking.listing_id; // Would need additional mapping
      if (location && locationStats[location]) {
        locationStats[location].bookings++;
      }
    });

    // Revenue metrics
    const totalRevenue = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + (b.total_price || 0), 0);

    const avgBookingValue = completedBookings > 0 ? (totalRevenue / completedBookings).toFixed(2) : 0;

    // Time period
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const last30Days = {
      requests: transportRequests.filter(r => new Date(r.created_date) >= thirtyDaysAgo).length,
      bookings: bookings.filter(b => b.status === 'confirmed' && new Date(b.created_date) >= thirtyDaysAgo).length,
    };

    const report = {
      generated_at: new Date().toISOString(),
      period: 'all_time',
      summary: {
        total_requests: totalRequests,
        total_offers: totalOffers,
        completed_bookings: completedBookings,
        cancelled_bookings: cancelledBookings,
      },
      conversion_funnels: {
        request_to_offer_rate_percent: requestToOfferRate,
        offer_to_booking_rate_percent: offerToBookingRate,
        overall_conversion_rate_percent: conversionRate,
      },
      revenue: {
        total_revenue_dkk: totalRevenue,
        avg_booking_value_dkk: avgBookingValue,
      },
      locations: Object.entries(locationStats)
        .map(([location, stats]) => ({ location, ...stats }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 10),
      last_30_days: last30Days,
    };

    console.log('[Analytics] Report generated', JSON.stringify(report, null, 2));

    return Response.json(report);
  } catch (error) {
    console.error('[Analytics] Report generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});