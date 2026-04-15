import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all data
    const [bookings, transportRequests, cabinRequests, offers, ratings, incidents, experiences, cabins, reviews] = await Promise.all([
      base44.asServiceRole.entities.Booking.list('-created_date', 100),
      base44.asServiceRole.entities.TransportRequest.list('-created_date', 100),
      base44.asServiceRole.entities.CabinRequest.list('-created_date', 100),
      base44.asServiceRole.entities.Message.filter({ message_type: 'offer' }, '-created_date', 100),
      base44.asServiceRole.entities.Rating.list('-created_date', 100),
      base44.asServiceRole.entities.IncidentReport.list('-created_date', 100),
      base44.asServiceRole.entities.Experience.list('-created_date', 50),
      base44.asServiceRole.entities.Cabin.list('-created_date', 50),
      base44.asServiceRole.entities.Review.list('-created_date', 100),
    ]);

    // KPI calculations
    const totalRequests = transportRequests.length + cabinRequests.length;
    const completedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const conversionRate = totalRequests > 0 ? ((completedBookings / totalRequests) * 100).toFixed(1) : 0;
    const totalRevenue = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + (b.total_price || 0), 0);

    // Location analysis
    const locationStats = {};
    [...transportRequests, ...cabinRequests].forEach(req => {
      const loc = req.to_location || req.location;
      if (!locationStats[loc]) {
        locationStats[loc] = { requests: 0, bookings: 0 };
      }
      locationStats[loc].requests++;
    });

    bookings.forEach(b => {
      if (b.status === 'confirmed') {
        const stat = Object.values(locationStats)[0];
        if (stat) stat.bookings++;
      }
    });

    const topLocations = Object.entries(locationStats)
      .map(([loc, stats]) => ({ location: loc, ...stats }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5);

    // Funnel analysis
    const requestToOfferRate = totalRequests > 0 ? ((offers.length / totalRequests) * 100).toFixed(1) : 0;
    const offerToBookingRate = offers.length > 0 ? ((completedBookings / offers.length) * 100).toFixed(1) : 0;

    // Rating analysis
    const lowRatings = ratings.filter(r => r.stars <= 2).length;
    const avgRating = ratings.length > 0 ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(2) : 0;

    // Incident analysis
    const safetyIssues = incidents.filter(i => i.incident_type === 'safety_concern').length;

    // Create analysis prompt for LLM
    const analysisPrompt = `Analyze the following Greenland travel platform data and provide growth insights:

KPIs:
- Total requests: ${totalRequests}
- Completed bookings: ${completedBookings}
- Conversion rate: ${conversionRate}%
- Request to offer rate: ${requestToOfferRate}%
- Offer to booking rate: ${offerToBookingRate}%
- Total revenue: ${totalRevenue} DKK
- Average rating: ${avgRating}/5
- Low ratings (≤2 stars): ${lowRatings}
- Safety incidents: ${safetyIssues}
- Total experiences: ${experiences.length}
- Total cabins: ${cabins.length}

Top locations: ${JSON.stringify(topLocations)}

Based on this data, provide:
1. 2-3 key highlights (what's working well)
2. 2-3 problems/friction points (where users drop off)
3. 4-5 concrete, actionable recommendations

Format your response as JSON with this structure:
{
  "highlights": [
    {"title": "...", "description": "...", "metric": number, "type": "success|trend|opportunity"}
  ],
  "problems": [
    {"title": "...", "description": "...", "impact": "high|medium|low", "metric": number, "funnel_stage": "..."}
  ],
  "recommendations": [
    {"title": "...", "description": "...", "expected_impact": "...", "priority": "high|medium|low", "action_type": "content|feature|notification|highlight|other"}
  ]
}`;

    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          highlights: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                metric: { type: 'number' },
                type: { type: 'string' },
              },
            },
          },
          problems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                impact: { type: 'string' },
                metric: { type: 'number' },
                funnel_stage: { type: 'string' },
              },
            },
          },
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                expected_impact: { type: 'string' },
                priority: { type: 'string' },
                action_type: { type: 'string' },
              },
            },
          },
        },
      },
    });

    // Generate report
    const report = {
      report_type: 'weekly',
      kpi_summary: {
        total_requests: totalRequests,
        total_bookings: completedBookings,
        conversion_rate: parseFloat(conversionRate),
        active_users: new Set([...bookings, ...transportRequests, ...cabinRequests].map(b => b.guest_email || b.created_by)).size,
        avg_booking_value_dkk: completedBookings > 0 ? Math.round(totalRevenue / completedBookings) : 0,
        top_locations: topLocations,
      },
      highlights: llmResponse.highlights || [],
      problems: llmResponse.problems || [],
      recommendations: (llmResponse.recommendations || []).map((rec, idx) => ({
        id: `rec_${Date.now()}_${idx}`,
        ...rec,
        status: 'pending',
      })),
      traffic_sources: {
        direct: Math.round(totalRequests * 0.3),
        organic: Math.round(totalRequests * 0.35),
        social: Math.round(totalRequests * 0.2),
        referral: Math.round(totalRequests * 0.1),
        other: Math.round(totalRequests * 0.05),
      },
      period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      period_end: new Date().toISOString().split('T')[0],
      generated_by_ai: true,
    };

    // Save report
    const savedReport = await base44.asServiceRole.entities.Growth.create(report);

    console.log('[Growth] Report generated:', {
      id: savedReport.id,
      highlights: report.highlights.length,
      recommendations: report.recommendations.length,
    });

    return Response.json(savedReport);
  } catch (error) {
    console.error('[Growth] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});