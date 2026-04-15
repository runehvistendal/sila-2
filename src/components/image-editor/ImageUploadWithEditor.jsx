import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageCropper from './ImageCropper';

/**
 * Upload-flow med integreret billedtilpasning
 * Props:
 *   images: string[]          — aktuelle billed-URLs
 *   onChange: (urls) => void  — callback ved ændring
 *   maxImages?: number        — max antal billeder (default 10)
 *   label?: string
 *   shape?: 'circle' | 'rect' — crop-form (default 'rect')
 *   aspectRatio?: number      — for rect (fx 16/9, 4/3)
 */
export default function ImageUploadWithEditor({
  images = [],
  onChange,
  maxImages = 10,
  label = 'Billeder',
  shape = 'rect',
  aspectRatio = 16 / 9,
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const inputRef = useRef(null);

  const handleFileSelect = (files) => {
    const file = files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setEditingImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCropSave = async (croppedDataUrl) => {
    setUploading(true);
    try {
      // Billed-data-URL konverteres til blob
      const response = await fetch(croppedDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });

      // Upload optimeret billede
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange([...images, file_url]);
      setEditingImage(null);
    } catch (error) {
      console.error('Upload fejl:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (idx) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const canAdd = images.length < maxImages;

  if (editingImage) {
    return (
      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Tilpas billede</h3>
        <ImageCropper
          image={editingImage}
          shape={shape}
          aspectRatio={aspectRatio}
          onSave={handleCropSave}
          onCancel={() => setEditingImage(null)}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Billed-galleri */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {images.map((url, i) => (
            <div
              key={i}
              className={`relative group overflow-hidden rounded-xl border border-border bg-muted ${
                shape === 'circle' ? 'aspect-square rounded-full' : 'aspect-video'
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload område */}
      {canAdd && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFileSelect(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
            dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/40'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Uploader og behandler...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Træk billede hertil eller klik for at vælge</p>
              <p className="text-xs text-muted-foreground">
                Du kan tilpasse billedet efter upload. {images.length}/{maxImages}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}