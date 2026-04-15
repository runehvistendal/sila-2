import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, reason } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate confirmation token
    const token = crypto.getRandomValues(new Uint8Array(32));
    const tokenHex = Array.from(token).map(b => b.toString(16).padStart(2, '0')).join('');

    // Create deletion request (pending confirmation)
    const deleteRequest = await base44.asServiceRole.entities.DataDeleteRequest.create({
      user_email: email,
      reason: reason || '',
      status: 'pending',
      confirmation_token: tokenHex,
      requested_at: new Date().toISOString(),
    });

    // TODO: Send confirmation email with token to user
    console.log(`Deletion request created for ${email}, token: ${tokenHex}`);

    return Response.json({
      success: true,
      message: 'Deletion request received. Check your email to confirm.',
      request_id: deleteRequest.id,
    });
  } catch (error) {
    console.error('Deletion request error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});