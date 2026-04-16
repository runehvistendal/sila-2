import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized: LLM translation requires authentication' }, { status: 401 });
    }

    const { review_id, original_text, source_language } = await req.json();

    if (!review_id || !original_text || !source_language) {
      return Response.json(
        { error: 'review_id, original_text, and source_language required' },
        { status: 400 }
      );
    }

    // Only translate if source is not English
    if (source_language === 'en') {
      return Response.json({
        translated_text: original_text,
        from_cache: false,
      });
    }

    // Check if translation already exists
    const existing = await base44.asServiceRole.entities.ReviewTranslation.filter({
      review_id,
      original_language: source_language,
    });

    if (existing.length > 0) {
      return Response.json({
        translated_text: existing[0].translated_text,
        from_cache: true,
      });
    }

    // Translate using Hugging Face via LLM
    const languageNames = { da: 'Danish', kl: 'Greenlandic (Kalaallisut)' };
    const sourceLangName = languageNames[source_language] || source_language;

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Translate this ${sourceLangName} review to English. Keep the tone and meaning exactly the same. Return ONLY the translated text, nothing else.

Review: "${original_text}"`,
      model: 'gemini_3_flash',
    });

    const translatedText = response.trim();

    // Cache the translation
    await base44.asServiceRole.entities.ReviewTranslation.create({
      review_id,
      original_language: source_language,
      original_text,
      translated_text: translatedText,
      translated_at: new Date().toISOString(),
    });

    console.log(`[Translation] Review ${review_id} translated from ${source_language} to EN`);

    return Response.json({
      translated_text: translatedText,
      from_cache: false,
    });
  } catch (error) {
    console.error('[Translation] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});