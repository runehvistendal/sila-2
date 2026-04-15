import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus } from 'lucide-react';

const TRANSPORT_SUGGESTIONS = [
  { name: 'Fiskestænger', description: 'Komplet sæt fiskestænger til lystfiskeri' },
  { name: 'Måltid ombord', description: 'Madpakke eller frokost under turen' },
  { name: 'Kikkertudlejning', description: 'Kikkert til naturobservation' },
  { name: 'Dykkerudstyr', description: 'Snorkling eller dykkerudstyr' },
];

const CABIN_SUGGESTIONS = [
  { name: 'Sengelinned', description: 'Komplet sengetøj og puder' },
  { name: 'Slutrengøring', description: 'Professionel rengøring efter ophold' },
  { name: 'Brænde', description: 'Brænde til pejs eller ovn' },
  { name: 'Indkøbspakke', description: 'Startpakke med dagligvarer' },
  { name: 'Udstyrsleje', description: 'Kajakker, fiskestænger eller sneskove' },
];

export default function AddOnServicesEditor({ services = [], onChange, type = 'transport' }) {
  const [newService, setNewService] = useState({ name: '', description: '', price: '' });
  const suggestions = type === 'transport' ? TRANSPORT_SUGGESTIONS : CABIN_SUGGESTIONS;

  const addService = () => {
    if (newService.name && newService.price) {
      const service = {
        name: newService.name,
        description: newService.description || undefined,
        price_dkk: Number(newService.price),
      };
      onChange([...services, service]);
      setNewService({ name: '', description: '', price: '' });
    }
  };

  const removeService = (idx) => {
    onChange(services.filter((_, i) => i !== idx));
  };

  const applySuggestion = (suggestion) => {
    setNewService({
      name: suggestion.name,
      description: suggestion.description,
      price: newService.price,
    });
  };

  return (
    <div className="space-y-4">
      {/* Suggestions */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Hurtige forslag:</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((sug) => (
            <button
              key={sug.name}
              type="button"
              onClick={() => applySuggestion(sug)}
              className="px-3 py-1.5 text-xs bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground rounded-full border border-transparent hover:border-primary transition-colors"
            >
              + {sug.name}
            </button>
          ))}
        </div>
      </div>

      {/* Input fields */}
      <div className="bg-muted/40 rounded-xl p-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Navn på service *</label>
          <Input
            placeholder="F.eks. Fiskestænger"
            value={newService.name}
            onChange={(e) => setNewService((p) => ({ ...p, name: e.target.value }))}
            className="rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Beskrivelse (valgfri)</label>
          <Textarea
            placeholder="F.eks. Komplet sæt fiskestænger til lystfiskeri"
            value={newService.description}
            onChange={(e) => setNewService((p) => ({ ...p, description: e.target.value }))}
            rows={2}
            className="rounded-lg text-sm resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Pris (DKK) *</label>
          <Input
            type="number"
            placeholder="200"
            value={newService.price}
            onChange={(e) => setNewService((p) => ({ ...p, price: e.target.value }))}
            min={0}
            className="rounded-lg text-sm"
          />
        </div>
        <Button
          type="button"
          onClick={addService}
          disabled={!newService.name || !newService.price}
          className="w-full h-9 rounded-lg text-sm gap-2"
        >
          <Plus className="w-4 h-4" /> Tilføj service
        </Button>
      </div>

      {/* Added services list */}
      {services.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Tilføjede services ({services.length}):</p>
          {services.map((svc, i) => (
            <div key={i} className="flex items-start justify-between gap-3 bg-white border border-border rounded-lg p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{svc.name}</p>
                {svc.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{svc.description}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-foreground">{svc.price_dkk} DKK</p>
                <button
                  type="button"
                  onClick={() => removeService(i)}
                  className="text-muted-foreground hover:text-destructive transition-colors mt-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}