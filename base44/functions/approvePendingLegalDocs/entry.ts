import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin only
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all pending suggestions
    const pendingSuggestions = await base44.entities.LegalSuggestion.filter({ status: 'pending' }, '-created_date', 100);

    if (pendingSuggestions.length === 0) {
      return Response.json({ message: 'No pending suggestions to approve', count: 0 });
    }

    // Approve all pending
    const updates = await Promise.all(
      pendingSuggestions.map(s => 
        base44.entities.LegalSuggestion.update(s.id, { 
          status: 'approved',
          admin_notes: 'Godkendt af admin'
        })
      )
    );

    return Response.json({ 
      message: `${updates.length} juridiske dokumenter godkendt`,
      count: updates.length 
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});