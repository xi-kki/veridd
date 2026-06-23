/**
 * SpaceObjects — Warp-speed radial starfield.
 * Stars radiate OUTWARD from center (like jumping to lightspeed).
 * The rocket stays in place; space rushes toward you.
 *
 * How it works:
 * - Each star is positioned at an angle (0-360°) + distance from center
 * - Over time, distance INCREASES (stars fly outward)
 * - When distance > max → reset to center (distance=0) with new angle
 * - Stars near center = small dots. Stars near edge = elongated streaks.
 * - Streak length grows with distance = classic warp tunnel effect.
 * - Three layers: far (dots), mid (streaks), near (long bright streaks).
 */
import React from 'react';

interface Star {
  id: string;
  angle: number; // radians, direction from center
  distance: number; // 0-100, how far from center
  speed: number; // growth rate per frame
  baseSize: number;
  baseBrightness: number;
  layer: 'far' | 'mid' | 'near';
}

// Generate stars that radiate from center
const createWarpStars = (): Star[] => {
  const stars: Star[] = [];

  // Far layer — many tiny dots
  for (let i = 0; i < 50; i++) {
    stars.push({
      id: `f${i}`,
      angle: Math.random() * Math.PI * 2,
      distance: Math.random() * 100,
      speed: 0.4 + Math.random() * 0.4,
      baseSize: 0.3 + Math.random() * 0.5,
      baseBrightness: 0.15 + Math.random() * 0.2,
      layer: 'far',
    });
  }

  // Mid layer — streaks forming
  for (let i = 0; i < 30; i++) {
    stars.push({
      id: `m${i}`,
      angle: Math.random() * Math.PI * 2,
      distance: Math.random() * 100,
      speed: 0.7 + Math.random() * 0.5,
      baseSize: 0.6 + Math.random() * 0.8,
      baseBrightness: 0.25 + Math.random() * 0.3,
      layer: 'mid',
    });
  }

  // Near layer — long bright streaks (hyperspace)
  for (let i = 0; i < 18; i++) {
    stars.push({
      id: `n${i}`,
      angle: Math.random() * Math.PI * 2,
      distance: Math.random() * 100,
      speed: 1.2 + Math.random() * 0.8,
      baseSize: 0.8 + Math.random() * 1.2,
      baseBrightness: 0.35 + Math.random() * 0.4,
      layer: 'near',
    });
  }

  return stars;
};

const WARP_STARS = createWarpStars();

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

const WarpStarfield: React.FC<{ time: number }> = ({ time }) => (
  <>
    {WARP_STARS.map((star) => {
      // Distance increases over time — star flies outward
      let dist = (star.distance + time * star.speed) % 120; // wrap at 120
      if (dist > 100) dist = dist - 120; // smooth wrap

      // Convert polar → cartesian
      const cx = 50; // center X (%)
      const cy = 42; // center Y (%)

      const x = cx + Math.cos(star.angle) * dist;
      const y = cy + Math.sin(star.angle) * dist;

      // Calculate streak elongation based on distance + speed
      // Stars near center = dots. Stars far = streaks.
      const speedFactor = star.speed * 1.5;
      const streakLen = Math.min(dist * speedFactor * 0.15, 12);
      const width = star.baseSize;
      const height = Math.max(star.baseSize, streakLen + star.baseSize);

      // Opacity: dim near center, brighten toward edges
      const opacityFactor = Math.min(dist / 40, 1);
      const opacity = star.baseBrightness * (0.3 + 0.7 * opacityFactor);

      // Streaks align with their direction of travel (radial)
      const rotation = (star.angle * 180) / Math.PI;

      // Color: slight purple tint for near streaks
      const isNear = star.layer === 'near';
      const color = isNear ? 'rgba(200, 180, 255, ' : 'rgba(255, 255, 255, ';

      // Glow on near streaks
      const glow = isNear
        ? `0 0 ${star.baseSize * 2}px rgba(168,85,247,${opacity * 0.2})`
        : 'none';

      return (
        <div
          key={star.id}
          className="absolute pointer-events-none"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: `${width}px`,
            height: `${height}px`,
            opacity,
            backgroundColor: isNear ? '#c4b5fd' : '#ffffff',
            borderRadius: '50%',
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            boxShadow: glow,
            transition: 'none',
          }}
        />
      );
    })}
  </>
);

const SpaceObjRenderer: React.FC<{
  obj: SpaceObj;
  index: number;
  time: number;
  mouseX: number;
  mouseY: number;
}> = ({ obj, index: i, time, mouseX, mouseY }) => {
  // Objects drift slowly and orbit outward (warp parallax)
  const orbitAngle = time * obj.speed * 0.1 + i * 1.5;
  const orbitRadius = 15 + Math.sin(time * 0.05 + i) * 8;
  const baseX = 50 + Math.cos(orbitAngle) * orbitRadius;
  const baseY = 42 + Math.sin(orbitAngle) * orbitRadius * 0.6;

  // Slow outward drift
  const outwardDrift = time * obj.speed * 0.08;
  const driftAngle = Math.atan2(baseY - 42, baseX - 50);
  const x = baseX + Math.cos(driftAngle) * outwardDrift;
  const y = baseY + Math.sin(driftAngle) * outwardDrift;

  const opacity = 0.08 + Math.sin(time * obj.speed * 0.2 + i) * 0.03 + 0.05;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        opacity,
        transform: 'translate(-50%, -50%)',
        transition: 'none',
      }}
    >
      {obj.type === 'planet' && (
        <svg width={obj.size * 6} height={obj.size * 6} viewBox="0 0 20 20">
          <circle cx="10" cy="10" r={obj.size * 1.5} fill={obj.color} opacity="0.4" />
          {obj.ringSize && (
            <ellipse
              cx="10"
              cy="10"
              rx={obj.ringSize * 2}
              ry={obj.ringSize * 0.6}
              fill="none"
              stroke={obj.color}
              strokeWidth="0.4"
              opacity="0.3"
              transform={`rotate(${obj.angle + time * 3}, 10, 10)`}
            />
          )}
        </svg>
      )}
      {obj.type === 'asteroid' && (
        <div
          style={{
            width: obj.size * 3,
            height: obj.size * 3,
            backgroundColor: obj.color,
            borderRadius: '40% 60% 55% 45% / 50% 45% 55% 50%',
            transform: `rotate(${obj.angle + time * 10}deg)`,
            opacity: 0.3,
          }}
        />
      )}
      {obj.type === 'comet' && (
        <svg
          width={20 + Math.sin(time * obj.speed + i) * 6}
          height="6"
          viewBox="0 0 20 6"
        >
          <ellipse cx="3" cy="3" rx="2.5" ry="1.5" fill="white" opacity="0.5" />
          <ellipse cx="8" cy="2.8" rx="4" ry="0.8" fill="white" opacity="0.2" />
          <ellipse cx="14" cy="2.8" rx="5" ry="0.4" fill="white" opacity="0.08" />
        </svg>
      )}
    </div>
  );
};

export const SpaceObjects: React.FC<Props> = React.memo(
  ({ objects, time, mouseX = 50, mouseY = 50 }) => (
    <>
      <WarpStarfield time={time} />
      {objects.map((obj, i) => (
        <SpaceObjRenderer
          key={i}
          obj={obj}
          index={i}
          time={time}
          mouseX={mouseX}
          mouseY={mouseY}
        />
      ))}
    </>
  ),
);

SpaceObjects.displayName = 'SpaceObjects';
