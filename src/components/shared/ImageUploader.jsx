import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, X, ImageIcon } from 'lucide-react';

/**
 * Drag-and-drop image uploader.
 * Props:
 *   images: string[]          — current uploaded URLs
 *   onChange: (urls) => void  — called with new array
 *   maxImages?: number        — default 10
 *   label?: string
 */
export default function ImageUploader({ images = [], onChange, maxImages = 10, label = 'Billeder' }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const uploadFiles = async (files) => {
    const remaining = maxImages - images.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (!toUpload.length) return;

    setUploading(true);
    const uploaded = await Promise.all(
      toUpload.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return file_url;
      })
    );
    onChange([...images, ...uploaded]);
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (files.length) uploadFiles(files);
  };

  const handleRemove = (idx) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const canAdd = images.length < maxImages;

  return (
    <div>
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {images.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-muted">
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

      {canAdd && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
            dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/40'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Uploader...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Træk billeder hertil, eller klik for at vælge</p>
              <p className="text-xs text-muted-foreground">
                {images.length}/{maxImages} billeder uploadet
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}