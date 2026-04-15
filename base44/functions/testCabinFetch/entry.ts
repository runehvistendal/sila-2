import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const cabins = await base44.asServiceRole.entities.Cabin.filter({ status: 'active' }, '-created_date', 10);
    
    console.log('Fetched cabins:', cabins.length);
    console.log('Sample cabin:', cabins[0]);
    
    return Response.json({
      success: true,
      count: cabins.length,
      cabins: cabins
    });
  } catch (error) {
    console.error('Error fetching cabins:', error);
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});