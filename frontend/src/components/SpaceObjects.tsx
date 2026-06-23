/**
 * SpaceObjects — Chicken Invaders-style parallax starfield.
 * 3 scrolling star layers (far/mid/near) + drifing space objects.
 * Creates the illusion of the card flying through space.
 */
import React from 'react';

const STAR_LAYERS = (() => [
  // Far — many tiny stars, slow drift
  Array.from({ length: 50 }, (_, i) => ({
    id: `f${i}`,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 0.3 + Math.random() * 0.6,
    baseOpacity: Math.random() * 0.2 + 0.06,
    speed: 0.012 + Math.random() * 0.015,
    twinkleSpeed: 1.0 + Math.random() * 2,
    twinklePhase: Math.random() * Math.PI * 2,
  })),
  // Mid — medium stars, moderate scroll
  Array.from({ length: 30 }, (_, i) => ({
    id: `m${i}`,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 0.7 + Math.random() * 1.0,
    baseOpacity: Math.random() * 0.3 + 0.12,
    speed: 0.035 + Math.random() * 0.03,
    twinkleSpeed: 0.8 + Math.random() * 1.5,
    twinklePhase: Math.random() * Math.PI * 2,
  })),
  // Near — bright stars + warp streaks (hyperspace feel)
  Array.from({ length: 18 }, (_, i) => ({
    id: `n${i}`,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1.0 + Math.random() * 1.5,
    baseOpacity: Math.random() * 0.5 + 0.3,
    speed: 0.08 + Math.random() * 0.08,
    twinkleSpeed: 0.5 + Math.random() * 1.0,
    twinklePhase: Math.random() * Math.PI * 2,
    glow: true,
    isStreak: i < 8, // first 8 near stars are elongated streaks
  })),
])();

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

const ParallaxStars: React.FC<{ time: number; mouseX: number; mouseY: number }> = ({
  time,
  mouseX,
  mouseY,
}) => (
  <>
    {STAR_LAYERS.map((layer, li) =>
      layer.map((star) => {
        // Vertical scroll — continuous, wraps at 100
        const scrollY = (star.y + time * star.speed * 25) % 100;
        // Gentle horizontal wobble
        const wobbleX = Math.sin(time * 0.06 + star.twinklePhase) * 1.2;
        const x = Math.max(0, Math.min(100, star.x + wobbleX));
        // Twinkle
        const twinkle =
          0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinklePhase);
        const opacity = star.baseOpacity * (0.4 + 0.6 * twinkle);

        // Streak stars are elongated (warp speed lines)
        const isStreak = (star as any).isStreak;
        const streakHeight = isStreak ? 2 + star.size * 1.5 : star.size;

        return (
          <div
            key={star.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: isStreak ? `${star.size * 0.6}px` : `${star.size}px`,
              height: `${streakHeight}px`,
              left: `${x}%`,
              top: `${scrollY}%`,
              opacity,
              backgroundColor: '#fff',
              borderRadius: isStreak ? '40%' : '50%',
              boxShadow: star.glow
                ? `0 0 ${star.size * 2}px rgba(168,85,247,${opacity * 0.25})`
                : 'none',
              transition: 'opacity 0.4s ease',
            }}
          />
        );
      })
    )}
  </>
);

const SpaceObjRenderer: React.FC<{
  obj: SpaceObj;
  index: number;
  time: number;
  mouseX: number;
  mouseY: number;
}> = ({ obj, index: i, time, mouseX, mouseY }) => {
  // Complex organic drift — each object has unique weave pattern
  const driftX =
    Math.sin(time * obj.speed * 0.3 + i * 2.1) * 8 +
    Math.sin(time * obj.speed * 0.12 + i * 1.3) * 3;
  const driftY =
    Math.cos(time * obj.speed * 0.25 + i * 1.7) * 6 +
    Math.sin(time * obj.speed * 0.4 + i * 0.7) * 2.5;

  // Slow downward drift (sense of forward travel)
  const scrollY = (obj.y + driftY + time * obj.speed * 1.0) % 100;
  const x = Math.max(0, Math.min(100, obj.x + driftX));

  // Subtle mouse parallax — objects shift when cursor moves
  const px = (mouseX - 50) * 0.015 * (1 + obj.speed);
  const py = (mouseY - 50) * 0.015 * (1 + obj.speed);

  const opacity =
    0.08 + Math.sin(time * obj.speed * 0.5 + i * 1.5) * 0.04 + 0.06;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x + px}%`,
        top: `${scrollY + py}%`,
        opacity,
        transform: 'translate(-50%, -50%)',
        transition: 'opacity 0.6s ease',
      }}
    >
      {obj.type === 'planet' && (
        <svg width={obj.size * 6} height={obj.size * 6} viewBox="0 0 20 20">
          <circle cx="10" cy="10" r={obj.size * 1.5} fill={obj.color} opacity="0.5" />
          {obj.ringSize && (
            <ellipse
              cx="10"
              cy="10"
              rx={obj.ringSize * 2}
              ry={obj.ringSize * 0.6}
              fill="none"
              stroke={obj.color}
              strokeWidth="0.4"
              opacity="0.35"
              transform={`rotate(${obj.angle + time * 5}, 10, 10)`}
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
            transform: `rotate(${obj.angle + time * 20}deg)`,
            opacity: 0.4,
          }}
        />
      )}
      {obj.type === 'comet' && (
        <svg
          width={30 + Math.sin(time * obj.speed * 3 + i) * 8}
          height="8"
          viewBox="0 0 30 8"
        >
          <ellipse cx="4" cy="4" rx="3" ry="2" fill="white" opacity="0.6" />
          <ellipse cx="12" cy="3.5" rx="5" ry="1.2" fill="white" opacity={0.25} />
          <ellipse cx="20" cy="3.5" rx="7" ry="0.6" fill="white" opacity={0.1} />
        </svg>
      )}
    </div>
  );
};

export const SpaceObjects: React.FC<Props> = React.memo(
  ({ objects, time, mouseX = 50, mouseY = 50 }) => (
    <>
      <ParallaxStars time={time} mouseX={mouseX} mouseY={mouseY} />
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
