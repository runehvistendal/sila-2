import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all transports
    const transports = await base44.asServiceRole.entities.Transport.list();

    // Fetch all provider trust records
    const trustRecords = await base44.asServiceRole.entities.ProviderTrust.list();
    const trustMap = new Map(trustRecords.map(t => [t.provider_email, t]));

    // Filter out suspended providers
    const activeTransports = transports.filter(transport => {
      const trust = trustMap.get(transport.provider_email);
      if (!trust) return true; // Include if no trust record exists
      if (trust.status === 'suspended_temp' || trust.status === 'suspended_perm') return false;
      return true;
    });

    return Response.json({ transports: activeTransports });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});