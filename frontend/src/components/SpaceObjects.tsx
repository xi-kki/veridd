/**
 * SpaceObjects — Slow-drifting asteroids, planets with rings, comets, and a star field.
 * Extracted from FloatingIdCard for single-responsibility compliance.
 */
import React from 'react';

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
}

const STARS = Array.from({ length: 40 }).map(() => ({
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  opacity: Math.random() * 0.4 + 0.15,
  duration: Math.random() * 3 + 2,
  delay: Math.random() * 2,
}));

export const SpaceObjects: React.FC<Props> = React.memo(({ objects, time }) => (
  <>
    {/* Star field */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {STARS.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: s.size + 'px',
            height: s.size + 'px',
            left: s.left + '%',
            top: s.top + '%',
            opacity: s.opacity,
            animation: `twinkle ${s.duration}s ease-in-out infinite`,
            animationDelay: s.delay + 's',
          }}
        />
      ))}
    </div>

    {/* Space objects */}
    {objects.map((obj, i) => {
      const driftX =
        obj.type === 'comet' ? time * obj.speed * 30 : Math.sin(time * obj.speed + i) * 5;
      const driftY = Math.cos(time * obj.speed * 0.7 + i) * 3;
      const x = obj.x + driftX;
      const y = obj.y + driftY;
      const opacity =
        0.15 + (obj.type === 'comet' ? Math.sin(time * obj.speed * 2 + i) * 0.1 + 0.15 : 0.08);

      return (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            opacity,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {obj.type === 'planet' && (
            <svg width={obj.size * 6} height={obj.size * 6} viewBox="0 0 20 20">
              <circle cx="10" cy="10" r={obj.size * 1.5} fill={obj.color} opacity="0.6" />
              {obj.ringSize && (
                <ellipse
                  cx="10"
                  cy="10"
                  rx={obj.ringSize * 2}
                  ry={obj.ringSize * 0.6}
                  fill="none"
                  stroke={obj.color}
                  strokeWidth="0.5"
                  opacity="0.4"
                  transform={`rotate(${obj.angle}, 10, 10)`}
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
                opacity: 0.5,
              }}
            />
          )}
          {obj.type === 'comet' && (
            <svg width="30" height="8" viewBox="0 0 30 8">
              <ellipse cx="4" cy="4" rx="3" ry="2" fill="white" opacity="0.7" />
              <ellipse cx="12" cy="3.5" rx="5" ry="1.2" fill="white" opacity="0.3" />
              <ellipse cx="20" cy="3.5" rx="7" ry="0.6" fill="white" opacity="0.15" />
            </svg>
          )}
        </div>
      );
    })}
  </>
));

SpaceObjects.displayName = 'SpaceObjects';
