import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const [cabins, transports] = await Promise.all([
      base44.asServiceRole.entities.Cabin.filter({ status: 'active' }, '-created_date', 100),
      base44.asServiceRole.entities.Transport.filter({ status: 'scheduled' }, '-departure_date', 100),
    ]);
    
    return Response.json({ 
      cabins: cabins || [],
      transports: transports || []
    });
  } catch (error) {
    console.error('Error listing:', error);
    return Response.json({ 
      error: error.message, 
      cabins: [], 
      transports: [] 
    }, { status: 500 });
  }
});