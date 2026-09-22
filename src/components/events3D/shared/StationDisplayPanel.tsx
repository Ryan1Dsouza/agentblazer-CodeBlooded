import React, { useState, useRef, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { Event } from '../../../types';

interface StationDisplayPanelProps {
  event: Event;
  index: number;
  position?: [number, number, number];
  isActive?: boolean;
  isDocking?: boolean;
  theme?: string;
  onInspect: (event: Event) => void;
}

export default function StationDisplayPanel({
  event,
  index,
  position = [0, 4.5, 0],
  isActive = false,
  isDocking = false,
  theme = 'violet',
  onInspect
}: StationDisplayPanelProps) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const gallery = event?.gallery || [];
  const totalPhotos = gallery.length;

  // Theme accents
  const themeColors = {
    violet: {
      accent: '#a855f7',
      accentGlow: 'rgba(168, 85, 247, 0.5)',
      border: 'rgba(168, 85, 247, 0.45)',
      badgeBg: 'rgba(147, 51, 234, 0.25)',
      badgeText: '#d8b4fe',
      stationLabel: `ORBITAL STATION 0${index + 1}`
    },
    inferno: {
      accent: '#f97316',
      accentGlow: 'rgba(249, 115, 22, 0.5)',
      border: 'rgba(249, 115, 22, 0.45)',
      badgeBg: 'rgba(234, 88, 12, 0.25)',
      badgeText: '#fdba74',
      stationLabel: `MAGMA DEPOT 0${index + 1}`
    },
    frost: {
      accent: '#0ea5e9',
      accentGlow: 'rgba(14, 165, 233, 0.5)',
      border: 'rgba(14, 165, 233, 0.45)',
      badgeBg: 'rgba(2, 132, 199, 0.25)',
      badgeText: '#7dd3fc',
      stationLabel: `ARCTIC OUTPOST 0${index + 1}`
    }
  }[theme as 'violet' | 'inferno' | 'frost'] || {
    accent: '#a855f7',
    accentGlow: 'rgba(168, 85, 247, 0.5)',
    border: 'rgba(168, 85, 247, 0.45)',
    badgeBg: 'rgba(147, 51, 234, 0.25)',
    badgeText: '#d8b4fe',
    stationLabel: `EXHIBIT 0${index + 1}`
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : totalPhotos - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIdx((prev) => (prev < totalPhotos - 1 ? prev + 1 : 0));
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  // Scroll active thumbnail into view
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.children[activePhotoIdx] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activePhotoIdx]);

  const currentPhoto = gallery[activePhotoIdx] || gallery[0];

  return (
    <group position={position}>
      {/* Holographic Projection Stem / Anchor */}
      <mesh position={[0, -2.2, 0]}>
        <cylinderGeometry args={[0.04, 0.08, 2.5, 8]} />
        <meshBasicMaterial color={themeColors.accent} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, -3.4, 0]}>
        <ringGeometry args={[0.2, 0.8, 16]} />
        <meshBasicMaterial color={themeColors.accent} transparent opacity={0.4} side={2} />
      </mesh>

      {/* 3D In-World Display Hologram */}
      <Html
        center
        distanceFactor={18}
        transform={false}
        zIndexRange={[100, 0]}
      >
        <div
          className={`w-[360px] md:w-[440px] rounded-2xl backdrop-blur-xl border transition-all duration-300 select-none shadow-2xl p-4 flex flex-col gap-3 ${
            isActive
              ? 'scale-100 opacity-100 ring-2'
              : 'scale-95 opacity-90 hover:opacity-100 hover:scale-100'
          }`}
          style={{
            backgroundColor: 'rgba(8, 10, 20, 0.78)',
            borderColor: themeColors.border,
            boxShadow: isActive
              ? `0 0 35px ${themeColors.accentGlow}, inset 0 0 15px rgba(255,255,255,0.05)`
              : `0 0 20px ${themeColors.accentGlow}`,
            outlineColor: themeColors.accent,
            color: '#fff'
          }}
          onWheel={handleWheel}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                style={{
                  backgroundColor: themeColors.badgeBg,
                  borderColor: themeColors.border,
                  color: themeColors.badgeText
                }}
              >
                {themeColors.stationLabel}
              </span>
              <span className="text-[10px] font-mono text-gray-400">{event.category}</span>
            </div>
            <span className="text-[10px] font-mono text-gray-300">{event.date}</span>
          </div>

          {/* Title and Short Description */}
          <div>
            <h3 className="text-base md:text-lg font-bold text-white tracking-tight leading-snug">
              {event.title}
            </h3>
            <p className="text-[11px] text-gray-300 line-clamp-2 mt-1 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Workshop Photo Display with Scroll & Carousel */}
          {totalPhotos > 0 && (
            <div className="flex flex-col gap-2">
              <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-black/60 border border-white/15 group">
                <img
                  src={currentPhoto}
                  alt={`${event.title} photo ${activePhotoIdx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.endsWith('.HEIC') || target.src.endsWith('.heic')) {
                      target.src = target.src.replace(/\.(HEIC|heic)$/, '.JPG');
                    }
                  }}
                />

                {/* Counter Badge */}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/20 text-[9px] font-mono text-white">
                  {activePhotoIdx + 1} / {totalPhotos}
                </div>

                {/* Left/Right Click Nav */}
                {totalPhotos > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 transition-all opacity-80 group-hover:opacity-100 cursor-pointer shadow-lg"
                      aria-label="Previous image"
                    >
                      ‹
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 transition-all opacity-80 group-hover:opacity-100 cursor-pointer shadow-lg"
                      aria-label="Next image"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              {/* Scrollable Gallery Thumbnails */}
              {totalPhotos > 1 && (
                <div
                  ref={scrollContainerRef}
                  className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none scroll-smooth cursor-grab"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {gallery.map((photo, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIdx(i);
                      }}
                      className={`relative flex-shrink-0 w-12 h-9 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                        activePhotoIdx === i
                          ? 'ring-2 scale-105 opacity-100'
                          : 'opacity-50 hover:opacity-90 border-white/20'
                      }`}
                      style={{
                        borderColor: activePhotoIdx === i ? themeColors.accent : 'rgba(255,255,255,0.2)',
                        outlineColor: themeColors.accent
                      }}
                    >
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px]">
            <span className="font-mono text-gray-400">
              {event.metric || `${totalPhotos} Photos`}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInspect(event);
              }}
              className="px-3 py-1.5 rounded-lg font-mono font-bold uppercase tracking-wider text-white transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 shadow-md"
              style={{
                backgroundColor: themeColors.accent,
                boxShadow: `0 0 15px ${themeColors.accentGlow}`
              }}
            >
              <span>{isDocking ? 'AUTODOCKING...' : 'Open Terminal'}</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      </Html>
    </group>
  );
}
