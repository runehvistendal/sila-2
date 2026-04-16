import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageCropper from './ImageCropper';

/**
 * Upload-flow med integreret 16:9 billedtilpasning.
 * Props:
 *   images: string[]          — aktuelle billed-URLs
 *   onChange: (urls) => void  — callback ved ændring
 *   maxImages?: number        — max antal billeder (default 8)
 *   label?: string
 */
export default function ImageUploadWithEditor({
  images = [],
  onChange,
  maxImages = 8,
  label = 'Billeder',
  shape = 'rect', // 'rect' | 'circle'
  hidePrimaryLabel = false,
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState(null); // data-URL under redigering
  const [editingIdx, setEditingIdx] = useState(null);     // index hvis vi re-redigerer
  const inputRef = useRef(null);

  // Åbn editor med en fil
  const openEditor = (dataUrl, idx = null) => {
    setEditingImage(dataUrl);
    setEditingIdx(idx);
  };

  const handleFileSelect = (files) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => openEditor(e.target.result, null);
    reader.readAsDataURL(file);
  };

  // Gem beskåret billede
  const handleCropSave = async (croppedDataUrl) => {
    setUploading(true);
    setEditingImage(null);
    try {
      const res = await fetch(croppedDataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      if (editingIdx !== null) {
        // Erstat eksisterende billede
        const updated = [...images];
        updated[editingIdx] = file_url;
        onChange(updated);
      } else {
        onChange([...images, file_url]);
      }
    } finally {
      setUploading(false);
      setEditingIdx(null);
    }
  };

  const handleRemove = (idx) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  // Re-edit: hent billed-dataurl fra http url
  const handleReEdit = async (url, idx) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = (e) => openEditor(e.target.result, idx);
      reader.readAsDataURL(blob);
    } catch {
      // Fallback: brug url direkte
      openEditor(url, idx);
    }
  };

  const canAdd = images.length < maxImages;

  // EDITOR VIEW
  if (editingImage) {
    return (
      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Tilpas billede</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{shape === 'circle' ? 'Juster udsnit til cirkel — dette er præcis hvordan profilbilledet vises' : 'Juster udsnit til 16:9 — dette er præcis hvordan billedet vises i listingen'}</p>
          </div>
        </div>

        {/* Live preview label */}
        <div className="mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60 bg-primary/8 px-2 py-0.5 rounded-full">
            Live preview — listing format
          </span>
        </div>

        <ImageCropper
          image={editingImage}
          onSave={handleCropSave}
          onCancel={() => { setEditingImage(null); setEditingIdx(null); }}
          shape={shape}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-foreground">{label}</label>
        <span className="text-xs text-muted-foreground">{images.length}/{maxImages}</span>
      </div>

      {/* Thumbnail grid */}
      {images.length > 0 && (
        <div className={shape === 'circle' ? 'flex justify-center mb-4' : 'grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3'}>
          {images.map((url, i) => (
            <div
              key={i}
              className={shape === 'circle'
                ? 'relative group w-28 h-28 rounded-full overflow-hidden border-2 border-border bg-muted'
                : 'relative group aspect-video rounded-xl overflow-hidden border border-border bg-muted'}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />

              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  title="Rediger udsnit"
                  onClick={() => handleReEdit(url, i)}
                  className="bg-white/90 hover:bg-white text-foreground rounded-full p-1.5 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Fjern"
                  onClick={() => handleRemove(i)}
                  className="bg-white/90 hover:bg-red-500 hover:text-white text-foreground rounded-full p-1.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {i === 0 && !hidePrimaryLabel && (
                <div className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  Primær
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {canAdd && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFileSelect(e.dataTransfer.files);
          }}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
            dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/30'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Uploader...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Træk billede hertil eller klik for at vælge</p>
              <p className="text-xs text-muted-foreground">Du kan justere udsnit ({shape === 'circle' ? 'cirkel' : '16:9'}) inden billedet gemmes</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}