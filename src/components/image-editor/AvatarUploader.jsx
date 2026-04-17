import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

const CROP_SIZE = 200;

export default function AvatarUploader({ currentUrl, onSave, uploading }) {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const [imageSrc, setImageSrc] = useState(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target.result);
      setOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  // Once image loads, compute scale so it fills the CROP_SIZE square
  const handleImageLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const { naturalWidth: nw, naturalHeight: nh } = img;
    setNaturalSize({ w: nw, h: nh });
    const s = Math.max(CROP_SIZE / nw, CROP_SIZE / nh);
    setScale(s);
    // center
    const displayW = nw * s;
    const displayH = nh * s;
    setOffset({ x: (CROP_SIZE - displayW) / 2, y: (CROP_SIZE - displayH) / 2 });
  };

  // Clamp so image always covers the CROP_SIZE area
  const clamp = useCallback((ox, oy, s, nw, nh) => {
    const dw = nw * s;
    const dh = nh * s;
    const minX = CROP_SIZE - dw;
    const minY = CROP_SIZE - dh;
    return {
      x: Math.min(0, Math.max(minX, ox)),
      y: Math.min(0, Math.max(minY, oy)),
    };
  }, []);

  const onMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y });
  };

  const onMouseMove = useCallback((e) => {
    if (!dragging || !dragStart) return;
    const dx = e.clientX - dragStart.mx;
    const dy = e.clientY - dragStart.my;
    const clamped = clamp(dragStart.ox + dx, dragStart.oy + dy, scale, naturalSize.w, naturalSize.h);
    setOffset(clamped);
  }, [dragging, dragStart, scale, naturalSize, clamp]);

  const onMouseUp = useCallback(() => {
    setDragging(false);
    setDragStart(null);
  }, []);

  // Touch support
  const onTouchStart = (e) => {
    const t = e.touches[0];
    setDragging(true);
    setDragStart({ mx: t.clientX, my: t.clientY, ox: offset.x, oy: offset.y });
  };

  const onTouchMove = useCallback((e) => {
    if (!dragging || !dragStart) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.mx;
    const dy = touch.clientY - dragStart.my;
    const clamped = clamp(dragStart.ox + dx, dragStart.oy + dy, scale, naturalSize.w, naturalSize.h);
    setOffset(clamped);
  }, [dragging, dragStart, scale, naturalSize, clamp]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [dragging, onMouseMove, onMouseUp, onTouchMove]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
    // Draw cropped region
    const srcX = -offset.x / scale;
    const srcY = -offset.y / scale;
    const srcW = CROP_SIZE / scale;
    const srcH = CROP_SIZE / scale;
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, CROP_SIZE, CROP_SIZE);
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    setImageSrc(null);
  };

  const handleCancel = () => {
    setImageSrc(null);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} className="hidden" />

      {imageSrc ? (
        <div className="flex flex-col items-center gap-3">
          {/* Crop preview */}
          <div
            className="relative overflow-hidden rounded-full border-2 border-primary shadow-md"
            style={{ width: CROP_SIZE, height: CROP_SIZE, cursor: dragging ? 'grabbing' : 'grab' }}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
          >
            {/* Hidden img to read naturalWidth/Height */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt=""
              onLoad={handleImageLoad}
              style={{ display: 'none' }}
            />
            {/* Visible draggable image */}
            <img
              src={imageSrc}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                left: offset.x,
                top: offset.y,
                width: naturalSize.w * scale,
                height: naturalSize.h * scale,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
            {/* Circle mask hint ring */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
                pointerEvents: 'none',
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t('drag_to_reposition') || 'Træk for at placere'}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} className="rounded-xl">
              {t('cancel')}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={uploading} className="bg-primary text-white rounded-xl">
              {uploading ? '...' : t('save')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          {/* Current avatar preview */}
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            {currentUrl ? (
              <img src={currentUrl} alt="" className="w-full h-full object-cover" style={{ borderRadius: '50%' }} />
            ) : (
              <Camera className="w-8 h-8 text-muted-foreground/50" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-medium text-primary hover:underline"
          >
            {t('change_photo') || 'Skift billede'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      )}
    </div>
  );
}