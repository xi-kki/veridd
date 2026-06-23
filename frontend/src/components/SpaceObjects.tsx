/**
 * SpaceObjects — Fast-scrolling starfield + floating objects.
 * Simple, visible dots moving fast to create warp-speed feel.
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

// Generate stable starfield — lots of dots at different depths
const useStars = () =>
  useMemo(() => {
    const stars: Array<{
      id: number;
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      streak: boolean;
    }> = [];

    // Layer 1: Far — 60 tiny slow dots
    for (let i = 0; i < 60; i++) {
      stars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 0.8 + Math.random() * 1.2,
        speed: 0.15 + Math.random() * 0.15,
        opacity: 0.2 + Math.random() * 0.3,
        streak: false,
      });
    }

    // Layer 2: Mid — 40 medium dots
    for (let i = 0; i < 40; i++) {
      stars.push({
        id: 60 + i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1.2 + Math.random() * 1.5,
        speed: 0.35 + Math.random() * 0.25,
        opacity: 0.3 + Math.random() * 0.4,
        streak: false,
      });
    }

    // Layer 3: Near — 20 bright dots + streaks
    for (let i = 0; i < 20; i++) {
      stars.push({
        id: 100 + i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1.5 + Math.random() * 2,
        speed: 0.7 + Math.random() * 0.5,
        opacity: 0.5 + Math.random() * 0.5,
        streak: i < 8, // first 8 are warp streaks
      });
    }

    return stars;
  }, []);

export const SpaceObjects: React.FC<Props> = React.memo(({ objects, time }) => {
  const stars = useStars();

  return (
    <>
      {/* Starfield — dots scrolling top-to-bottom */}
      {stars.map((star) => {
        // Scroll Y: continuous downward, wrap at 100
        const scrollY = (star.y + time * star.speed * 8) % 100;
        // Tiny horizontal wobble
        const wobbleX = Math.sin(time * 0.05 + star.id * 0.7) * 1.5;
        const x = Math.max(0, Math.min(100, star.x + wobbleX));

        // Streaks are elongated (warp speed lines)
        const isStreak = star.streak;
        const w = isStreak ? Math.max(star.size * 0.4, 1) : star.size;
        const h = isStreak ? star.size * 2.5 : star.size;

        return (
          <div
            key={star.id}
            className="absolute pointer-events-none rounded-full"
            style={{
              width: `${w}px`,
              height: `${h}px`,
              left: `${x}%`,
              top: `${scrollY}%`,
              opacity: star.opacity,
              backgroundColor: '#fff',
              borderRadius: isStreak ? '30%' : '50%',
              boxShadow: star.streak
                ? '0 0 3px rgba(168,85,247,0.3)'
                : 'none',
            }}
          />
        );
      })}

      {/* Space objects */}
      {objects.map((obj, i) => {
        const driftX = Math.sin(time * obj.speed * 0.15 + i * 2.1) * 10;
        const driftY = Math.cos(time * obj.speed * 0.12 + i * 1.7) * 8;
        const scrollY = (obj.y + driftY + time * obj.speed * 0.8) % 100;
        const x = Math.max(0, Math.min(100, obj.x + driftX));
        const opacity = 0.08 + Math.sin(time * obj.speed * 0.3 + i) * 0.03 + 0.05;

        return (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: `${x}%`,
              top: `${scrollY}%`,
              opacity,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {obj.type === 'planet' && (
              <svg width={obj.size * 5} height={obj.size * 5} viewBox="0 0 20 20">
                <circle cx="10" cy="10" r={obj.size * 1.2} fill={obj.color} opacity="0.5" />
                {obj.ringSize && (
                  <ellipse
                    cx="10" cy="10"
                    rx={obj.ringSize * 1.8} ry={obj.ringSize * 0.5}
                    fill="none" stroke={obj.color} strokeWidth="0.4" opacity="0.35"
                    transform={`rotate(${obj.angle + time * 3}, 10, 10)`}
                  />
                )}
              </svg>
            )}
            {obj.type === 'asteroid' && (
              <div
                style={{
                  width: obj.size * 2.5,
                  height: obj.size * 2.5,
                  backgroundColor: obj.color,
                  borderRadius: '40% 60% 55% 45% / 50% 45% 55% 50%',
                  transform: `rotate(${obj.angle + time * 10}deg)`,
                  opacity: 0.35,
                }}
              />
            )}
            {obj.type === 'comet' && (
              <svg width="24" height="6" viewBox="0 0 24 6">
                <ellipse cx="3" cy="3" rx="2.5" ry="1.5" fill="white" opacity="0.5" />
                <ellipse cx="9" cy="2.8" rx="4" ry="0.8" fill="white" opacity="0.2" />
                <ellipse cx="16" cy="2.8" rx="6" ry="0.4" fill="white" opacity="0.08" />
              </svg>
            )}
          </div>
        );
      })}
    </>
  );
});

SpaceObjects.displayName = 'SpaceObjects';
