import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, RotateCcw, X, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * 16:9 billededitor med zoom, pan og rotation.
 * Canvas viser altid en 16:9 output-ramme med overlay.
 * Props:
 *   image: string       — data-URL eller http-URL
 *   onSave: (dataUrl) => void
 *   onCancel: () => void
 */
export default function ImageCropper({ image, onSave, onCancel }) {
  const ASPECT = 16 / 9;
  const CANVAS_W = 640;
  const CANVAS_H = Math.round(CANVAS_W / ASPECT); // 360

  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const stateRef = useRef({ zoom: 1, panX: 0, panY: 0, rotation: 0 });
  const dragRef = useRef(null);
  const rafRef = useRef(null);

  const [zoom, setZoomState] = useState(1);
  const [rotation, setRotationState] = useState(0);
  const [panX, setPanXState] = useState(0);
  const [panY, setPanYState] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Sync state to ref for draw (avoids stale closures)
  const sync = useCallback((updates) => {
    Object.assign(stateRef.current, updates);
    if (updates.zoom !== undefined) setZoomState(updates.zoom);
    if (updates.rotation !== undefined) setRotationState(updates.rotation);
    if (updates.panX !== undefined) setPanXState(updates.panX);
    if (updates.panY !== undefined) setPanYState(updates.panY);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    const { zoom, panX, panY, rotation } = stateRef.current;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw image
    ctx.save();
    ctx.translate(CANVAS_W / 2 + panX, CANVAS_H / 2 + panY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    // Semi-dark overlay outside a centered 16:9 zone (already full canvas = 16:9, so just draw guides)
    // Draw 16:9 crop guides — rule of thirds
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo((CANVAS_W / 3) * i, 0);
      ctx.lineTo((CANVAS_W / 3) * i, CANVAS_H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, (CANVAS_H / 3) * i);
      ctx.lineTo(CANVAS_W, (CANVAS_H / 3) * i);
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, CANVAS_W - 2, CANVAS_H - 2);

    // 16:9 label
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(8, 8, 44, 18);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('16:9', 12, 21);
  }, []);

  // Animate loop
  const scheduleDraw = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, [draw]);

  // Load image once
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      // Auto-fit: scale so image fills 16:9 canvas
      const scaleW = CANVAS_W / img.naturalWidth;
      const scaleH = CANVAS_H / img.naturalHeight;
      const fitZoom = Math.max(scaleW, scaleH);
      sync({ zoom: fitZoom, panX: 0, panY: 0, rotation: 0 });
      setLoaded(true);
      scheduleDraw();
    };
    img.src = image;
  }, [image]);

  useEffect(() => { if (loaded) scheduleDraw(); }, [zoom, rotation, panX, panY, loaded]);

  // --- Drag (mouse + touch) ---
  const getPos = (e) => {
    if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };

  const handleDragStart = (e) => {
    e.preventDefault();
    dragRef.current = getPos(e);
  };

  const handleDragMove = (e) => {
    if (!dragRef.current) return;
    const pos = getPos(e);
    const dx = pos.x - dragRef.current.x;
    const dy = pos.y - dragRef.current.y;
    dragRef.current = pos;
    const next = {
      panX: stateRef.current.panX + dx,
      panY: stateRef.current.panY + dy,
    };
    sync(next);
    scheduleDraw();
  };

  const handleDragEnd = () => { dragRef.current = null; };

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const next = Math.min(5, Math.max(0.3, stateRef.current.zoom + delta));
    sync({ zoom: next });
    scheduleDraw();
  };

  const changeZoom = (delta) => {
    const next = Math.min(5, Math.max(0.3, stateRef.current.zoom + delta));
    sync({ zoom: next });
    scheduleDraw();
  };

  const changeRotation = (delta) => {
    sync({ rotation: (stateRef.current.rotation + delta + 360) % 360 });
    scheduleDraw();
  };

  const handleReset = () => {
    const img = imgRef.current;
    if (!img) return;
    const scaleW = CANVAS_W / img.naturalWidth;
    const scaleH = CANVAS_H / img.naturalHeight;
    const fitZoom = Math.max(scaleW, scaleH);
    sync({ zoom: fitZoom, panX: 0, panY: 0, rotation: 0 });
    scheduleDraw();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onSave(dataUrl);
  };

  return (
    <div className="space-y-4">
      {/* Preview label */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tilpas billedet til 16:9 rammen</span>
        <span className="text-xs text-muted-foreground">Træk for at panorere · Scroll for zoom</span>
      </div>

      {/* Canvas */}
      <div className="relative rounded-xl overflow-hidden bg-black select-none"
           style={{ aspectRatio: '16/9', width: '100%' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full h-full cursor-move"
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onWheel={handleWheel}
        />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        {/* Zoom */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground block">Zoom: {Math.round(zoom * 100)}%</label>
          <input
            type="range"
            min="30"
            max="500"
            step="1"
            value={Math.round(zoom * 100)}
            onChange={(e) => { sync({ zoom: Number(e.target.value) / 100 }); scheduleDraw(); }}
            className="w-full accent-primary h-1.5"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => changeZoom(-0.1)} className="flex-1 gap-1 text-xs">
              <ZoomOut className="w-3.5 h-3.5" /> Ud
            </Button>
            <Button size="sm" variant="outline" onClick={() => changeZoom(0.1)} className="flex-1 gap-1 text-xs">
              <ZoomIn className="w-3.5 h-3.5" /> Ind
            </Button>
          </div>
        </div>

        {/* Rotation */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground block">Rotation: {rotation}°</label>
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={rotation}
            onChange={(e) => { sync({ rotation: Number(e.target.value) }); scheduleDraw(); }}
            className="w-full accent-primary h-1.5"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => changeRotation(-90)} className="flex-1 gap-1 text-xs">
              <RotateCcw className="w-3.5 h-3.5" /> -90°
            </Button>
            <Button size="sm" variant="outline" onClick={() => changeRotation(90)} className="flex-1 gap-1 text-xs">
              <RotateCw className="w-3.5 h-3.5" /> +90°
            </Button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Nulstil
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel} className="gap-1.5 flex-1">
          <X className="w-3.5 h-3.5" /> Annuller
        </Button>
        <Button size="sm" onClick={handleSave} className="bg-primary text-white gap-1.5 flex-1">
          <Check className="w-3.5 h-3.5" /> Anvend billedudsnit
        </Button>
      </div>
    </div>
  );
}