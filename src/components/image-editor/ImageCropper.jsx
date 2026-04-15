import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Billedtilpasnings-komponent med zoom, pan og rotation
 * Props:
 *   image: string         — billed-URL eller data-URL
 *   shape: 'circle' | 'rect'  — crop-form
 *   aspectRatio: number?   — for 'rect' (fx 16/9, 4/3)
 *   onSave: (croppedImageUrl) => void
 *   onCancel: () => void
 */
export default function ImageCropper({ image, shape = 'rect', aspectRatio, onSave, onCancel }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      draw();
    };
    img.src = image;
  }, [image]);

  useEffect(() => {
    draw();
  }, [zoom, rotation, panX, panY]);

  const draw = () => {
    if (!canvasRef.current || !imageRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = 400;
    canvas.height = shape === 'circle' ? 400 : Math.round(400 / (aspectRatio || 16/9));

    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom / 100, zoom / 100);
    ctx.drawImage(imageRef.current, -imageRef.current.width / 2 + panX, -imageRef.current.height / 2 + panY);
    ctx.restore();

    // Draw frame overlay
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.lineWidth = 2;
    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 10, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = (e.clientX - dragStart.x) * (100 / zoom);
    const deltaY = (e.clientY - dragStart.y) * (100 / zoom);
    setPanX(panX + deltaX);
    setPanY(panY + deltaY);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
    onSave(dataUrl);
  };

  const handleReset = () => {
    setZoom(100);
    setRotation(0);
    setPanX(0);
    setPanY(0);
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted rounded-xl p-4 flex items-center justify-center overflow-hidden" style={{ maxHeight: '500px' }}>
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* Zoom */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-2">Zoom: {zoom}%</label>
          <input
            type="range"
            min="50"
            max="200"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" onClick={() => setZoom(Math.max(50, zoom - 10))} className="flex-1">
              <ZoomOut className="w-4 h-4" /> Ud
            </Button>
            <Button size="sm" variant="outline" onClick={() => setZoom(Math.min(200, zoom + 10))} className="flex-1">
              <ZoomIn className="w-4 h-4" /> Ind
            </Button>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-2">Rotation: {rotation}°</label>
          <input
            type="range"
            min="0"
            max="360"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <Button size="sm" variant="outline" onClick={() => setRotation(0)} className="w-full mt-2 gap-1.5">
            <RotateCw className="w-4 h-4" /> Nulstil rotation
          </Button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            Nulstil
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1 gap-1.5">
            <X className="w-4 h-4" /> Annuller
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-primary text-white gap-1.5">
            <Check className="w-4 h-4" /> Anvend
          </Button>
        </div>
      </div>
    </div>
  );
}