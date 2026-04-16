import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SHEET_TITLE = 'Sila Bookinger';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both admin users and scheduled automations (no user context)
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get Google Sheets access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Fetch all confirmed bookings
    const bookings = await base44.asServiceRole.entities.Booking.filter({ status: 'confirmed' }, '-created_date', 500);

    if (!bookings || bookings.length === 0) {
      return Response.json({ success: true, message: 'Ingen bekræftede bookinger at eksportere', rows: 0 });
    }

    // Check if a sheet already exists with the right name in Drive
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${SHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const searchData = await searchRes.json();

    let spreadsheetId;

    if (searchData.files && searchData.files.length > 0) {
      spreadsheetId = searchData.files[0].id;
      console.log(`[Sheets] Bruger eksisterende ark: ${spreadsheetId}`);
    } else {
      // Create new spreadsheet
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties: { title: SHEET_TITLE } }),
      });
      const created = await createRes.json();
      spreadsheetId = created.spreadsheetId;
      console.log(`[Sheets] Oprettede nyt ark: ${spreadsheetId}`);
    }

    // Build rows: header + data
    const header = [
      'Booking ID', 'Type', 'Listing', 'Gæst navn', 'Gæst email',
      'Vært email', 'Antal gæster', 'Sæder', 'Check-in', 'Check-out',
      'Total pris (DKK)', 'Status', 'Oprettet',
    ];

    const rows = bookings.map((b) => [
      b.id,
      b.type,
      b.listing_title || '',
      b.guest_name || '',
      b.guest_email || '',
      b.host_email || '',
      b.guests || '',
      b.seats || '',
      b.check_in || '',
      b.check_out || '',
      b.total_price || '',
      b.status,
      b.created_date ? new Date(b.created_date).toISOString().slice(0, 10) : '',
    ]);

    const values = [header, ...rows];

    // Clear existing data and write fresh
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:M${values.length}:clear`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );

    const updateData = await updateRes.json();
    console.log(`[Sheets] Skrev ${rows.length} rækker til ark ${spreadsheetId}`);

    return Response.json({
      success: true,
      spreadsheet_id: spreadsheetId,
      spreadsheet_url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      rows: rows.length,
    });
  } catch (error) {
    console.error('[exportBookingsToSheet] Fejl:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});