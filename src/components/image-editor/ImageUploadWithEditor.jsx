import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageCropper from './ImageCropper';

export default function ImageUploadWithEditor({
  images = [],
  onChange,
  maxImages = 8,
  label = 'Billeder',
  shape = 'rect',
  hidePrimaryLabel = false,
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const inputRef = useRef(null);

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

  const handleCropSave = async (croppedDataUrl) => {
    setUploading(true);
    setEditingImage(null);
    try {
      const res = await fetch(croppedDataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      if (editingIdx !== null) {
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

  const handleReEdit = async (url, idx) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = (e) => openEditor(e.target.result, idx);
      reader.readAsDataURL(blob);
    } catch {
      openEditor(url, idx);
    }
  };

  const canAdd = images.length < maxImages;

  if (editingImage) {
    return (
      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Tilpas billede</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{shape === 'circle' ? 'Juster udsnit til cirkel — dette er præcis hvordan profilbilledet vises' : 'Juster udsnit til 16:9 — dette er præcis hvordan billedet vises i listingen'}</p>
          </div>
        </div>

        <div className="mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60 bg-primary/8 px-2 py-0.5 rounded-full">
            Live preview — {shape === 'circle' ? 'profilbillede' : 'listing'} format
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">{label}</label>
        <span className="text-xs text-muted-foreground">{images.length}/{maxImages}</span>
      </div>

      {images.length > 0 && (
        <div className={shape === 'circle' ? 'flex justify-center gap-3' : 'grid grid-cols-2 sm:grid-cols-3 gap-2'}>
          {images.map((url, i) => (
            <div
              key={i}
              className={shape === 'circle'
                ? 'relative w-28 h-28 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center'
                : 'relative aspect-video rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center'}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />

              <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  title="Rediger udsnit"
                  onClick={() => handleReEdit(url, i)}
                  className="bg-white hover:bg-white/90 text-foreground rounded-full p-2 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Fjern"
                  onClick={() => handleRemove(i)}
                  className="bg-white hover:bg-red-500 hover:text-white text-foreground rounded-full p-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {i === 0 && !hidePrimaryLabel && (
                <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Primær
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
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