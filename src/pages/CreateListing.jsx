import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Anchor, X, Plus } from 'lucide-react';
import ImageUploader from '@/components/shared/ImageUploader';
import AddOnServicesEditor from '@/components/shared/AddOnServicesEditor';
import { toast } from '@/components/ui/use-toast';

const LOCATIONS = ['Nuuk', 'Ilulissat', 'Sisimiut', 'Disko Bay', 'Kangerlussuaq', 'Tasiilaq', 'Upernavik', 'Qaqortoq', 'Narsaq', 'Other'];

export default function CreateListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const [type, setType] = useState(urlParams.get('type') === 'transport' ? 'transport' : 'cabin');

  // Cabin form state
  const [cabinForm, setCabinForm] = useState({
    title: '', description: '', location: '', price_per_night: '',
    max_guests: '', host_provides_transport: false,
    transport_route_from: '', transport_price_per_seat: '', amenities: [],
    add_on_services: [], images: [],
  });
  const [newAmenity, setNewAmenity] = useState('');

  // Transport form state
  const [transportForm, setTransportForm] = useState({
    from_location: '', to_location: '', departure_date: '',
    departure_time: '', seats_available: '', round_trip_price: '',
    boat_type: '', has_cabin: false, notes: '', equipment: [], add_on_services: [], images: [],
  });
  const [newEquipment, setNewEquipment] = useState('');



  const cabinMutation = useMutation({
    mutationFn: (data) => base44.entities.Cabin.create(data),
    onSuccess: (cabin) => {
      qc.invalidateQueries(['cabins']);
      toast({ title: 'Cabin listed!', description: 'Your cabin is now live on Sila.' });
      navigate(`/cabins/${cabin.id}`);
    },
  });

  const transportMutation = useMutation({
    mutationFn: (data) => base44.entities.Transport.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['transports']);
      toast({ title: 'Transport listed!', description: 'Your route is now visible.' });
      navigate('/transport');
    },
  });

  useEffect(() => {
    if (!user) base44.auth.redirectToLogin();
  }, [user]);

  const handleCabinSubmit = (e) => {
    e.preventDefault();
    cabinMutation.mutate({
      ...cabinForm,
      price_per_night: Number(cabinForm.price_per_night),
      max_guests: Number(cabinForm.max_guests) || undefined,
      transport_price_per_seat: Number(cabinForm.transport_price_per_seat) || undefined,
      host_name: user.full_name || '',
      host_email: user.email,
      host_avatar: user.avatar_url || '',
      status: 'active',
    });
  };

  const handleTransportSubmit = (e) => {
    e.preventDefault();
    
    // Validate required images
    if (!transportForm.images || transportForm.images.length === 0) {
      toast({ title: 'Billede påkrævet', description: 'Upload mindst ét billede af hele båden udefra for at publicere.' });
      return;
    }

    transportMutation.mutate({
      ...transportForm,
      seats_available: Number(transportForm.seats_available),
      round_trip_price: Number(transportForm.round_trip_price),
      provider_name: user.full_name || '',
      provider_email: user.email,
      provider_avatar: user.avatar_url || '',
      status: 'scheduled',
    });
  };

  const addEquipment = () => {
    const items = newEquipment.split(',').map(s => s.trim()).filter(Boolean);
    if (items.length) {
      setTransportForm(p => ({ ...p, equipment: [...(p.equipment || []), ...items] }));
      setNewEquipment('');
    }
  };
  const removeEquipment = (i) => setTransportForm(p => ({ ...p, equipment: p.equipment.filter((_, idx) => idx !== i) }));

  const addAmenity = () => {
    if (newAmenity.trim()) {
      setCabinForm((p) => ({ ...p, amenities: [...(p.amenities || []), newAmenity.trim()] }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (i) => setCabinForm((p) => ({ ...p, amenities: p.amenities.filter((_, idx) => idx !== i) }));

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Create a listing</h1>
          <p className="text-muted-foreground text-sm">Share your cabin or boat route with travelers in Greenland</p>
        </div>

        {/* Type selector */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { key: 'cabin', icon: Home, label: 'Cabin', desc: 'List a remote cabin stay' },
            { key: 'transport', icon: Anchor, label: 'Transport', desc: 'Offer a boat route' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setType(opt.key)}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${
                type === opt.key ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-primary/30'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${type === opt.key ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                <opt.icon className="w-5 h-5" />
              </div>
              <p className="font-semibold text-foreground">{opt.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>

        {/* CABIN FORM */}
        {type === 'cabin' && (
          <form onSubmit={handleCabinSubmit} className="space-y-6">
            <Field label="Cabin title *">
              <Input placeholder="e.g. Arctic Wilderness Cabin" value={cabinForm.title} onChange={(e) => setCabinForm((p) => ({ ...p, title: e.target.value }))} required className="rounded-xl" />
            </Field>
            <Field label="Location *">
              <Select value={cabinForm.location} onValueChange={(v) => setCabinForm((p) => ({ ...p, location: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Description">
              <Textarea placeholder="Describe your cabin, surroundings, access..." value={cabinForm.description} onChange={(e) => setCabinForm((p) => ({ ...p, description: e.target.value }))} rows={4} className="rounded-xl resize-none" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price per night (DKK) *">
                <Input type="number" min={0} placeholder="1200" value={cabinForm.price_per_night} onChange={(e) => setCabinForm((p) => ({ ...p, price_per_night: e.target.value }))} required className="rounded-xl" />
              </Field>
              <Field label="Max guests">
                <Input type="number" min={1} placeholder="4" value={cabinForm.max_guests} onChange={(e) => setCabinForm((p) => ({ ...p, max_guests: e.target.value }))} className="rounded-xl" />
              </Field>
            </div>

            {/* Amenities */}
            <Field label="What's included">
              <p className="text-xs text-muted-foreground mb-2">Tilføj faciliteter én ad gangen, eller adskil flere med komma (f.eks. <span className="font-medium text-foreground">Brændeovn, Kajak, Generator</span>) og tryk Enter eller klik +.</p>
              <div className="flex gap-2 mb-2">
                <Input placeholder="f.eks. Brændeovn, Kayak, Solpanel" value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)} onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    // Support comma-separated
                    const items = newAmenity.split(',').map(s => s.trim()).filter(Boolean);
                    if (items.length) {
                      setCabinForm((p) => ({ ...p, amenities: [...(p.amenities || []), ...items] }));
                      setNewAmenity('');
                    }
                  }
                }} className="rounded-xl" />
                <Button type="button" variant="outline" onClick={() => {
                  const items = newAmenity.split(',').map(s => s.trim()).filter(Boolean);
                  if (items.length) {
                    setCabinForm((p) => ({ ...p, amenities: [...(p.amenities || []), ...items] }));
                    setNewAmenity('');
                  }
                }} className="rounded-xl px-3 shrink-0"><Plus className="w-4 h-4" /></Button>
              </div>
              {cabinForm.amenities?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {cabinForm.amenities.map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs px-3 py-1 rounded-full">
                      {a}
                      <button type="button" onClick={() => removeAmenity(i)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </Field>

            {/* Add-on Services */}
            <Field label="Tilvalgsydelser">
              <p className="text-xs text-muted-foreground mb-3">Tilbyd ekstra services som sengelinned, rengøring, brænde mv. mod ekstra betaling.</p>
              <AddOnServicesEditor
                services={cabinForm.add_on_services || []}
                onChange={(svc) => setCabinForm((p) => ({ ...p, add_on_services: svc }))}
                type="cabin"
              />
            </Field>

            {/* Images */}
            <Field label="Billeder af hytten">
              <ImageUploader
                images={cabinForm.images || []}
                onChange={(urls) => setCabinForm((p) => ({ ...p, images: urls }))}
                maxImages={10}
              />
            </Field>

            {/* Host transport */}
            <div className="bg-muted/60 rounded-2xl p-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cabinForm.host_provides_transport}
                  onChange={(e) => setCabinForm((p) => ({ ...p, host_provides_transport: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 accent-primary"
                />
                <div>
                  <span className="font-semibold text-sm text-foreground">I provide transport to the cabin</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Guests will see your transport offer directly on your cabin listing</p>
                </div>
              </label>
              {cabinForm.host_provides_transport && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Field label="Transport from (city/port)">
                    <Input placeholder="e.g. Nuuk harbour" value={cabinForm.transport_route_from} onChange={(e) => setCabinForm((p) => ({ ...p, transport_route_from: e.target.value }))} className="rounded-xl" />
                  </Field>
                  <Field label="Price per seat (DKK)">
                    <Input type="number" placeholder="500" value={cabinForm.transport_price_per_seat} onChange={(e) => setCabinForm((p) => ({ ...p, transport_price_per_seat: e.target.value }))} className="rounded-xl" />
                  </Field>
                </div>
              )}
            </div>

            <Button type="submit" disabled={cabinMutation.isPending} className="w-full h-12 bg-primary text-white hover:bg-primary/90 rounded-xl font-semibold text-base">
              {cabinMutation.isPending ? 'Publishing...' : 'Publish cabin'}
            </Button>
          </form>
        )}

        {/* TRANSPORT FORM */}
        {type === 'transport' && (
          <form onSubmit={handleTransportSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Field label="From *">
                <Input placeholder="e.g. Nuuk" value={transportForm.from_location} onChange={(e) => setTransportForm((p) => ({ ...p, from_location: e.target.value }))} required className="rounded-xl" />
              </Field>
              <Field label="To *">
                <Input placeholder="e.g. Ilulissat" value={transportForm.to_location} onChange={(e) => setTransportForm((p) => ({ ...p, to_location: e.target.value }))} required className="rounded-xl" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Departure date *">
                <Input type="date" value={transportForm.departure_date} onChange={(e) => setTransportForm((p) => ({ ...p, departure_date: e.target.value }))} required className="rounded-xl" min={new Date().toISOString().split('T')[0]} />
              </Field>
              <Field label="Departure time">
                <Input type="time" value={transportForm.departure_time} onChange={(e) => setTransportForm((p) => ({ ...p, departure_time: e.target.value }))} className="rounded-xl" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Seats available *">
                <Input type="number" min={1} placeholder="3" value={transportForm.seats_available} onChange={(e) => setTransportForm((p) => ({ ...p, seats_available: e.target.value }))} required className="rounded-xl" />
              </Field>
              <div>
                <Field label="Round-trip price per seat (DKK) *">
                  <Input type="number" min={0} placeholder="800" value={transportForm.round_trip_price} onChange={(e) => setTransportForm((p) => ({ ...p, round_trip_price: e.target.value }))} required className="rounded-xl" />
                </Field>
                <p className="text-xs text-muted-foreground mt-1">One-way price will be auto-calculated as 60% (480 DKK if you enter 800)</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Boat type">
                <Input placeholder="e.g. Speedboat, Fishing boat" value={transportForm.boat_type} onChange={(e) => setTransportForm((p) => ({ ...p, boat_type: e.target.value }))} className="rounded-xl" />
              </Field>
              <Field label="Kabine om bord?">
                <div className="flex items-center gap-3 mt-1.5">
                  {[{ val: false, label: 'Uden kabine' }, { val: true, label: 'Med kabine' }].map((opt) => (
                    <label key={String(opt.val)} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        checked={transportForm.has_cabin === opt.val}
                        onChange={() => setTransportForm((p) => ({ ...p, has_cabin: opt.val }))}
                        className="accent-primary w-4 h-4"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
            <Field label="Notes">
              <Textarea placeholder="Any info for passengers — gear, meeting point, etc." value={transportForm.notes} onChange={(e) => setTransportForm((p) => ({ ...p, notes: e.target.value }))} rows={3} className="rounded-xl resize-none" />
            </Field>

            {/* Equipment */}
            <Field label="Udstyr om bord">
              <p className="text-xs text-muted-foreground mb-2">Tilføj udstyr som redningsveste, VHF-radio, GPS – adskil med komma eller tryk Enter.</p>
              <div className="flex gap-2 mb-2">
                <Input placeholder="f.eks. Redningsveste, VHF-radio, Søkort" value={newEquipment} onChange={e => setNewEquipment(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEquipment(); }}} className="rounded-xl" />
                <Button type="button" variant="outline" onClick={addEquipment} className="rounded-xl px-3 shrink-0"><Plus className="w-4 h-4" /></Button>
              </div>
              {transportForm.equipment?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {transportForm.equipment.map((eq, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-xs px-3 py-1 rounded-full">
                      {eq}
                      <button type="button" onClick={() => removeEquipment(i)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </Field>

            {/* Add-on Services */}
            <Field label="Tilvalgsydelser">
              <p className="text-xs text-muted-foreground mb-3">Tilbyd ekstra services som fiskestænger, måltider, kikkertudlejning mv. mod ekstra betaling.</p>
              <AddOnServicesEditor
                services={transportForm.add_on_services || []}
                onChange={(svc) => setTransportForm((p) => ({ ...p, add_on_services: svc }))}
                type="transport"
              />
            </Field>

            {/* Boat photos (max 5) */}
            <Field label="Billeder af båden *">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 mb-3">
                <p className="text-sm text-blue-900">
                  <strong>Vigtigt:</strong> Upload mindst ét billede af hele båden udefra, så gæster kan se bådtype og størrelse. Billeder af interiør eller detaljer alene accepteres ikke.
                </p>
              </div>
              <ImageUploader
                images={transportForm.images || []}
                onChange={(urls) => setTransportForm((p) => ({ ...p, images: urls }))}
                maxImages={5}
              />
              {(!transportForm.images || transportForm.images.length === 0) && (
                <p className="text-sm text-destructive mt-2">Mindst ét billede er påkrævet</p>
              )}
            </Field>

            <Button 
              type="submit" 
              disabled={transportMutation.isPending || !transportForm.images || transportForm.images.length === 0} 
              className="w-full h-12 bg-primary text-white hover:bg-primary/90 rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {transportMutation.isPending ? 'Publishing...' : 'Publish route'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}