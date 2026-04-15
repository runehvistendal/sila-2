import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, RotateCcw } from 'lucide-react';

export default function DocumentHistoryPanel({ documentType, versions }) {
  const [rolling, setRolling] = useState(null);

  const activeVersion = versions.find((v) => v.is_active);
  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);

  const handleRollback = async (versionNumber) => {
    if (!confirm(`Virkelig rollback til version ${versionNumber}?`)) return;

    setRolling(versionNumber);
    try {
      await base44.functions.invoke('rollbackLegalDocument', {
        document_type: documentType,
        target_version: versionNumber,
      });
      window.location.reload();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setRolling(null);
    }
  };

  return (
    <div className="mt-4 space-y-2">
      {sortedVersions.map((version) => (
        <div
          key={version.id}
          className={`flex items-start justify-between p-3 rounded border ${
            version.is_active ? 'bg-green-50 border-green-200' : 'bg-muted'
          }`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold">v{version.version_number}</span>
              {version.is_active && (
                <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">
                  AKTIV
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-1">{version.change_summary}</p>
            <p className="text-xs text-muted-foreground">
              Publiceret: {version.published_at?.split('T')[0]} af {version.published_by}
            </p>
            <div className="mt-2 text-xs bg-white p-2 rounded border max-h-20 overflow-y-auto">
              {version.content.substring(0, 200)}...
            </div>
          </div>
          {!version.is_active && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRollback(version.version_number)}
              disabled={rolling === version.version_number}
              className="whitespace-nowrap ml-4"
            >
              {rolling === version.version_number ? (
                'Ruller tilbage...'
              ) : (
                <><RotateCcw className="w-3 h-3 mr-1" /> Rollback</>
              )}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}