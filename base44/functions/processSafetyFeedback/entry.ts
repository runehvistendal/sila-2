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

    // Check if any safety concern was raised (yes/no questions)
    const hasYesNoViolation = !life_vests_offered || !equipment_visible;

    // Check if rating is low (1 or 2 = unsafe)
    const hasLowRating = felt_safe <= 2;

    if (hasYesNoViolation || hasLowRating) {
      // Get or create ProviderTrust record
      const existing = await base44.entities.ProviderTrust.filter({ provider_email }, null, 1);
      let trustRecord;

      if (existing.length === 0) {
        let initialScore = 100;
        let initialViolations = 0;

        if (hasYesNoViolation) {
          initialViolations = 1;
          initialScore = 80;
        }
        if (hasLowRating) {
          initialScore = Math.max(initialScore - 15, 40);
        }

        trustRecord = await base44.entities.ProviderTrust.create({
          provider_email,
          safety_violation_count: initialViolations,
          trust_score: initialScore,
          status: initialScore < 50 ? 'warning' : 'active',
        });
      } else {
        let newViolationCount = existing[0].safety_violation_count || 0;
        let newTrustScore = existing[0].trust_score || 100;

        if (hasYesNoViolation) {
          newViolationCount += 1;
        }
        if (hasLowRating) {
          newTrustScore -= 15;
        }

        let newStatus = 'active';
        if (newViolationCount >= 3) {
          newStatus = 'suspended_perm';
          newTrustScore = 0;
        } else if (newViolationCount === 2) {
          newStatus = 'suspended_temp';
          newTrustScore = Math.max(newTrustScore, 40);
        } else if (newTrustScore < 50) {
          newStatus = 'warning';
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