import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export default function SuggestionReviewModal({ suggestion, onClose, onRefresh }) {
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [editedText, setEditedText] = useState(suggestion.suggested_text);
  const [activeTab, setActiveTab] = useState('suggested');

  const handleApprove = async () => {
    setApproving(true);
    try {
      await base44.functions.invoke('approveLegalSuggestion', {
        suggestion_id: suggestion.id,
        approved: true,
        admin_notes: adminNotes,
        edited_text: editedText,
      });
      onRefresh();
      onClose();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await base44.functions.invoke('approveLegalSuggestion', {
        suggestion_id: suggestion.id,
        approved: false,
        admin_notes: adminNotes,
      });
      onRefresh();
      onClose();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">{suggestion.document_type}</h2>
            <p className="text-sm text-muted-foreground">{suggestion.trigger_reason}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Tabs */}
          <div className="flex gap-4 border-b">
            {[
              { key: 'suggested', label: 'Foreslået tekst' },
              { key: 'comparison', label: 'Sammenligning' },
              { key: 'review', label: 'Gennemgang' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-primary border-b-2 border-b-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Suggested text */}
          {activeTab === 'suggested' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Foreslået tekst (kan redigeres)</label>
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          )}

          {/* Comparison */}
          {activeTab === 'comparison' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2 text-sm">Nuværende tekst</h3>
                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm font-mono text-red-900 max-h-64 overflow-y-auto">
                  {suggestion.current_text || 'Ingen eksisterende tekst'}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-sm">Ny foreslået tekst</h3>
                <div className="bg-green-50 border border-green-200 rounded p-3 text-sm font-mono text-green-900 max-h-64 overflow-y-auto">
                  {suggestion.suggested_text}
                </div>
              </div>
            </div>
          )}

          {/* Review */}
          {activeTab === 'review' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Forklaring:</strong> {suggestion.explanation}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Admin-noter (valgfrit)</label>
                <Textarea
                  placeholder="Noter til ændringerne, hvorfor de godkendes/afvises, etc."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg text-sm">
                <p>
                  <strong>Dokument:</strong> {suggestion.document_type}
                </p>
                <p>
                  <strong>Feature:</strong> {suggestion.trigger_feature}
                </p>
                <p>
                  <strong>Prioritet:</strong>{' '}
                  <span className={`font-medium ${
                    suggestion.priority === 'high' ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {suggestion.priority}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t p-6 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Luk
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={rejecting}
          >
            {rejecting ? 'Afviser...' : 'Afvis'}
          </Button>
          <Button
            onClick={handleApprove}
            disabled={approving}
            className="bg-green-600 hover:bg-green-700"
          >
            {approving ? 'Godkender...' : 'Godkend og publicer'}
          </Button>
        </div>
      </div>
    </div>
  );
}