import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameThemeColor } from '@games/shared';
import type { FrontendGamePlugin } from '../registry/gameRegistry';

// literal Tailwind class strings only — Tailwind's JIT can't pick up
// runtime-interpolated class names like `text-neon-${color}`
const ACCENT_CLASSES: Record<GameThemeColor, { border: string; text: string }> = {
  violet: { border: 'hover:border-neon-violet/40', text: 'text-neon-violet' },
  indigo: { border: 'hover:border-neon-indigo/40', text: 'text-neon-indigo' },
  cyan:   { border: 'hover:border-neon-cyan/40',   text: 'text-neon-cyan' },
  pink:   { border: 'hover:border-neon-pink/40',   text: 'text-neon-pink' },
  amber:  { border: 'hover:border-neon-amber/40',  text: 'text-neon-amber' },
};

// same 5 colors as raw RGB — needed because handleMouseMove builds an
// inline style.boxShadow string at runtime, which can't consume Tailwind classes
const ACCENT_RGB: Record<GameThemeColor, string> = {
  violet: '139,92,246',
  indigo: '99,102,241',
  cyan:   '34,211,238',
  pink:   '244,114,182',
  amber:  '251,191,36',
};

interface Props {
  plugin: FrontendGamePlugin;
}

export default function GameCard({ plugin }: Props) {
  const navigate  = useNavigate();
  const { meta }  = plugin;
  const accent    = ACCENT_CLASSES[meta.themeColor];
  const accentRgb = ACCENT_RGB[meta.themeColor];
  const cardRef   = useRef<HTMLDivElement>(null);
  const shineRef  = useRef<HTMLDivElement>(null);
  // cached rect — updated on mouseenter only, not every mousemove
  const rectRef   = useRef<DOMRect | null>(null);

  function handleMouseEnter() {
    // cache once per hover session — getBoundingClientRect forces layout,
    // calling it here (once) vs every mousemove event is a huge win
    if (cardRef.current) rectRef.current = cardRef.current.getBoundingClientRect();
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el    = cardRef.current;
    const shine = shineRef.current;
    const rect  = rectRef.current;
    if (!el || !shine || !rect) return;

    const x = (e.clientX - rect.left  - rect.width  / 2) / (rect.width  / 2); // -1 to 1
    const y = (e.clientY - rect.top   - rect.height / 2) / (rect.height / 2); // -1 to 1

    // single transform string — no layout triggers
    el.style.transform  = `perspective(700px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg) translateZ(4px)`;
    el.style.boxShadow  = `0 20px 45px rgba(${accentRgb},${0.1 + Math.abs(x + y) * 0.05})`;

    const sx = ((e.clientX - rect.left)  / rect.width)  * 100;
    const sy = ((e.clientY - rect.top)   / rect.height) * 100;
    shine.style.background = `radial-gradient(circle at ${sx}% ${sy}%, rgba(255,255,255,0.09) 0%, transparent 60%)`;
    shine.style.opacity    = '1';
  }

  function handleMouseLeave() {
    const el    = cardRef.current;
    const shine = shineRef.current;
    if (!el || !shine) return;
    rectRef.current = null;
    el.style.transition  = 'transform 0.5s ease, box-shadow 0.5s ease';
    el.style.transform   = 'perspective(700px) rotateX(0deg) rotateY(0deg) translateZ(0)';
    el.style.boxShadow   = '';
    shine.style.opacity  = '0';
    // reset transition speed after spring-back
    setTimeout(() => {
      if (cardRef.current) cardRef.current.style.transition = '';
    }, 500);
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      className={`relative bg-gray-900 rounded-2xl p-6 cursor-pointer group border border-gray-800 overflow-hidden ${accent.border}`}
    >
      {/* shine overlay */}
      <div
        ref={shineRef}
        aria-hidden="true"
        style={{
          position:      'absolute',
          inset:         0,
          borderRadius:  'inherit',
          opacity:       0,
          transition:    'opacity 0.3s ease',
          pointerEvents: 'none',
          zIndex:        1,
        }}
      />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <div className="text-4xl mb-4">{meta.iconEmoji}</div>
        <h3 className="text-lg font-bold mb-1 text-white">{meta.displayName}</h3>
        <p className="text-gray-400 text-sm mb-4">{meta.description}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>
            {meta.minPlayers === meta.maxPlayers
              ? `${meta.minPlayers}`
              : `${meta.minPlayers}–${meta.maxPlayers}`}{' '}
            players
          </span>
          {meta.supportsLLMGeneration && (
            <>
              <span>·</span>
              <span className={accent.text}>✨ AI themes</span>
            </>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <button
            data-hover
            onClick={() => navigate(`/game/${meta.id}/themes`)}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
          >
            Solo
          </button>
          <button
            data-hover
            onClick={() => navigate(`/game/${meta.id}/lobby`)}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            Multiplayer
          </button>
        </div>
      </div>
    </div>
  );
}
