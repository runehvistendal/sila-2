import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { booking_id, guest_email, provider_email, life_vests_offered, equipment_visible, felt_safe, additional_comments } = await req.json();

    // Create SafetyFeedback record
    await base44.entities.SafetyFeedback.create({
      booking_id,
      guest_email,
      provider_email,
      life_vests_offered,
      equipment_visible,
      felt_safe,
      additional_comments,
    });

    // Check if any safety concern was raised
    const hasViolation = !life_vests_offered || !equipment_visible || !felt_safe;

    if (hasViolation) {
      // Get or create ProviderTrust record
      const existing = await base44.entities.ProviderTrust.filter({ provider_email }, null, 1);
      let trustRecord;

      if (existing.length === 0) {
        trustRecord = await base44.entities.ProviderTrust.create({
          provider_email,
          safety_violation_count: 1,
          trust_score: 80,
          status: 'warning',
        });
      } else {
        const newViolationCount = (existing[0].safety_violation_count || 0) + 1;
        let newStatus = 'warning';
        let newTrustScore = 100 - (newViolationCount * 20);

        if (newViolationCount >= 3) {
          newStatus = 'suspended_perm';
          newTrustScore = 0;
        } else if (newViolationCount === 2) {
          newStatus = 'suspended_temp';
          newTrustScore = 40;
        }

        trustRecord = await base44.entities.ProviderTrust.update(existing[0].id, {
          safety_violation_count: newViolationCount,
          trust_score: Math.max(0, newTrustScore),
          status: newStatus,
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error processing safety feedback:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});