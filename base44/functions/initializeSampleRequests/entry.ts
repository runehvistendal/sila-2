import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Check if there are existing requests
    const transportCount = await base44.entities.TransportRequest.filter({}, '-created_date', 1);
    const cabinCount = await base44.entities.CabinRequest.filter({}, '-created_date', 1);

    if (transportCount.length > 0 || cabinCount.length > 0) {
      return Response.json({ message: 'Sample data already exists' });
    }

    // Create sample transport requests
    const sampleTransportRequests = [
      {
        from_location: 'Nuuk',
        to_location: 'Ilulissat',
        travel_date: '2026-05-15',
        passengers: 2,
        message: 'Vi søger transport til Ilulissat. Vi har 2 store kufferter.',
        guest_name: 'Anna Jensen',
        guest_email: 'anna@example.com',
        status: 'pending',
      },
      {
        from_location: 'Sisimiut',
        to_location: 'Qeqertarsuaq',
        travel_date: '2026-05-20',
        passengers: 4,
        message: 'Familie på 4 personer søger transport til Qeqertarsuaq',
        guest_name: 'Mikael Petersen',
        guest_email: 'mikael@example.com',
        status: 'pending',
      },
      {
        from_location: 'Nuuk',
        to_location: 'Tasiilaq',
        travel_date: '2026-06-01',
        passengers: 3,
        message: 'Tre venner på eventyrjagt',
        guest_name: 'Jens Larsen',
        guest_email: 'jens@example.com',
        status: 'quoted',
      },
      {
        from_location: 'Ilulissat',
        to_location: 'Nuuk',
        travel_date: '2026-05-25',
        passengers: 2,
        message: 'Vi skal tilbage til Nuuk efter 5 dages besøg',
        guest_name: 'Lisa Hansen',
        guest_email: 'lisa@example.com',
        status: 'pending',
      },
      {
        from_location: 'Aasiaat',
        to_location: 'Disko',
        travel_date: '2026-06-10',
        passengers: 5,
        message: 'Gruppe på 5. Vi interesserer os for isbjørne og fugletårne',
        guest_name: 'Erik Andersen',
        guest_email: 'erik@example.com',
        status: 'pending',
      },
    ];

    // Create sample cabin requests
    const sampleCabinRequests = [
      {
        location: 'Ilulissat',
        check_in: '2026-05-20',
        check_out: '2026-05-25',
        guests: 4,
        note: 'Vi søger en hytte tæt ved eller med udsigt til isbræen',
        guest_name: 'Søren Olsen',
        guest_email: 'soren@example.com',
        status: 'pending',
      },
      {
        location: 'Nuuk',
        check_in: '2026-06-01',
        check_out: '2026-06-08',
        guests: 2,
        note: 'Præfer hytte med moderne faciliteter og Wi-Fi',
        guest_name: 'Maria Gonzalez',
        guest_email: 'maria@example.com',
        status: 'pending',
      },
      {
        location: 'Sisimiut',
        check_in: '2026-05-15',
        check_out: '2026-05-22',
        guests: 3,
        note: 'Vi har interesse i hvalsafari - kan værten hjælpe?',
        guest_name: 'Pablo Rodriguez',
        guest_email: 'pablo@example.com',
        status: 'quoted',
      },
      {
        location: 'Qeqertarsuaq',
        check_in: '2026-06-05',
        check_out: '2026-06-12',
        guests: 5,
        note: 'Familieophold. Vi søger hytte med lækker køkken',
        guest_name: 'Elena Rossi',
        guest_email: 'elena@example.com',
        status: 'pending',
      },
      {
        location: 'Tasiilaq',
        check_in: '2026-05-25',
        check_out: '2026-06-01',
        guests: 2,
        note: 'Honeymooners! Vi søger en romantisk isoleret hytte',
        guest_name: 'Sophie Dubois',
        guest_email: 'sophie@example.com',
        status: 'pending',
      },
    ];

    // Bulk create
    await base44.entities.TransportRequest.bulkCreate(sampleTransportRequests);
    await base44.entities.CabinRequest.bulkCreate(sampleCabinRequests);

    return Response.json({
      success: true,
      transportCreated: sampleTransportRequests.length,
      cabinCreated: sampleCabinRequests.length,
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});