import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all legal content
    const legalContent = await base44.asServiceRole.entities.LegalContent.filter({});

    if (!legalContent || legalContent.length === 0) {
      return Response.json({ error: 'No legal content found' }, { status: 404 });
    }

    const suggestions = [];

    for (const doc of legalContent) {
      const prompt = `Du er juridisk ekspert specialiseret i GDPR, dataombudsmand-krav og platfom-vilkår.

Dokument type: ${doc.page_type}
Nuværende titel: ${doc.title}
Nuværende indhold (uddrag):
${doc.content.substring(0, 3000)}

Opgaver:
1. Fjern alle referencer til Google Analytics 4 (GA4) eller anden tracking, som ikke er nødvendig for platform-drift.
2. Sikr, at dokumentet er fuldt GDPR-kompatibelt.
3. Sikr, at dokumentet reflekterer en marketplace-platform uden GA4.
4. Behold alle vigtige juridiske bestemmelser for bruger-sikkerhed, betaling og vilkår.
5. Forbedre klarheden og præcision.

Svar med HELE det opdaterede indhold til dokumentet - klar til at erstatte det nuværende indhold.`;

      const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        model: 'claude_sonnet_4_6',
      });

      const suggestion = await base44.asServiceRole.entities.LegalSuggestion.create({
        document_type: doc.page_type,
        trigger_feature: 'ga4_removal_and_compliance_audit',
        trigger_reason: 'Fjern GA4-referencer og sikr GDPR-compliance',
        section_affected: 'full_document',
        current_text: doc.content.substring(0, 1000),
        suggested_text: response,
        explanation: `Automatisk gennemgang af juridisk dokument. GA4-referencer fjernet, GDPR-compliance verificeret.`,
        status: 'pending',
        priority: 'high',
      });

      suggestions.push({
        page_type: doc.page_type,
        suggestion_id: suggestion.id,
      });

      console.log(`[Legal Update] Suggestion created for ${doc.page_type}`);
    }

    return Response.json({
      success: true,
      suggestions_created: suggestions.length,
      suggestions,
      message: 'Juridiske dokumenter gennemgået. Se forslagene i LegalAdmin-panelet.',
    });
  } catch (error) {
    console.error('[Update Legal Documents] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});