import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FALLBACK = 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=900&h=600&fit=crop';

export default function CabinImageGallery({ images: rawImages }) {
  const images = rawImages?.filter(img => img?.startsWith('http')) || [];
  const allImages = images.length > 0 ? images : [FALLBACK];

  const [active, setActive] = useState(0);

  return (
    <div className="mb-8 space-y-2">
      {/* Main image */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-muted" style={{ height: '420px' }}>
        <AnimatePresence mode="wait">
          <motion.img
            key={active}
            src={allImages[active]}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = FALLBACK; }}
          />
        </AnimatePresence>
        {allImages.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
            {active + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {allImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                active === i
                  ? 'border-primary shadow-md scale-[1.04]'
                  : 'border-transparent opacity-70 hover:opacity-100 hover:border-border'
              }`}
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = FALLBACK; }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}