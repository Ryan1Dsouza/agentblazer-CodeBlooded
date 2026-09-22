import { useEffect, useState, useCallback } from 'react';
import { Event } from '../../../types';

interface EventModalProps {
  event: Event | null;
  onClose: () => void;
  theme?: string;
}

export default function EventDetailModal({ event, onClose, theme = 'violet' }: EventModalProps) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const gallery = event?.gallery || [];
  const totalPhotos = gallery.length;

  const nextPhoto = useCallback(() => {
    if (totalPhotos > 0) {
      setActivePhotoIdx((prev) => (prev < totalPhotos - 1 ? prev + 1 : 0));
    }
  }, [totalPhotos]);

  const prevPhoto = useCallback(() => {
    if (totalPhotos > 0) {
      setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : totalPhotos - 1));
    }
  }, [totalPhotos]);

  // Handle keyboard inputs: Arrow Left/Right, A/D, Escape
  useEffect(() => {
    if (!event) return;
    document.body.style.overflow = 'hidden';
    setActivePhotoIdx(0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        nextPhoto();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        prevPhoto();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    // Block wheel events from reaching gameplay while HUD is open
    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.deltaY > 20) {
        nextPhoto();
      } else if (e.deltaY < -20) {
        prevPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleNativeWheel, { passive: false, capture: true });
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleNativeWheel, { capture: true } as EventListenerOptions);
    };
  }, [event, nextPhoto, prevPhoto, onClose]);

  // Mouse wheel listener for rapid gallery traversal
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY > 20) {
      nextPhoto();
    } else if (e.deltaY < -20) {
      prevPhoto();
    }
  };

  if (!event) return null;

  const themeConfig = {
    violet: {
      accent: '#8b5cf6',
      borderGlow: 'rgba(139, 92, 246, 0.45)',
      hudBadge: 'ORBITAL STATION TERMINAL',
      categoryBg: 'rgba(139, 92, 246, 0.2)'
    },
    inferno: {
      accent: '#ff6b35',
      borderGlow: 'rgba(255, 107, 53, 0.45)',
      hudBadge: 'MAGMA DEPOT TERMINAL',
      categoryBg: 'rgba(255, 107, 53, 0.2)'
    },
    frost: {
      accent: '#0ea5e9',
      borderGlow: 'rgba(14, 165, 233, 0.45)',
      hudBadge: 'ARCTIC OUTPOST TERMINAL',
      categoryBg: 'rgba(14, 165, 233, 0.2)'
    }
  }[theme as 'violet' | 'inferno' | 'frost'] || {
    accent: '#8b5cf6',
    borderGlow: 'rgba(139, 92, 246, 0.45)',
    hudBadge: 'EVENT TERMINAL',
    categoryBg: 'rgba(139, 92, 246, 0.2)'
  };

  const currentPhotoUrl = gallery[activePhotoIdx];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
      onWheel={handleWheel}
      style={{ zIndex: 9999 }}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl border bg-[#080812]/95 p-5 md:p-6 shadow-2xl transition-all flex flex-col"
        style={{
          borderColor: themeConfig.accent,
          boxShadow: `0 0 45px ${themeConfig.borderGlow}`,
          color: '#fff'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div className="flex items-start justify-between border-b pb-3.5 border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-full border"
                style={{
                  backgroundColor: themeConfig.categoryBg,
                  borderColor: themeConfig.accent,
                  color: themeConfig.accent
                }}
              >
                {themeConfig.hudBadge} • {event.category}
              </span>
              <span className="text-xs text-gray-400 font-mono">{event.date}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">{event.title}</h2>
          </div>

          {/* Prominent X Close Button */}
          <button
            className="rounded-full w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 transition-all text-lg font-bold leading-none cursor-pointer"
            onClick={onClose}
            aria-label="Close Terminal"
          >
            ✕
          </button>
        </div>

        {/* Terminal Body */}
        <div className="overflow-y-auto pr-1 py-3 flex-1 space-y-4 scrollbar-thin">
          <p className="text-xs md:text-sm text-gray-300 leading-relaxed">{event.description}</p>

          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono">
            <div>
              <span className="text-gray-400 block text-[10px]">VENUE / LOCATION</span>
              <span className="font-semibold text-white truncate block">{event.location}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">PARTICIPATION METRIC</span>
              <span className="font-semibold text-white">{event.metric}</span>
            </div>
          </div>

          {/* Full Photo Slideshow Viewer */}
          {totalPhotos > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                <span className="font-semibold text-gray-300">
                  IMAGE {String(activePhotoIdx + 1).padStart(2, '0')} OF {String(totalPhotos).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-gray-500 hidden sm:inline">
                  (Use ← → Arrow Keys or Mouse Wheel)
                </span>
              </div>

              {/* Main Photo Display Area */}
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-black/80 border border-white/15 flex items-center justify-center group">
                <img
                  src={currentPhotoUrl}
                  alt={`${event.title} photograph ${activePhotoIdx + 1}`}
                  className="w-full h-full object-contain select-none"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.endsWith('.HEIC') || target.src.endsWith('.heic')) {
                      target.src = target.src.replace(/\.(HEIC|heic)$/, '.JPG');
                    }
                  }}
                />

                {totalPhotos > 1 && (
                  <>
                    <button
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/75 hover:bg-black text-white rounded-full w-10 h-10 flex items-center justify-center border border-white/20 transition-all cursor-pointer opacity-80 group-hover:opacity-100 shadow-xl"
                      onClick={prevPhoto}
                    >
                      ❮
                    </button>
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/75 hover:bg-black text-white rounded-full w-10 h-10 flex items-center justify-center border border-white/20 transition-all cursor-pointer opacity-80 group-hover:opacity-100 shadow-xl"
                      onClick={nextPhoto}
                    >
                      ❯
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Strip */}
              {totalPhotos > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {gallery.map((photo: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setActivePhotoIdx(i)}
                      className={`relative flex-shrink-0 w-16 h-12 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                        activePhotoIdx === i
                          ? 'ring-2 border-white scale-105 opacity-100'
                          : 'opacity-50 hover:opacity-100 border-white/20'
                      }`}
                      style={{
                        outlineColor: themeConfig.accent
                      }}
                    >
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Terminal Footer */}
        <div className="border-t border-white/10 pt-3 flex items-center justify-between">
          <span className="text-[10px] font-mono text-gray-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-300 font-bold">ESC</kbd> or click Back to resume
          </span>

          <button
            onClick={onClose}
            className="px-6 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-2xl text-white transition-all cursor-pointer hover:scale-105 shadow-lg"
            style={{
              backgroundColor: themeConfig.accent,
              boxShadow: `0 0 20px ${themeConfig.borderGlow}`
            }}
          >
            Resume Expedition ➔
          </button>
        </div>
      </div>
    </div>
  );
}
