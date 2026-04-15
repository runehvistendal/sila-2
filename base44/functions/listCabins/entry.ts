import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { sort = '-created_date', limit = 60 } = await req.json().catch(() => ({}));
    
    const cabins = await base44.asServiceRole.entities.Cabin.filter({ status: 'active' }, sort, limit);
    return Response.json({ cabins });
  } catch (error) {
    console.error('Error listing cabins:', error);
    return Response.json({ error: error.message, cabins: [] }, { status: 500 });
  }
});