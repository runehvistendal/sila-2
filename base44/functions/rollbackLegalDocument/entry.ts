import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { document_type, target_version } = await req.json();

    if (!document_type || !target_version) {
      return Response.json(
        { error: 'document_type and target_version required' },
        { status: 400 }
      );
    }

    // Get all versions
    const versions = await base44.asServiceRole.entities.LegalDocumentVersion.filter(
      { document_type }
    );

    const targetVersion = versions.find((v) => v.version_number === target_version);
    if (!targetVersion) {
      return Response.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    // Deactivate current active version
    const activeVersion = versions.find((v) => v.is_active);
    if (activeVersion) {
      await base44.asServiceRole.entities.LegalDocumentVersion.update(activeVersion.id, {
        is_active: false,
      });
    }

    // Activate target version
    await base44.asServiceRole.entities.LegalDocumentVersion.update(targetVersion.id, {
      is_active: true,
    });

    console.log(`[Legal] Rollback: ${document_type} to v${target_version}`);

    return Response.json({
      success: true,
      message: `Rolled back to version ${target_version}`,
      active_version: targetVersion,
    });
  } catch (error) {
    console.error('[Rollback Legal] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});