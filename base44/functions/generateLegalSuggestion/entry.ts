import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { feature, description } = await req.json();

    if (!feature || !description) {
      return Response.json(
        { error: 'feature and description required' },
        { status: 400 }
      );
    }

    // Map features to affected documents
    const featureToDocuments = {
      payment: ['payment_policy', 'terms_of_service'],
      chat: ['privacy_policy', 'terms_of_service'],
      tracking: ['privacy_policy'],
      safety_system: ['safety_policy', 'privacy_policy'],
      data_collection: ['privacy_policy'],
      user_profiles: ['privacy_policy', 'terms_of_service'],
      booking_system: ['terms_of_service', 'payment_policy'],
    };

    const affectedDocs = featureToDocuments[feature] || ['terms_of_service'];
    const suggestions = [];

    // For each affected document, generate a suggestion
    for (const docType of affectedDocs) {
      // Fetch current version
      const versions = await base44.asServiceRole.entities.LegalDocumentVersion.filter(
        { document_type: docType, is_active: true }
      );

      const currentDoc = versions[0];
      const currentText = currentDoc?.content || '';

      // Generate suggestion using LLM
      const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Du er juridisk ekspert specialiseret i GDPR og platformterms.

Feature: ${feature}
Beskrivelse: ${description}

Dokument type: ${docType}
Nuværende tekst (uddrag):
${currentText.substring(0, 2000)}

Generer en konkret og juridisk korrekt opdatering af denne juridiske dokumentsection for at håndtere den nye feature. 
Vær specifik og inkluder:
- Hvad data der samles
- Hvordan det bruges
- Brugerens rettigheder
- Evt. tredjepartsintegration

Svar kun med den foreslåede tekst uden yderligere forklaring.`,
        model: 'claude_sonnet_4_6'
      });

      // Create suggestion
      const suggestion = {
        document_type: docType,
        trigger_feature: feature,
        trigger_reason: description,
        section_affected: `${docType}_section`,
        current_text: currentText.substring(0, 1000),
        suggested_text: response,
        explanation: `Automatisk forslag baseret på ny feature: ${feature}. Revider før publicering.`,
        status: 'pending',
        priority: ['safety_system', 'tracking', 'payment'].includes(feature) ? 'high' : 'medium',
      };

      const created = await base44.asServiceRole.entities.LegalSuggestion.create(suggestion);
      suggestions.push(created);

      console.log(`[Legal] Suggestion created for ${docType}:`, created.id);
    }

    return Response.json({
      success: true,
      suggestions_created: suggestions.length,
      suggestions: suggestions,
    });
  } catch (error) {
    console.error('[Legal Suggestion] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});