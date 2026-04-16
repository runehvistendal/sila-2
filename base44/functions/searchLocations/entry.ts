import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Fuzzy search: check if search matches name or postal code
function fuzzyMatch(searchTerm, location) {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return true;

  // Exact or prefix match on postal code
  if (location.postal_code.startsWith(term)) return true;

  // Fuzzy match on names (Levenshtein-like)
  const nameGl = location.name_gl.toLowerCase();
  const nameDk = location.name_dk.toLowerCase();

  // Simple fuzzy: contains or starts with
  if (nameGl.includes(term) || nameGl.startsWith(term)) return true;
  if (nameDk.includes(term) || nameDk.startsWith(term)) return true;

  return false;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require authenticated user — prevents unauthenticated scraping of location database
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { query, userLat, userLon, limit = 10 } = body;

    if (!query || typeof query !== 'string') {
      return Response.json({ error: 'Missing or invalid query parameter' }, { status: 400 });
    }

    // Fetch all locations
    const allLocations = await base44.entities.Location.list(null, 500);

    // Filter by fuzzy match
    const matched = allLocations.filter(loc => fuzzyMatch(query, loc));

    // Sort results
    const sorted = matched.sort((a, b) => {
      // Prioritize exact postal code match
      const queryLower = query.toLowerCase().trim();
      const aPostalMatch = a.postal_code === queryLower ? 0 : 1;
      const bPostalMatch = b.postal_code === queryLower ? 0 : 1;
      if (aPostalMatch !== bPostalMatch) return aPostalMatch - bPostalMatch;

      // If user location provided, sort by distance
      if (userLat && userLon) {
        const distA = calculateDistance(userLat, userLon, a.latitude, a.longitude);
        const distB = calculateDistance(userLat, userLon, b.latitude, b.longitude);
        return distA - distB;
      }

      // Prioritize major hubs, then by name length (shorter = more likely match)
      if (a.is_major_hub !== b.is_major_hub) return a.is_major_hub ? -1 : 1;
      return a.name_dk.length - b.name_dk.length;
    });

    return Response.json({
      locations: sorted.slice(0, limit),
      total: matched.length
    });
  } catch (error) {
    console.error('Search locations error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});