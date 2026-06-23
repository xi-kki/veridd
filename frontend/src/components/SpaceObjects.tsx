/**
 * SpaceObjects — Cinematic warp-speed starfield.
 * Pure black void. Long glowing streaks radiate from center.
 * Violet/electric cyan accent colors. Radial motion blur.
 * Ringed planets, comets, asteroids drifting in deep space.
 *
 * Inspired by: cyberpunk dark space, 60fps cinematic warp.
 */
import React, { useMemo } from 'react';

interface SpaceObj {
  type: 'asteroid' | 'planet' | 'comet';
  x: number;
  y: number;
  size: number;
  speed: number;
  angle: number;
  color: string;
  ringSize?: number;
}

interface Props {
  objects: SpaceObj[];
  time: number;
  mouseX?: number;
  mouseY?: number;
}

// ── WARP DOTS ──
// Tiny dots flying outward from center at high speed.
// Classic starfield — small, fast, visible.
const createWarpDots = (count: number) => {
  const dots: Array<{
    id: number;
    angle: number;
    dist: number;
    speed: number;
    size: number;
    brightness: number;
    hue: 'white' | 'violet' | 'cyan';
  }> = [];

  const hues: ('white' | 'violet' | 'cyan')[] = ['white', 'violet', 'cyan'];

  for (let i = 0; i < count; i++) {
    dots.push({
      id: i,
      angle: Math.random() * Math.PI * 2,
      dist: Math.random() * 100,
      speed: 2.0 + Math.random() * 4.0,
      size: 0.6 + Math.random() * 1.5,
      brightness: 0.3 + Math.random() * 0.7,
      hue: hues[Math.floor(Math.random() * 3)],
    });
  }
  return dots;
};

// Center of warp tunnel
const CX = 50;
const CY = 42;

export const SpaceObjects: React.FC<Props> = React.memo(({ objects, time }) => {
  const dots = useMemo(() => createWarpDots(150), []);

  return (
    <>
      {/* ═══ PURE BLACK VOID — already done via bg color ═══ */}

      {/* ═══ WARP SPEED DOTS ═══ */}
      {dots.map((d) => {
        // Distance grows outward — star flies past
        let dist = (d.dist + time * d.speed * 20) % 100;

        // Polar → cartesian
        const x = CX + Math.cos(d.angle) * dist;
        const y = CY + Math.sin(d.angle) * dist;

        // Opacity: bright across most of the path, soft fade at edges only
        const distNorm = dist / 100;
        const opacity =
          distNorm < 0.02
            ? distNorm / 0.02
            : distNorm > 0.92
            ? (1 - distNorm) / 0.08
            : 1;
        const finalOpacity = d.brightness * opacity;

        // Colors
        const bgColors: Record<string, string> = {
          white: '#ffffff',
          violet: '#c4b5fd',
          cyan: '#22d3ee',
        };
        const glow = `0 0 ${d.size * 1.5}px rgba(255,255,255,${finalOpacity * 0.15})`;

        return (
          <div
            key={d.id}
            className="absolute pointer-events-none rounded-full"
            style={{
              width: `${d.size}px`,
              height: `${d.size}px`,
              left: `${x}%`,
              top: `${y}%`,
              opacity: finalOpacity,
              backgroundColor: bgColors[d.hue],
              boxShadow: glow,
              willChange: 'transform, opacity',
            }}
          />
        );
      })}

      {/* ═══ RINGED PLANETS ═══ */}
      {objects
        .filter((o) => o.type === 'planet')
        .map((obj, i) => {
          const ox = obj.x + Math.sin(time * 0.03 + i * 1.5) * 8;
          const oy = (obj.y + Math.cos(time * 0.02 + i * 2) * 6 + time * obj.speed * 0.1) % 120 - 10;

          return (
            <div
              key={`p${i}`}
              className="absolute pointer-events-none"
              style={{
                left: `${ox}%`,
                top: `${oy}%`,
                opacity: 0.08,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <svg width={obj.size * 7} height={obj.size * 7} viewBox="0 0 24 24">
                {/* Planet */}
                <circle cx="12" cy="12" r={obj.size * 1.2} fill={obj.color} opacity="0.5" />
                {/* Ring */}
                {obj.ringSize && (
                  <ellipse
                    cx="12" cy="12"
                    rx={obj.ringSize * 2} ry={obj.ringSize * 0.35}
                    fill="none" stroke={obj.color} strokeWidth="0.4" opacity="0.3"
                    transform={`rotate(${obj.angle + time * 1.2}, 12, 12)`}
                  />
                )}
                {/* Moon */}
                <circle
                  cx={12 + Math.cos(time * 1.2 + i * 3) * 5}
                  cy={12 + Math.sin(time * 1.2 + i * 3) * 5}
                  r={1}
                  fill="white"
                  opacity={0.2}
                />
              </svg>
            </div>
          );
        })}

      {/* ═══ ASTEROIDS ═══ */}
      {objects
        .filter((o) => o.type === 'asteroid')
        .map((obj, i) => {
          const ax = obj.x + Math.sin(time * 0.04 + i * 2.3) * 14;
          const ay = (obj.y + Math.cos(time * 0.03 + i * 1.8) * 10 + time * obj.speed * 0.15) % 120 - 10;

          return (
            <div
              key={`a${i}`}
              className="absolute pointer-events-none"
              style={{
                left: `${ax}%`,
                top: `${ay}%`,
                opacity: 0.1,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                style={{
                  width: obj.size * 2.5,
                  height: obj.size * 2.5,
                  backgroundColor: obj.color,
                  borderRadius: '40% 60% 55% 45% / 50% 45% 55% 50%',
                  transform: `rotate(${obj.angle + time * 5}deg)`,
                }}
              />
            </div>
          );
        })}

      {/* ═══ COMETS ═══ */}
      {objects
        .filter((o) => o.type === 'comet')
        .map((obj, i) => {
          const cx2 = obj.x + Math.sin(time * 0.02 + i * 2) * 10;
          const cy2 = (obj.y + time * 0.2 + i * 15) % 120 - 10;
          const pulse = 0.06 + Math.sin(time * 0.6 + i * 2) * 0.04 + 0.04;

          return (
            <div
              key={`c${i}`}
              className="absolute pointer-events-none"
              style={{
                left: `${cx2}%`,
                top: `${cy2}%`,
                opacity: pulse,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <svg width="32" height="6" viewBox="0 0 32 6">
                <ellipse cx="2" cy="3" rx="2" ry="1.5" fill="white" opacity="0.5" />
                <ellipse cx="9" cy="2.8" rx="5" ry="0.8" fill="white" opacity="0.2" />
                <ellipse cx="18" cy="2.8" rx="8" ry="0.4" fill="white" opacity="0.08" />
              </svg>
            </div>
          );
        })}
    </>
  );
});

SpaceObjects.displayName = 'SpaceObjects';
