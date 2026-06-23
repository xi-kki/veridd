/**
 * SpaceObjects — TRUE WARP SPEED starfield.
 * Stars radiate OUTWARD from center in all directions.
 * Creates the "jumping to lightspeed" tunnel effect.
 * Plus planets, asteroids, moons, and comets drifting in the void.
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

// ── WARP STARFIELD ──
// Stars radiate from center (50%, 42%) outward in all directions.
// Near center = small dots. Near edges = long streaks.
// This creates the illusion of FORWARD motion through space.
const createWarpStars = (count: number) => {
  const stars: Array<{
    id: number;
    angle: number;     // direction from center (radians)
    dist: number;      // current distance from center (0-100)
    speed: number;     // how fast it flies outward
    size: number;      // base size
    brightness: number;
    hue: number;       // 0=white, 1=slight purple
  }> = [];

  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      angle: Math.random() * Math.PI * 2,
      dist: Math.random() * 100,
      speed: 0.3 + Math.random() * 1.2,
      size: 0.5 + Math.random() * 1.5,
      brightness: 0.2 + Math.random() * 0.8,
      hue: Math.random(),
    });
  }
  return stars;
};

// Center of warp tunnel
const CX = 50;
const CY = 42;

export const SpaceObjects: React.FC<Props> = React.memo(({ objects, time }) => {
  const stars = useMemo(() => createWarpStars(90), []);

  return (
    <>
      {/* ═══ WARP SPEED STARFIELD ═══ */}
      {stars.map((star) => {
        // Distance grows outward from center over time
        let dist = (star.dist + time * star.speed) % 110;

        // Convert polar → cartesian
        const x = CX + Math.cos(star.angle) * dist;
        const y = CY + Math.sin(star.angle) * dist;

        // Streak effect: farther from center = longer streak
        const streakFactor = Math.min(dist / 30, 1);
        const streakLen = 1 + streakFactor * star.speed * 6;
        const w = Math.max(star.size * 0.3, 0.5);
        const h = streakLen;

        // Opacity: brightest at mid-distance, dim at center & far edges
        const distNorm = dist / 110;
        const opacityFactor =
          distNorm < 0.1
            ? distNorm / 0.1 // fade in from center
            : distNorm > 0.8
            ? (1 - distNorm) / 0.2 // fade out at edges
            : 1;
        const opacity = star.brightness * 0.7 * opacityFactor;

        // Rotation aligns with direction of travel
        const rotation = (star.angle * 180) / Math.PI;

        // Color: slight purple tint for some stars
        const isPurple = star.hue > 0.7;
        const bg = isPurple ? '#c4b5fd' : '#ffffff';
        const glow = isPurple
          ? `0 0 ${star.size}px rgba(168,85,247,${opacity * 0.3})`
          : 'none';

        return (
          <div
            key={star.id}
            className="absolute pointer-events-none"
            style={{
              width: `${w}px`,
              height: `${h}px`,
              left: `${x}%`,
              top: `${y}%`,
              opacity,
              backgroundColor: bg,
              borderRadius: '30%',
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              boxShadow: glow,
              willChange: 'transform, opacity',
            }}
          />
        );
      })}

      {/* ═══ PLANETS WITH RINGS + MOONS ═══ */}
      {objects
        .filter((o) => o.type === 'planet')
        .map((obj, i) => {
          const orbitT = time * 0.04 + i * 1.5;
          const driftX = Math.sin(orbitT * 0.7) * 12;
          const driftY = Math.cos(orbitT * 0.5) * 10;
          const scrollWrap = (obj.y + driftY + time * obj.speed * 0.15) % 120 - 10;
          const x = Math.max(-5, Math.min(105, obj.x + driftX + Math.sin(time * 0.02) * 3));

          return (
            <div
              key={`p${i}`}
              className="absolute pointer-events-none"
              style={{
                left: `${x}%`,
                top: `${scrollWrap}%`,
                opacity: 0.1,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <svg width={obj.size * 6} height={obj.size * 6} viewBox="0 0 20 20">
                <circle cx="10" cy="10" r={obj.size * 1.2} fill={obj.color} opacity="0.5" />
                {obj.ringSize && (
                  <ellipse
                    cx="10" cy="10"
                    rx={obj.ringSize * 1.8} ry={obj.ringSize * 0.4}
                    fill="none" stroke={obj.color} strokeWidth="0.4" opacity="0.35"
                    transform={`rotate(${obj.angle + time * 1.5}, 10, 10)`}
                  />
                )}
                {/* Orbiting moon */}
                <circle
                  cx={10 + Math.cos(time * 1.5 + i * 2.5) * 4.5}
                  cy={10 + Math.sin(time * 1.5 + i * 2.5) * 4.5}
                  r={1.2}
                  fill="white"
                  opacity={0.25}
                />
              </svg>
            </div>
          );
        })}

      {/* ═══ ASTEROIDS ═══ */}
      {objects
        .filter((o) => o.type === 'asteroid')
        .map((obj, i) => {
          const driftX = Math.sin(time * 0.05 + i * 2.3) * 15;
          const driftY = Math.cos(time * 0.04 + i * 1.8) * 12;
          const scrollWrap = (obj.y + driftY + time * obj.speed * 0.2) % 120 - 10;
          const x = Math.max(-5, Math.min(105, obj.x + driftX));

          return (
            <div
              key={`a${i}`}
              className="absolute pointer-events-none"
              style={{
                left: `${x}%`,
                top: `${scrollWrap}%`,
                opacity: 0.12,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                style={{
                  width: obj.size * 2.5,
                  height: obj.size * 2.5,
                  backgroundColor: obj.color,
                  borderRadius: '40% 60% 55% 45% / 50% 45% 55% 50%',
                  transform: `rotate(${obj.angle + time * 6}deg)`,
                }}
              />
            </div>
          );
        })}

      {/* ═══ COMETS ═══ */}
      {objects
        .filter((o) => o.type === 'comet')
        .map((obj, i) => {
          const scrollWrap = (obj.y + time * 0.3 + i * 20) % 120 - 10;
          const x = Math.max(-5, Math.min(105, obj.x + Math.sin(time * 0.03 + i) * 8));
          const pulse = 0.08 + Math.sin(time * 0.8 + i * 2) * 0.04 + 0.04;

          return (
            <div
              key={`c${i}`}
              className="absolute pointer-events-none"
              style={{
                left: `${x}%`,
                top: `${scrollWrap}%`,
                opacity: pulse,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <svg width="30" height="6" viewBox="0 0 30 6">
                <ellipse cx="2" cy="3" rx="2" ry="1.5" fill="white" opacity="0.5" />
                <ellipse cx="8" cy="2.8" rx="4" ry="0.8" fill="white" opacity="0.2" />
                <ellipse cx="16" cy="2.8" rx="7" ry="0.4" fill="white" opacity="0.08" />
              </svg>
            </div>
          );
        })}
    </>
  );
});

SpaceObjects.displayName = 'SpaceObjects';
