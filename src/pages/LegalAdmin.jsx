import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, History, ChevronDown } from 'lucide-react';
import SuggestionReviewModal from '@/components/admin/SuggestionReviewModal';
import DocumentHistoryPanel from '@/components/admin/DocumentHistoryPanel';

export default function LegalAdmin() {
  const { user } = useAuth();
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [showHistory, setShowHistory] = useState(null);
  const [newFeature, setNewFeature] = useState('');
  const [featureDescription, setFeatureDescription] = useState('');
  const [loadingGenerate, setLoadingGenerate] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/';
    }
  }, [user]);

  const { data: suggestions } = useQuery({
    queryKey: ['legal_suggestions'],
    queryFn: () => base44.entities.LegalSuggestion.list(),
  });

  const { data: versions } = useQuery({
    queryKey: ['legal_versions'],
    queryFn: () => base44.entities.LegalDocumentVersion.list(),
  });

  const handleGenerateSuggestion = async (e) => {
    e.preventDefault();
    setLoadingGenerate(true);
    try {
      await base44.functions.invoke('generateLegalSuggestion', {
        feature: newFeature,
        description: featureDescription,
      });
      setNewFeature('');
      setFeatureDescription('');
      // Refetch suggestions
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoadingGenerate(false);
    }
  };

  const pendingSuggestions = suggestions?.filter((s) => s.status === 'pending') || [];
  const approvedCount = suggestions?.filter((s) => s.status === 'published').length || 0;

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">Juridisk dokumentstyring</h1>
        <p className="text-muted-foreground mb-8">
          Administrer juridiske dokumenter, gennemgå forslag og hold compliance opdateret
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-2xl font-bold text-foreground">{pendingSuggestions.length}</div>
            <div className="text-sm text-muted-foreground">Afventer gennemgang</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-foreground">{approvedCount}</div>
            <div className="text-sm text-muted-foreground">Publicerede ændringer</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-foreground">
              {versions?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Samlede versioner</div>
          </Card>
        </div>

        {/* Generate new suggestion */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Generer juridiske forslag</h2>
          <form onSubmit={handleGenerateSuggestion} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Feature</label>
                <select
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md text-sm"
                >
                  <option value="">Vælg feature</option>
                  <option value="payment">Betalingssystem</option>
                  <option value="chat">Chat</option>
                  <option value="tracking">Tracking</option>
                  <option value="safety_system">Sikkerhedssystem</option>
                  <option value="data_collection">Dataindsamling</option>
                  <option value="user_profiles">Brugerprofiler</option>
                  <option value="booking_system">Bookingsystem</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Beskrivelse</label>
                <Input
                  placeholder="Kort beskrivelse af ændringen"
                  value={featureDescription}
                  onChange={(e) => setFeatureDescription(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loadingGenerate}
              className="bg-primary hover:bg-primary/90"
            >
              {loadingGenerate ? 'Genererer...' : 'Genererer forslag'}
            </Button>
          </form>
        </Card>

        {/* Pending suggestions */}
        {pendingSuggestions.length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold">Afventer godkendelse ({pendingSuggestions.length})</h2>
            {pendingSuggestions.map((sug) => (
              <Card key={sug.id} className="p-4 border-l-4 border-l-yellow-500">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="font-semibold text-foreground">{sug.document_type}</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        {sug.priority}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{sug.trigger_reason}</p>
                    <div className="bg-muted p-3 rounded text-xs mb-3 max-h-20 overflow-y-auto">
                      <strong>Foreslået:</strong> {sug.suggested_text.substring(0, 150)}...
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setSelectedSuggestion(sug)}
                    className="whitespace-nowrap"
                  >
                    Gennemse
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Approved suggestions */}
        {suggestions?.filter((s) => s.status === 'published').length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold">Senest godkendt</h2>
            {suggestions
              ?.filter((s) => s.status === 'published')
              .slice(0, 5)
              .map((sug) => (
                <Card key={sug.id} className="p-4 border-l-4 border-l-green-500">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-foreground">{sug.document_type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{sug.trigger_feature}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Godkendt: {sug.updated_date?.split('T')[0]}
                  </p>
                </Card>
              ))}
          </div>
        )}

        {/* Document versions history */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Dokumentversioner</h2>
          <div className="space-y-2">
            {['privacy_policy', 'terms_of_service', 'safety_policy', 'payment_policy'].map(
              (docType) => {
                const docVersions = versions?.filter((v) => v.document_type === docType) || [];
                return (
                  <div key={docType} className="border rounded-lg p-3">
                    <button
                      onClick={() =>
                        setShowHistory(showHistory === docType ? null : docType)
                      }
                      className="w-full flex items-center justify-between text-left font-medium"
                    >
                      <span>{docType}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {docVersions.length} versioner
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            showHistory === docType ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>
                    {showHistory === docType && (
                      <DocumentHistoryPanel
                        documentType={docType}
                        versions={docVersions}
                      />
                    )}
                  </div>
                );
              }
            )}
          </div>
        </Card>
      </div>

      {selectedSuggestion && (
        <SuggestionReviewModal
          suggestion={selectedSuggestion}
          onClose={() => setSelectedSuggestion(null)}
          onRefresh={() => window.location.reload()}
        />
      )}
    </div>
  );
}