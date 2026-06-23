/**
 * RocketCursor — Custom SVG rocket cursor with velocity tilt + white exhaust fumes.
 * Extracted from FloatingIdCard for SRP compliance.
 */
import React from 'react';

interface Fume {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

interface Props {
  x: number;
  y: number;
  tilt: number;
  onScreen: boolean;
  fumes: Fume[];
}

export const RocketCursor: React.FC<Props> = ({ x, y, tilt, onScreen, fumes }) => {
  if (!onScreen) return null;

  return (
    <>
      {/* Fumes behind rocket */}
      {fumes.map((f) => (
        <div
          key={f.id}
          className="absolute pointer-events-none z-60 rounded-full"
          style={{
            left: f.x,
            top: f.y,
            width: f.size + 'px',
            height: f.size + 'px',
            backgroundColor: 'white',
            opacity: f.opacity,
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 ${f.size * 0.5}px rgba(255,255,255,${f.opacity * 0.3})`,
          }}
        />
      ))}

      {/* Rocket SVG */}
      <div
        className="absolute pointer-events-none z-[70]"
        style={{
          left: x,
          top: y,
          transform: `translate(-50%, -50%) rotate(${tilt}deg)`,
          filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))',
        }}
      >
        <svg
          viewBox="0 0 40 50"
          width="30"
          height="38"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse
            cx="20"
            cy="30"
            rx="7.5"
            ry="15.5"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2"
          />
          <path d="M13 22 Q20 1 27 22" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
          <ellipse cx="20" cy="30" rx="6" ry="14" fill="#7c3aed" stroke="white" strokeWidth="1.2" />
          <path d="M14 22 Q20 2 26 22" fill="#a855f7" stroke="white" strokeWidth="1" />
          <circle cx="20" cy="24" r="3.5" fill="#1e1b4b" stroke="#c084fc" strokeWidth="0.8" />
          <circle cx="19.5" cy="23.5" r="1.2" fill="#22d3ee" opacity="0.6" />
          <path d="M14 36 L8 46 L14 42 Z" fill="#6d28d9" stroke="white" strokeWidth="1" />
          <path d="M26 36 L32 46 L26 42 Z" fill="#6d28d9" stroke="white" strokeWidth="1" />
          <ellipse cx="20" cy="44" rx="4" ry="2" fill="#c084fc" opacity="0.6" />
          <ellipse cx="20" cy="44" rx="2.5" ry="1" fill="#e9d5ff" opacity="0.8" />
        </svg>
      </div>
    </>
  );
};
