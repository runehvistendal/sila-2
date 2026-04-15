import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only current admin can promote
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const email = 'rune.runesen@gmail.com';
    
    // Get the user
    const users = await base44.asServiceRole.entities.User.filter({ email }, '', 1);
    
    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = users[0];

    // Update to admin
    await base44.asServiceRole.entities.User.update(targetUser.id, { role: 'admin' });

    return Response.json({ 
      message: `${email} er nu admin`,
      user: email
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});