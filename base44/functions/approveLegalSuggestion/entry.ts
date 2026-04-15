import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { suggestion_id, approved, admin_notes, edited_text } = await req.json();

    if (!suggestion_id) {
      return Response.json(
        { error: 'suggestion_id required' },
        { status: 400 }
      );
    }

    // Get suggestion
    const suggestion = await base44.asServiceRole.entities.LegalSuggestion.filter(
      { id: suggestion_id }
    );

    if (!suggestion.length) {
      return Response.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    const sug = suggestion[0];

    if (!approved) {
      // Reject
      await base44.asServiceRole.entities.LegalSuggestion.update(sug.id, {
        status: 'rejected',
        admin_notes,
      });

      return Response.json({
        success: true,
        message: 'Suggestion rejected',
      });
    }

    // Approved - update active document
    const currentVersions = await base44.asServiceRole.entities.LegalDocumentVersion.filter(
      { document_type: sug.document_type, is_active: true }
    );

    const currentVersion = currentVersions[0] || {};
    const newVersionNumber = (currentVersion.version_number || 1.0) + 0.1;

    // Update current content with edited or suggested text
    const newContent = (currentVersion.content || '').replace(
      sug.current_text,
      edited_text || sug.suggested_text
    );

    // Create new version
    const newVersion = await base44.asServiceRole.entities.LegalDocumentVersion.create({
      document_type: sug.document_type,
      version_number: newVersionNumber,
      title: `${sug.document_type} v${newVersionNumber}`,
      content: newContent,
      change_summary: `Updated: ${sug.trigger_feature}. ${admin_notes || sug.explanation}`,
      published_at: new Date().toISOString(),
      published_by: user.email,
      is_active: true,
      gdpr_compliant: true,
    });

    // Deactivate old version
    if (currentVersion.id) {
      await base44.asServiceRole.entities.LegalDocumentVersion.update(currentVersion.id, {
        is_active: false,
      });
    }

    // Update suggestion
    await base44.asServiceRole.entities.LegalSuggestion.update(sug.id, {
      status: 'published',
      admin_notes: admin_notes || 'Approved and published',
    });

    return Response.json({
      success: true,
      message: 'Suggestion approved and published',
      new_version: newVersion,
    });
  } catch (error) {
    console.error('[Approve Legal] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});