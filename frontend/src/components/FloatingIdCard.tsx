import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { RocketCursor } from './RocketCursor';
import { SpaceObjects } from './SpaceObjects';
import { MissionTerminal } from './MissionTerminal';

interface Props {
  onConnect: () => void;
}

const HOVER_THRESHOLD = 8;
const BOUNDS = { xMin: 15, xMax: 85, yMin: 15, yMax: 80 };
const CENTER = { x: 50, y: 42 };
const REPEL_STRENGTH = 0.22; // How hard the card dodges cursor
const APPROACH_SPEED = 0.005; // How eagerly it returns

/**
 * Floating VERIDD Identity Card — superhero physics, 8-hover mechanic,
 * rocket cursor, space background. Core hero component for VERIDD landing.
 */
export const FloatingIdCard: React.FC<Props> = ({ onConnect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const velRef = useRef({ x: 0, y: 0 });
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const floatTime = useRef(0);
  const hoverStreakRef = useRef(0);
  const lastHoverTime = useRef(0);
  const attractedRef = useRef(false);
  const lastMousePos = useRef({ x: -100, y: -100 });
  const mouseVelRef = useRef({ x: 0, y: 0 });
  const fumeIdRef = useRef(0);
  const lastFumeTime = useRef(0);

  const [cardX, setCardX] = useState(50);
  const [cardY, setCardY] = useState(42);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [caught, setCaught] = useState(false);
  const [btnBlink, setBtnBlink] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      life: number;
    }>
  >([]);
  const [tickerValue, setTickerValue] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [mouseOnScreen, setMouseOnScreen] = useState(false);
  const [rocketTilt, setRocketTilt] = useState(0);
  const [fumes, setFumes] = useState<
    Array<{ id: number; x: number; y: number; size: number; opacity: number }>
  >([]);
  const [mousePct, setMousePct] = useState({ x: 50, y: 50 });

  // ───── Space objects (stable across renders) ─────────────────────────
  const spaceObjects = useMemo(() => {
    const types = ['asteroid', 'planet', 'comet'] as const;
    const colors = {
      planet: ['#7c3aed', '#a855f7', '#22d3ee', '#f59e0b'],
      asteroid: ['#6b7280', '#9ca3af', '#8b5cf6'],
    };
    return Array.from({ length: 6 }, () => {
      const type = types[Math.floor(Math.random() * 3)];
      return {
        type,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: type === 'planet' ? 3 + Math.random() * 5 : 1.5 + Math.random() * 3,
        speed: 0.01 + Math.random() * 0.03,
        angle: Math.random() * 360,
        color:
          colors[type === 'planet' ? 'planet' : 'asteroid'][
            Math.floor(Math.random() * (type === 'planet' ? 4 : 3))
          ],
        ringSize: type === 'planet' ? 4 + Math.random() * 3 : undefined,
      };
    });
  }, []);

  // ───── Celebration burst ─────────────────────────────────────────────
  const spawnCelebration = useCallback(() => {
    const colors = ['#a855f7', '#7c3aed', '#c084fc', '#22d3ee', '#34d399', '#fbbf24'];
    const p = [];
    for (let i = 0; i < 60; i++) {
      const a = (Math.PI * 2 * i) / 60 + (Math.random() - 0.5) * 0.5;
      const s = 1.5 + Math.random() * 3;
      p.push({
        id: i,
        x: 0,
        y: 0,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 1,
        color: colors[Math.floor(Math.random() * 6)],
        size: 2 + Math.random() * 4,
        life: 1,
      });
    }
    setParticles(p);
    const iv = setInterval(() => {
      setParticles((prev) => {
        const next = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.02,
            life: p.life - 0.025,
          }))
          .filter((p) => p.life > 0);
        if (next.length === 0) clearInterval(iv);
        return next;
      });
    }, 30);
  }, []);

  // ───── Mouse handlers ────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || connecting) return;
      const rect = containerRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const mx = (px / rect.width) * 100;
      const my = (py / rect.height) * 100;

      mouseVelRef.current = { x: px - lastMousePos.current.x, y: py - lastMousePos.current.y };
      lastMousePos.current = { x: px, y: py };

      setCursorPos({ x: px, y: py });
      setMouseOnScreen(true);
      setMousePct({ x: mx, y: my });

      const targetTilt = Math.max(-25, Math.min(25, -mouseVelRef.current.x * 0.3));
      setRocketTilt((prev) => prev + (targetTilt - prev) * 0.15);

      // Throttled fumes
      const nowMs = Date.now();
      if (nowMs - lastFumeTime.current > 40) {
        lastFumeTime.current = nowMs;
        const id = fumeIdRef.current++;
        setFumes((prev) => [
          ...prev,
          {
            id,
            x: px + (Math.random() - 0.5) * 4,
            y: py + 6 + Math.random() * 4,
            size: 4 + Math.random() * 6,
            opacity: 0.55,
          },
        ]);
        setTimeout(() => setFumes((prev) => prev.filter((f) => f.id !== id)), 1000);
      }

      if (!caught) mouseRef.current = { x: mx, y: my };

      // Hover detection
      const now = Date.now();
      const dist = Math.sqrt((mx - cardX) ** 2 + (my - cardY) ** 2);
      // ── Playful chase sequence ──
      // Phase 1 (streak 0-4): Card runs away — "can't catch me!"
      // Phase 2 (streak 5-7): Card drifts toward cursor — "okay fine..."
      // Phase 3 (streak 8):   Caught! Returns to center, button blinks
      if (!caught && dist < 28 && now - lastHoverTime.current > 700) {
        const n = Math.min(hoverStreakRef.current + 1, HOVER_THRESHOLD);
        hoverStreakRef.current = n;
        lastHoverTime.current = now;

        if (n >= HOVER_THRESHOLD) {
          // Phase 3: Caught! Back to center, connect button activates
          setCaught(true);
          attractedRef.current = true;
          setBtnBlink(true);
        } else if (n >= 5) {
          // Phase 2: Card starts trusting — drifts toward cursor
          attractedRef.current = true;
          setBtnBlink(true);
          setTimeout(() => setBtnBlink(false), 1000);
        } else {
          // Phase 1: Card is shy — repels from cursor
          attractedRef.current = false;
        }
      }
    },
    [cardX, cardY, caught, connecting],
  );

  const handleMouseLeave = useCallback(() => {
    if (caught) return;
    mouseRef.current = { x: -9999, y: -9999 };
    setMouseOnScreen(false);
  }, [caught]);

  // ───── Physics loop — Phase 1 (run) → Phase 2 (approach) → Phase 3 (center) ──
  //
  // Phase 1 (streak 0-4): Card repels from cursor like "can't catch me!"
  //   → Cursor gets close, card pushes away playfully
  // Phase 2 (streak 5-7): Card drifts toward cursor — "okay fine..."
  //   → Gentle magnetic pull, 3 approaches, builds trust
  // Phase 3 (caught):      Card returns to center, button activates
  //   → User can finally click Connect Wallet
  //
  // Rocket orientation: The rocket (cursor) points at the card like a
  // spaceship orbiting a planet — always facing the center of attraction.
  //
  // Damping 0.965 + overshoot = fluid rubber-band feel
  // Two overlapping sine waves for organic idle breathing
  useEffect(() => {
    let running = true;
    const animate = () => {
      if (!running) return;
      floatTime.current += 0.016;

      // Organic idle float — two overlapping sine waves
      const floatX =
        Math.sin(floatTime.current * 0.4) * 1.8 + Math.sin(floatTime.current * 0.12) * 1.2;
      const floatY =
        Math.sin(floatTime.current * 0.6) * 2.2 + Math.cos(floatTime.current * 0.18) * 1.5;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const dx = mx - cardX;
      const dy = my - cardY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const mouseActive = mx > -1000;
      const streak = hoverStreakRef.current;

      if (caught) {
        // ── Phase 3: Caught! Return to center smoothly ──
        velRef.current.x += (CENTER.x - cardX) * 0.012;
        velRef.current.y += (CENTER.y - cardY) * 0.012;
      } else if (mouseActive) {
        if (streak < 5) {
          // ── Phase 1: "Can't catch me!" — STRONG REPEL ──
          // Card aggressively pushes away from cursor
          if (dist < 30 && dist > 0.5) {
            const repel = ((30 - dist) / 30) * REPEL_STRENGTH;
            velRef.current.x += -(dx / dist) * repel;
            velRef.current.y += -(dy / dist) * repel * 0.6;
          }
          // Gentle center pull when far
          velRef.current.x += (CENTER.x - cardX) * 0.001;
          velRef.current.y += (CENTER.y - cardY) * 0.001;
        } else {
          // ── Phase 2: "Okay fine..." — CLEAR APPROACH ──
          // Card drifts toward cursor with visible pull
          const pull = Math.min(dist * APPROACH_SPEED, 0.15);
          velRef.current.x += (dx / (dist || 1)) * pull;
          velRef.current.y += (dy / (dist || 1)) * pull * 0.7;
          // Soft center pull to avoid sticking to cursor
          velRef.current.x += (CENTER.x - cardX) * 0.001;
          velRef.current.y += (CENTER.y - cardY) * 0.001;
        }
      } else {
        // No mouse — drift back to center
        velRef.current.x += (CENTER.x - cardX) * 0.003;
        velRef.current.y += (CENTER.y - cardY) * 0.003;
      }

      // Low damping = fluid, floaty overshoot
      velRef.current.x *= 0.962;
      velRef.current.y *= 0.962;

      let newX = cardX + velRef.current.x + floatX * 0.004;
      let newY = cardY + velRef.current.y + floatY * 0.004;
      newX = Math.max(BOUNDS.xMin, Math.min(BOUNDS.xMax, newX));
      newY = Math.max(BOUNDS.yMin, Math.min(BOUNDS.yMax, newY));

      setCardX(newX);
      setCardY(newY);

      // Tilt — responsive to velocity, card feels alive
      setTilt((prev) => ({
        rx:
          prev.rx +
          (Math.max(-10, Math.min(10, -velRef.current.y * 0.6)) - prev.rx) * 0.06,
        ry:
          prev.ry +
          (Math.max(-14, Math.min(14, velRef.current.x * 0.6)) - prev.ry) * 0.06,
      }));

      // ── Rocket orients toward card (like orbiting a planet) ──
      // The rocket (cursor) should always face the card, like a ship
      // circling a planet. We calculate the angle from cursor → card
      // and blend it with velocity for natural movement.
      if (mouseOnScreen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Card center in pixels
        const cardPx = (cardX / 100) * rect.width;
        const cardPy = (cardY / 100) * rect.height;
        // Angle from cursor position toward card center
        const dxToCard = cardPx - cursorPos.x;
        const dyToCard = cardPy - cursorPos.y;
        if (Math.abs(dxToCard) > 2 || Math.abs(dyToCard) > 2) {
          const angleToCard = Math.atan2(dyToCard, dxToCard) * (180 / Math.PI);
          // Blend: 50% face-card orbit + 50% velocity for natural feel
          const velTilt = -mouseVelRef.current.x * 0.25;
          const blended = angleToCard * 0.5 + velTilt * 0.5;
          const clamped = Math.max(-35, Math.min(35, blended));
          setRocketTilt((prev) => prev + (clamped - prev) * 0.1);
        }
      }

      // Drift fumes
      setFumes((prev) =>
        prev
          .map((f) => ({ ...f, y: f.y + 0.4, size: f.size * 0.99, opacity: f.opacity * 0.98 }))
          .filter((f) => f.opacity > 0.01),
      );

      if (connecting) {
        setTickerValue((prev) =>
          prev < 12847 ? Math.min(prev + Math.floor((12847 - prev) / 40) + 1, 12847) : prev,
        );
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [cardX, cardY, caught, connecting, mouseOnScreen, cursorPos.x, cursorPos.y]);

  // ───── Connect handler ───────────────────────────────────────────────
  const handleConnect = useCallback(() => {
    setCelebrating(true);
    spawnCelebration();
    setTimeout(() => {
      setCelebrating(false);
      setConnecting(true);
      setTimeout(() => {
        setConnecting(false);
        hoverStreakRef.current = 0;
        attractedRef.current = false;
        setCaught(false);
        onConnect();
      }, 2500);
    }, 1200);
  }, [onConnect, spawnCelebration]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-screen overflow-hidden select-none"
      style={{ cursor: 'none' }}
    >
      <RocketCursor
        x={cursorPos.x}
        y={cursorPos.y}
        tilt={rocketTilt}
        onScreen={mouseOnScreen}
        fumes={fumes}
      />

      <SpaceObjects
        objects={spaceObjects}
        time={floatTime.current}
        mouseX={mousePct.x}
        mouseY={mousePct.y}
      />

      {/* Celebration particles */}
      {celebrating &&
        particles.map((p) => (
          <div
            key={p.id}
            className="absolute pointer-events-none z-50 rounded-full"
            style={{
              left: `calc(50% + ${p.x}px)`,
              top: `calc(50% + ${p.y}px)`,
              width: p.size + 'px',
              height: p.size + 'px',
              backgroundColor: p.color,
              opacity: Math.max(0, p.life),
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              transition: 'all 0.03s linear',
            }}
          />
        ))}

      {/* ═══ FLYING CARD ═══ */}
      <div
        className="absolute z-10"
        style={{
          left: `calc(${cardX}% - 150px)`,
          top: `calc(${cardY}% - 110px)`,
          transform: `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: 'transform 0.05s ease-out',
        }}
      >
        {/* Medal loop */}
        <div
          className="absolute left-1/2 -top-5 z-20 pointer-events-none flex flex-col items-center"
          style={{ marginLeft: '-7px' }}
        >
          <div
            className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
            style={{
              borderColor: '#a855f7',
              boxShadow: '0 0 10px rgba(168,85,247,0.5), inset 0 0 6px rgba(168,85,247,0.3)',
              background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(124,58,237,0.1))',
            }}
          >
            <div className="w-1 h-1 rounded-full bg-violet-400/50" />
          </div>
        </div>

        {/* Card body */}
        <div
          className={`relative w-[280px] sm:w-[320px] rounded-2xl overflow-hidden
          bg-gradient-to-br from-gray-900 via-indigo-950/90 to-gray-900
          border shadow-2xl backdrop-blur-xl ${caught ? 'border-violet-400/50 shadow-violet-500/30' : 'border-violet-500/30 shadow-violet-500/15'}`}
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-br from-transparent via-violet-400/5 to-transparent animate-shimmer"
              style={{ transform: 'skewX(-20deg) translateX(-100%)' }}
            />
          </div>
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-violet-500/20 pointer-events-none" />
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none" />

          {/* Brand */}
          <div className="relative px-5 pt-5 pb-3 border-b border-violet-500/15">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center shadow-lg shadow-violet-500/20 ring-1 ring-violet-400/30">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    className="w-5 h-5"
                  >
                    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-white font-black text-lg tracking-tight leading-none">
                    VERIDD
                  </h2>
                  <p className="text-[10px] text-violet-400/70 font-medium tracking-widest uppercase">
                    True Identity for AI Agents
                  </p>
                </div>
              </div>
              <div
                className={`px-2 py-1 rounded-md border ${caught ? 'bg-violet-500/20 border-violet-400/40' : 'bg-violet-500/10 border-violet-500/25'}`}
              >
                <span className="text-[9px] font-bold text-violet-400 tracking-wider">0G</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="relative px-5 py-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-violet-600/30 to-indigo-800/30
                  border border-violet-400/25 flex items-center justify-center shadow-inner shadow-violet-900/30 overflow-hidden relative"
                >
                  <svg viewBox="0 0 80 80" className="absolute inset-0 w-full h-full opacity-30">
                    <line x1="20" y1="10" x2="20" y2="40" stroke="#a855f7" strokeWidth="0.5" />
                    <line x1="10" y1="40" x2="40" y2="40" stroke="#a855f7" strokeWidth="0.5" />
                    <line x1="40" y1="40" x2="40" y2="60" stroke="#a855f7" strokeWidth="0.5" />
                    <line x1="60" y1="20" x2="60" y2="50" stroke="#a855f7" strokeWidth="0.5" />
                    <line x1="50" y1="50" x2="70" y2="50" stroke="#a855f7" strokeWidth="0.5" />
                    <circle cx="40" cy="40" r="3" fill="none" stroke="#c084fc" strokeWidth="0.5" />
                    <circle cx="60" cy="50" r="2" fill="none" stroke="#c084fc" strokeWidth="0.5" />
                  </svg>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="1.5"
                    className="w-7 h-7 relative z-10"
                  >
                    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div>
                  <p className="text-[9px] text-gray-600 font-medium uppercase tracking-widest">
                    Agent
                  </p>
                  <p
                    className={`text-sm font-bold truncate ${caught ? 'text-violet-300' : 'text-white'}`}
                  >
                    {caught ? 'Ready to Connect' : 'Unregistered'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <div>
                    <p className="text-[9px] text-gray-600 font-medium uppercase tracking-widest">
                      ID
                    </p>
                    <p className="text-xs font-mono text-gray-400">#--------</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-600 font-medium uppercase tracking-widest">
                      Status
                    </p>
                    <p
                      className={`text-xs font-medium flex items-center gap-1 ${caught ? 'text-emerald-400' : 'text-amber-400'}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${caught ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}
                      />
                      {caught ? 'Verified' : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="relative px-5 py-3 bg-black/30 border-t border-violet-500/15">
            <div className="flex items-center justify-between">
              {connecting ? (
                <div>
                  <p className="text-[9px] text-gray-600 font-medium uppercase tracking-widest mb-0.5">
                    Trusted by
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-black text-violet-400 font-mono tabular-nums">
                      {tickerValue.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-500">AI Agents</span>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[9px] text-gray-600 font-medium uppercase tracking-widest mb-0.5">
                    VERIDD Score
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-gray-600">—</span>
                    <span className="text-[10px] text-gray-700">
                      {caught ? 'tap to connect' : 'awaiting activation'}
                    </span>
                  </div>
                </div>
              )}

              {!connecting ? (
                <button
                  onClick={handleConnect}
                  className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                    btnBlink
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 scale-105 animate-pulse shadow-[0_0_30px_#a855f7]'
                      : 'bg-violet-600 hover:bg-violet-500'
                  } shadow-lg shadow-violet-500/25`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-3.5 h-3.5"
                  >
                    <path d="M21 12a9 9 0 1 1-9-9" />
                    <path d="M21 3v6h-6" />
                  </svg>
                  Connect Wallet
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] text-violet-400">Connecting...</span>
                </div>
              )}
            </div>
            <div className="flex gap-1.5 mt-2.5 flex-wrap">
              {[
                {
                  label: '0G Chain',
                  color: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
                },
                {
                  label: '0G Storage',
                  color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
                },
                { label: '0G Compute', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25' },
                {
                  label: 'Agentic ID',
                  color: 'bg-violet-400/15 text-violet-300 border-violet-400/25',
                },
              ].map((b) => (
                <span
                  key={b.label}
                  className={`text-[8px] px-2 py-0.5 rounded-full border font-medium ${b.color}`}
                >
                  {b.label}
                </span>
              ))}
            </div>
          </div>
          <div
            className={`h-1 bg-gradient-to-r ${caught ? 'from-violet-400 via-purple-400 to-violet-400' : 'from-violet-600/50 via-purple-500/50 to-violet-600/50'}`}
          />
        </div>
      </div>

      {/* Mission Terminal — intergalactic scrolling command-line */}
      <MissionTerminal />
    </div>
  );
};
