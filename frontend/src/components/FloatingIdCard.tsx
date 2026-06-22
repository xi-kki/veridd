import React, { useEffect, useRef, useState, useCallback } from 'react';

interface Props {
  onConnect: () => void;
}

/**
 * Floating VERIDD Identity Card — a prized medal suspended in deep space/water.
 *
 * The card hangs from a single ribbon that threads through a medal loop at the top,
 * then cascades down like a cape. The ribbon moves with fluid physics — momentum,
 * inertia, drift. The card itself floats with weight: reaching for it gently pushes
 * it away, like trying to grab something valuable floating in water.
 *
 * Reach for it 3 times. On the third, it surrenders. Click Connect Wallet for a celebration.
 */
export const FloatingIdCard: React.FC<Props> = ({ onConnect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // ───── Card physics (inertia-based) ────────────────────────────────────
  const [cardX, setCardX] = useState(50);     // percentage position
  const [cardY, setCardY] = useState(44);
  const velRef = useRef({ x: 0, y: 0 });      // velocity (inertia)

  // ───── Mouse tracking ──────────────────────────────────────────────────
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const floatTime = useRef(0);

  // ───── 3-hover mechanic ────────────────────────────────────────────────
  const [hoverCount, setHoverCount] = useState(0);
  const [caught, setCaught] = useState(false);
  const [buttonGlow, setButtonGlow] = useState(false);
  const hoverStreakRef = useRef(0);
  const lastHoverTime = useRef(0);

  // ───── Celebration & connection ────────────────────────────────────────
  const [celebrating, setCelebrating] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [particles, setParticles] = useState<Array<{
    id: number; x: number; y: number;
    vx: number; vy: number;
    color: string; size: number; life: number;
  }>>([]);

  // ───── Ticker ──────────────────────────────────────────────────────────
  const [tickerValue, setTickerValue] = useState(0);
  const tickerTarget = 12847;

  // ───── Ribbon physics (cape control points) ────────────────────────────
  // The ribbon has 2 physics-driven control points:
  //   c1 — between anchor and medal loop (upper drape)
  //   c2 — below the loop (cascading cape tail)
  const c1Ref = useRef({ x: 42, y: 10 });
  const c1Vel = useRef({ x: 0, y: 0 });
  const c2Ref = useRef({ x: 50, y: 70 });
  const c2Vel = useRef({ x: 0, y: 0 });

  // ───── Track "reach" attempts ─────────────────────────────────────────
  const checkProximity = useCallback((mx: number, my: number, cx: number, cy: number) => {
    return Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2) < 26;
  }, []);

  // ───── Spawn celebration particles ────────────────────────────────────
  const spawnCelebration = useCallback(() => {
    const colors = ['#a855f7', '#7c3aed', '#c084fc', '#22d3ee', '#34d399', '#fbbf24'];
    const newP: typeof particles = [];
    for (let i = 0; i < 60; i++) {
      const angle = (Math.PI * 2 * i) / 60 + (Math.random() - 0.5) * 0.5;
      const speed = 1.5 + Math.random() * 3;
      newP.push({
        id: i,
        x: 0, y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 4,
        life: 1,
      });
    }
    setParticles(newP);
    const interval = setInterval(() => {
      setParticles(prev => {
        const next = prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.02,  // gravity
          life: p.life - 0.025,
        })).filter(p => p.life > 0);
        if (next.length === 0) clearInterval(interval);
        return next;
      });
    }, 30);
  }, []);

  // ───── Mouse handlers ─────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || caught || connecting) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    mouseRef.current = { x: mx, y: my };

    const now = Date.now();
    if (checkProximity(mx, my, cardX, cardY)) {
      if (now - lastHoverTime.current > 800) {
        const newCount = Math.min(hoverStreakRef.current + 1, 3);
        hoverStreakRef.current = newCount;
        setHoverCount(newCount);
        lastHoverTime.current = now;

        if (newCount >= 3 && !caught) {
          setCaught(true);
          setButtonGlow(true);
        }
      }
    }
  }, [cardX, cardY, caught, connecting, checkProximity]);

  const handleMouseLeave = useCallback(() => {
    if (caught) return;
    mouseRef.current = { x: -9999, y: -9999 };
  }, [caught]);

  // ───── Physics-based animation loop ───────────────────────────────────
  useEffect(() => {
    let running = true;

    const animate = () => {
      if (!running) return;
      floatTime.current += 0.016; // ~60fps

      // ── CARD PHYSICS (inertia + spring) ──────────────────────────────
      // Target position: center + repel + gentle float oscillation
      const floatX = Math.sin(floatTime.current * 0.5) * 1.5;
      const floatY = Math.sin(floatTime.current * 0.7) * 2;

      const dx = mouseRef.current.x - cardX;
      const dy = mouseRef.current.y - cardY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let repelX = 0;
      let repelY = 0;

      if (caught) {
        // Caught: gently return to center with slight overshoot
        const toCX = 50 - cardX;
        const toCY = 44 - cardY;
        velRef.current.x += toCX * 0.002;
        velRef.current.y += toCY * 0.002;
      } else if (dist < 28 && dist > 0.5) {
        // Repel force: gentle push, stronger when closer, like water displacement
        const strength = ((28 - dist) / 28) * 0.15;
        repelX = -(dx / dist) * strength;
        repelY = -(dy / dist) * strength * 0.6;

        velRef.current.x += repelX;
        velRef.current.y += repelY;
      } else {
        // No mouse nearby: gentle spring toward center
        velRef.current.x += (50 - cardX) * 0.001;
        velRef.current.y += (44 - cardY) * 0.001;
      }

      // Damping — the "water/space" feel: smooth deceleration
      velRef.current.x *= 0.94;
      velRef.current.y *= 0.94;

      // Update position
      let newX = cardX + velRef.current.x + floatX * 0.008;
      let newY = cardY + velRef.current.y + floatY * 0.008;

      // Clamp to keep card fully visible (never off-screen)
      newX = Math.max(20, Math.min(80, newX));
      newY = Math.max(20, Math.min(75, newY));

      setCardX(newX);
      setCardY(newY);

      // ── RIBBON / CAPE PHYSICS ──────────────────────────────────────
      const loopX = newX;       // medal loop follows card
      const loopY = newY - 20;

      // c1: upper drape — between anchor (42,-5) and loop
      const c1TargetX = (42 + loopX) / 2 + Math.sin(floatTime.current * 0.4) * 2;
      const c1TargetY = (-5 + loopY) / 2 + 3;

      // c2: cape tail — below the loop, cascading down
      const c2TargetX = loopX + Math.sin(floatTime.current * 0.3) * 5;
      const c2TargetY = loopY + 35 + Math.cos(floatTime.current * 0.5) * 3;

      // Spring forces on c1
      c1Vel.current.x += (c1TargetX - c1Ref.current.x) * 0.004;
      c1Vel.current.y += (c1TargetY - c1Ref.current.y) * 0.004;
      c1Vel.current.x *= 0.93;
      c1Vel.current.y *= 0.93;
      c1Ref.current.x += c1Vel.current.x;
      c1Ref.current.y += c1Vel.current.y;

      // Spring forces on c2 (cascading tail — more dramatic)
      c2Vel.current.x += (c2TargetX - c2Ref.current.x) * 0.003;
      c2Vel.current.y += (c2TargetY - c2Ref.current.y) * 0.003 + 0.002; // slight gravity
      c2Vel.current.x *= 0.94;
      c2Vel.current.y *= 0.94;
      c2Ref.current.x += c2Vel.current.x;
      c2Ref.current.y += c2Vel.current.y;

      // ── Ticker ─────────────────────────────────────────────────────
      if (connecting) {
        setTickerValue(prev => {
          if (prev < tickerTarget) {
            return Math.min(prev + Math.floor((tickerTarget - prev) / 40) + 1, tickerTarget);
          }
          return prev;
        });
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [cardX, cardY, caught, connecting]);

  // ───── Handle connect click ─────────────────────────────────────────
  const handleConnect = useCallback(() => {
    setCelebrating(true);
    spawnCelebration();

    setTimeout(() => {
      setCelebrating(false);
      setConnecting(true);

      setTimeout(() => {
        setConnecting(false);
        setTickerValue(tickerTarget);
        onConnect();
      }, 2500);
    }, 1200);
  }, [onConnect, spawnCelebration]);

  // ───── SVG paths ────────────────────────────────────────────────────
  const loopX = cardX;
  const loopY = cardY - 20;

  // Ribbon path: anchor → c1 (upper drape) → medal loop → c2 (cape tail) → tail end
  const anchorX = 42;
  const anchorY = -5;

  // Upper ribbon: anchor through loop (medal ribbon style)
  const upperPath = `M ${anchorX} ${anchorY} Q ${c1Ref.current.x} ${c1Ref.current.y} ${loopX} ${loopY}`;

  // Lower cape: loop cascading down
  const tailEndX = c2Ref.current.x + Math.sin(floatTime.current * 0.4) * 3;
  const tailEndY = c2Ref.current.y + 15;
  const lowerPath = `M ${loopX} ${loopY} Q ${c2Ref.current.x} ${c2Ref.current.y} ${tailEndX} ${tailEndY}`;

  // Full ribbon (for glow overlay)
  const fullRibbon = `${upperPath} ${lowerPath.slice(1)}`;

  // ───── Button pulse ─────────────────────────────────────────────────
  const btnPulseClass = buttonGlow
    ? 'shadow-[0_0_25px_#a855f7] animate-pulse'
    : '';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[500px] sm:h-[580px] overflow-hidden select-none cursor-default"
    >
      {/* ═══ Star field ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5 + 0.2,
              animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>

      {/* ═══ Celebration particles ═══ */}
      {celebrating && particles.map(p => (
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

      {/* ═══ RIBBON / CAPE SVG ═══ */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ filter: 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.25))' }}
      >
        {/* Cape ribbon — main flowing tail */}
        <path
          d={fullRibbon}
          fill="none"
          stroke="url(#capeGrad)"
          strokeWidth="0.55"
          strokeLinecap="round"
          opacity="0.65"
        />
        {/* Core glow */}
        <path
          d={fullRibbon}
          fill="none"
          stroke="#a855f7"
          strokeWidth="0.15"
          strokeLinecap="round"
          opacity="0.45"
        />
        {/* Fabric texture overlay */}
        <path
          d={fullRibbon}
          fill="none"
          stroke="#c084fc"
          strokeWidth="0.06"
          strokeLinecap="round"
          opacity="0.25"
          strokeDasharray="0.15 0.5 0.3 0.4"
        />
        {/* Anchor point glow */}
        <circle cx={anchorX} cy={anchorY} r="1.8" fill="none" stroke="#7c3aed" strokeWidth="0.25" opacity="0.6" />
        <circle cx={anchorX} cy={anchorY} r="0.8" fill="#a855f7" opacity="0.4" />

        {/* Gradient definition — fades toward tail end */}
        <defs>
          <linearGradient id="capeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#a855f7" stopOpacity="0.7" />
            <stop offset="70%" stopColor="#c084fc" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>

      {/* ═══ Hover progress dots ═══ */}
      {!caught && hoverCount > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 pointer-events-none">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-700 ${
                i <= hoverCount
                  ? 'bg-violet-400 shadow-[0_0_8px_#a855f7] scale-110'
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      )}

      {/* ═══ THE CARD (medal) ═══ */}
      <div
        ref={cardRef}
        className="absolute z-10"
        style={{
          left: `calc(${cardX}% - 150px)`,
          top: `calc(${cardY}% - 110px)`,
          transform: `rotate(${caught ? '0deg' : `${Math.max(-3, Math.min(3, (mouseRef.current.x - 50) * 0.025))}deg`})`,
          transition: caught ? 'transform 0.6s ease-out' : undefined,
        }}
      >
        {/* ═══ MEDAL LOOP ═══ */}
        <div
          className="absolute left-1/2 -top-5 z-20 pointer-events-none flex flex-col items-center"
          style={{ marginLeft: '-7px' }}
        >
          {/* Outer ring */}
          <div
            className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
            style={{
              borderColor: '#a855f7',
              boxShadow: '0 0 10px rgba(168, 85, 247, 0.5), inset 0 0 6px rgba(168, 85, 247, 0.3)',
              background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(124,58,237,0.1))',
            }}
          >
            <div className="w-1 h-1 rounded-full bg-violet-400/50" />
          </div>
          {/* Small connector stem */}
          <div className="w-0.5 h-2 bg-gradient-to-b from-violet-500/60 to-violet-400/20" />
        </div>

        {/* ═══ CARD BODY ═══ */}
        <div
          className={`relative w-[280px] sm:w-[320px] rounded-2xl overflow-hidden
            bg-gradient-to-br from-gray-900 via-indigo-950/90 to-gray-900
            border shadow-2xl backdrop-blur-xl ${
              caught
                ? 'border-violet-400/50 shadow-violet-500/30'
                : 'border-violet-500/30 shadow-violet-500/15'
            }`}
          style={{
            boxShadow: caught
              ? '0 0 40px rgba(168, 85, 247, 0.3), 0 0 80px rgba(168, 85, 247, 0.1)'
              : undefined,
          }}
        >
          {/* Holographic shimmer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-violet-400/5 to-transparent animate-shimmer"
              style={{ transform: 'skewX(-20deg) translateX(-100%)' }} />
          </div>

          {/* Card border glow */}
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-violet-500/20 pointer-events-none" />
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none" />

          {/* Top section */}
          <div className="relative px-5 pt-5 pb-3 border-b border-violet-500/15">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-purple-800
                  flex items-center justify-center shadow-lg shadow-violet-500/20 ring-1 ring-violet-400/30">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
                    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-white font-black text-lg tracking-tight leading-none">VERIDD</h2>
                  <p className="text-[10px] text-violet-400/70 font-medium tracking-widest uppercase">True Identity for AI Agents</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-md border ${
                caught ? 'bg-violet-500/20 border-violet-400/40' : 'bg-violet-500/10 border-violet-500/25'
              }`}>
                <span className="text-[9px] font-bold text-violet-400 tracking-wider">0G</span>
              </div>
            </div>
          </div>

          {/* Middle */}
          <div className="relative px-5 py-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-violet-600/30 to-indigo-800/30
                  border border-violet-400/25 flex items-center justify-center shadow-inner shadow-violet-900/30 overflow-hidden relative">
                  <svg viewBox="0 0 80 80" className="absolute inset-0 w-full h-full opacity-30">
                    <line x1="20" y1="10" x2="20" y2="40" stroke="#a855f7" strokeWidth="0.5" />
                    <line x1="10" y1="40" x2="40" y2="40" stroke="#a855f7" strokeWidth="0.5" />
                    <line x1="40" y1="40" x2="40" y2="60" stroke="#a855f7" strokeWidth="0.5" />
                    <line x1="60" y1="20" x2="60" y2="50" stroke="#a855f7" strokeWidth="0.5" />
                    <line x1="50" y1="50" x2="70" y2="50" stroke="#a855f7" strokeWidth="0.5" />
                    <circle cx="40" cy="40" r="3" fill="none" stroke="#c084fc" strokeWidth="0.5" />
                    <circle cx="60" cy="50" r="2" fill="none" stroke="#c084fc" strokeWidth="0.5" />
                  </svg>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5" className="w-7 h-7 relative z-10">
                    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div>
                  <p className="text-[9px] text-gray-600 font-medium uppercase tracking-widest">Agent</p>
                  <p className={`text-sm font-bold truncate ${caught ? 'text-violet-300' : 'text-white'}`}>
                    {caught ? 'Ready to Connect' : 'Unregistered'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <div>
                    <p className="text-[9px] text-gray-600 font-medium uppercase tracking-widest">ID</p>
                    <p className="text-xs font-mono text-gray-400">#--------</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-600 font-medium uppercase tracking-widest">Status</p>
                    <p className={`text-xs font-medium flex items-center gap-1 ${caught ? 'text-emerald-400' : 'text-amber-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${caught ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
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
                  <p className="text-[9px] text-gray-600 font-medium uppercase tracking-widest mb-0.5">Trusted by</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-black text-violet-400 font-mono tabular-nums">
                      {tickerValue.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-500">AI Agents</span>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[9px] text-gray-600 font-medium uppercase tracking-widest mb-0.5">VERIDD Score</p>
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
                  className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-all duration-300
                    cursor-pointer flex items-center gap-1.5 ${
                      buttonGlow
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 scale-105 ' + btnPulseClass
                        : 'bg-violet-600 hover:bg-violet-500'
                    } shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
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
                { label: '0G Chain', color: 'bg-violet-500/15 text-violet-400 border-violet-500/25' },
                { label: '0G Storage', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
                { label: '0G Compute', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25' },
                { label: 'Agentic ID', color: 'bg-violet-400/15 text-violet-300 border-violet-400/25' },
              ].map(badge => (
                <span key={badge.label} className={`text-[8px] px-2 py-0.5 rounded-full border font-medium ${badge.color}`}>
                  {badge.label}
                </span>
              ))}
            </div>
          </div>

          <div className={`h-1 bg-gradient-to-r ${
            caught
              ? 'from-violet-400 via-purple-400 to-violet-400'
              : 'from-violet-600/50 via-purple-500/50 to-violet-600/50'
          }`} />
        </div>
      </div>

      {/* ═══ Tagline ═══ */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <p className="text-xs text-gray-500 animate-fade-in max-w-[260px]" style={{ animationDelay: '0.5s' }}>
          A <span className="text-violet-400 font-medium">credit score</span> for AI agents — verified on 0G
        </p>
      </div>
    </div>
  );
};
