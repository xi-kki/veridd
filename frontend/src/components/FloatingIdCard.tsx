import React, { useEffect, useRef, useState, useCallback } from 'react';

interface Props {
  onConnect: () => void;
}

/**
 * Floating VERIDD Identity Card — a prized medal suspended in deep space.
 */
export const FloatingIdCard: React.FC<Props> = ({ onConnect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // ───── Card physics ────────────────────────────────────────────────────
  const [cardX, setCardX] = useState(50);
  const [cardY, setCardY] = useState(42);
  const velRef = useRef({ x: 0, y: 0 });

  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const floatTime = useRef(0);

  // ───── Tilt ────────────────────────────────────────────────────────────
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  // ───── 8-hover mechanic ────────────────────────────────────────────────
  const [caught, setCaught] = useState(false);
  const [btnBlink, setBtnBlink] = useState(false);
  const hoverStreakRef = useRef(0);
  const lastHoverTime = useRef(0);
  const attractedRef = useRef(false);
  const HOVER_THRESHOLD = 8;

  // ───── Celebration & connection ────────────────────────────────────────
  const [celebrating, setCelebrating] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [particles, setParticles] = useState<Array<{
    id: number; x: number; y: number;
    vx: number; vy: number;
    color: string; size: number; life: number;
  }>>([]);

  const [tickerValue, setTickerValue] = useState(0);
  const tickerTarget = 12847;

  // ───── Rocket cursor ───────────────────────────────────────────────────
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [mouseOnScreen, setMouseOnScreen] = useState(false);
  const [rocketTilt, setRocketTilt] = useState(0);
  const fumeIdRef = useRef(0);
  const lastFumeTime = useRef(0);
  const mouseVelRef = useRef({ x: 0, y: 0 });
  const lastMousePos = useRef({ x: -100, y: -100 });
  const [fumes, setFumes] = useState<Array<{
    id: number; x: number; y: number;
    size: number; opacity: number;
  }>>([]);

  // ───── Space objects ───────────────────────────────────────────────────
  const [spaceObjects] = useState(() => {
    const objs: Array<{
      type: 'asteroid' | 'planet' | 'comet';
      x: number; y: number;
      size: number; speed: number;
      angle: number; color: string;
      ringSize?: number;
    }> = [];
    for (let i = 0; i < 6; i++) {
      const type = (['asteroid', 'planet', 'comet'] as const)[Math.floor(Math.random() * 3)];
      objs.push({
        type,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: type === 'planet' ? 3 + Math.random() * 5 : 1.5 + Math.random() * 3,
        speed: 0.01 + Math.random() * 0.03,
        angle: Math.random() * 360,
        color: type === 'planet'
          ? ['#7c3aed', '#a855f7', '#22d3ee', '#f59e0b'][Math.floor(Math.random() * 4)]
          : ['#6b7280', '#9ca3af', '#8b5cf6'][Math.floor(Math.random() * 3)],
        ringSize: type === 'planet' ? 4 + Math.random() * 3 : undefined,
      });
    }
    return objs;
  });

  // ───── Track proximity ────────────────────────────────────────────────
  const checkProx = useCallback((mx: number, my: number, cx: number, cy: number) => {
    return Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2) < 28;
  }, []);

  // ───── Celebration ────────────────────────────────────────────────────
  const spawnCelebration = useCallback(() => {
    const colors = ['#a855f7', '#7c3aed', '#c084fc', '#22d3ee', '#34d399', '#fbbf24'];
    const p: typeof particles = [];
    for (let i = 0; i < 60; i++) {
      const a = (Math.PI * 2 * i) / 60 + (Math.random() - 0.5) * 0.5;
      const s = 1.5 + Math.random() * 3;
      p.push({ id: i, x: 0, y: 0, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, color: colors[Math.floor(Math.random() * colors.length)], size: 2 + Math.random() * 4, life: 1 });
    }
    setParticles(p);
    const iv = setInterval(() => {
      setParticles(prev => {
        const n = prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.02, life: p.life - 0.025 })).filter(p => p.life > 0);
        if (n.length === 0) clearInterval(iv);
        return n;
      });
    }, 30);
  }, []);

  // ───── Mouse handlers ─────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || connecting) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;

    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Mouse velocity for rocket tilt
    mouseVelRef.current = {
      x: px - lastMousePos.current.x,
      y: py - lastMousePos.current.y,
    };
    lastMousePos.current = { x: px, y: py };

    setCursorPos({ x: px, y: py });
    setMouseOnScreen(true);

    // Rocket tilt from velocity
    const targetTilt = Math.max(-25, Math.min(25, -mouseVelRef.current.x * 0.3));
    setRocketTilt(prev => prev + (targetTilt - prev) * 0.15);

    // Throttled fumes
    const nowMs = Date.now();
    if (nowMs - lastFumeTime.current > 40) {
      lastFumeTime.current = nowMs;
      const id = fumeIdRef.current++;
      setFumes(prev => [...prev, { id, x: px + (Math.random() - 0.5) * 4, y: py + 6 + Math.random() * 4, size: 4 + Math.random() * 6, opacity: 0.55 }]);
      setTimeout(() => {
        setFumes(prev => prev.filter(f => f.id !== id));
      }, 1000);
    }

    if (!caught) mouseRef.current = { x: mx, y: my };

    const now = Date.now();
    if (!caught && checkProx(mx, my, cardX, cardY)) {
      if (now - lastHoverTime.current > 800) {
        const n = Math.min(hoverStreakRef.current + 1, HOVER_THRESHOLD);
        hoverStreakRef.current = n;
        lastHoverTime.current = now;

        if (n >= HOVER_THRESHOLD) {
          setCaught(true);
          attractedRef.current = true;
          setBtnBlink(true);  // glows forever until clicked
        } else if (n >= 5) {
          attractedRef.current = true;
          setBtnBlink(true);
          setTimeout(() => setBtnBlink(false), 800);
        } else {
          attractedRef.current = false;
        }
      }
    }
  }, [cardX, cardY, caught, connecting, checkProx]);

  const handleMouseLeave = useCallback(() => {
    if (caught) return;
    mouseRef.current = { x: -9999, y: -9999 };
    setMouseOnScreen(false);
  }, [caught]);

  // ───── Physics loop ───────────────────────────────────────────────────
  useEffect(() => {
    let running = true;

    const animate = () => {
      if (!running) return;
      floatTime.current += 0.016;

      // ── Card physics ─────────────────────────────────────────────────
      const floatX = Math.sin(floatTime.current * 0.5) * 1.2;
      const floatY = Math.sin(floatTime.current * 0.7) * 1.5;

      const dx = mouseRef.current.x - cardX;
      const dy = mouseRef.current.y - cardY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const streak = hoverStreakRef.current;

      if (caught && attractedRef.current) {
        // Drift smoothly to center
        velRef.current.x += (50 - cardX) * 0.006;
        velRef.current.y += (42 - cardY) * 0.006;
      } else if (!caught && streak >= 5 && streak < HOVER_THRESHOLD) {
        const pullStrength = Math.min(dist * 0.003, 0.1);
        velRef.current.x += (dx / (dist || 1)) * pullStrength;
        velRef.current.y += (dy / (dist || 1)) * pullStrength;
      } else if (!caught && dist < 28 && dist > 0.5) {
        const strength = ((28 - dist) / 28) * 0.12;
        velRef.current.x += -(dx / dist) * strength;
        velRef.current.y += -(dy / dist) * strength * 0.6;
      } else {
        velRef.current.x += (50 - cardX) * 0.0008;
        velRef.current.y += (42 - cardY) * 0.0008;
      }

      velRef.current.x *= 0.94;
      velRef.current.y *= 0.94;

      let newX = cardX + velRef.current.x + floatX * 0.006;
      let newY = cardY + velRef.current.y + floatY * 0.006;
      newX = Math.max(18, Math.min(82, newX));
      newY = Math.max(18, Math.min(75, newY));

      setCardX(newX);
      setCardY(newY);

      // ── Superhero tilt ────────────────────────────────────────────
      const targetRx = -Math.max(-8, Math.min(8, velRef.current.y * 0.5));
      const targetRy = Math.max(-12, Math.min(12, velRef.current.x * 0.5));
      setTilt(prev => ({
        rx: prev.rx + (targetRx - prev.rx) * 0.08,
        ry: prev.ry + (targetRy - prev.ry) * 0.08,
      }));

      // ── Drift fumes down ──────────────────────────────────────────
      setFumes(prev =>
        prev.map(f => ({ ...f, y: f.y + 0.5, size: f.size * 0.99, opacity: f.opacity * 0.98 })).filter(f => f.opacity > 0.01)
      );

      // ── Ticker ─────────────────────────────────────────────────────
      if (connecting) {
        setTickerValue(prev =>
          prev < tickerTarget ? Math.min(prev + Math.floor((tickerTarget - prev) / 40) + 1, tickerTarget) : prev
        );
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [cardX, cardY, caught, connecting]);

  // ───── Handle connect ────────────────────────────────────────────────
  const handleConnect = useCallback(() => {
    setCelebrating(true);
    spawnCelebration();
    setTimeout(() => {
      setCelebrating(false);
      setConnecting(true);
      setTimeout(() => {
        setConnecting(false);
        setTickerValue(tickerTarget);
        // Reset card back to center
        setCaught(false);
        attractedRef.current = false;
        hoverStreakRef.current = 0;
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
      {/* ═══ Rocket cursor ═══ */}
      {mouseOnScreen && (
        <div className="absolute pointer-events-none z-[70]" style={{
          left: cursorPos.x,
          top: cursorPos.y,
          transform: `translate(-50%, -50%) rotate(${rocketTilt}deg)`,
          filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))',
        }}>
          <svg viewBox="0 0 40 50" width="30" height="38" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* White outline glow */}
            <ellipse cx="20" cy="30" rx="7.5" ry="15.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
            <path d="M13 22 Q20 1 27 22" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
            {/* Rocket body */}
            <ellipse cx="20" cy="30" rx="6" ry="14" fill="#7c3aed" stroke="white" strokeWidth="1.2" />
            {/* Nose cone */}
            <path d="M14 22 Q20 2 26 22" fill="#a855f7" stroke="white" strokeWidth="1" />
            {/* Window */}
            <circle cx="20" cy="24" r="3.5" fill="#1e1b4b" stroke="#c084fc" strokeWidth="0.8" />
            <circle cx="19.5" cy="23.5" r="1.2" fill="#22d3ee" opacity="0.6" />
            {/* Fins */}
            <path d="M14 36 L8 46 L14 42 Z" fill="#6d28d9" stroke="white" strokeWidth="1" />
            <path d="M26 36 L32 46 L26 42 Z" fill="#6d28d9" stroke="white" strokeWidth="1" />
            {/* Engine glow */}
            <ellipse cx="20" cy="44" rx="4" ry="2" fill="#c084fc" opacity="0.6" />
            <ellipse cx="20" cy="44" rx="2.5" ry="1" fill="#e9d5ff" opacity="0.8" />
          </svg>
        </div>
      )}

      {/* ═══ Rocket exhaust fumes ═══ */}
      {fumes.map(f => (
        <div key={f.id} className="absolute pointer-events-none z-60 rounded-full" style={{
          left: f.x, top: f.y,
          width: f.size + 'px', height: f.size + 'px',
          backgroundColor: 'white', opacity: f.opacity,
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 ${f.size * 0.5}px rgba(255,255,255,${f.opacity * 0.3})`,
        }} />
      ))}

      {/* ═══ Space objects ═══ */}
      {spaceObjects.map((obj, i) => {
        const time = floatTime.current;
        const driftX = obj.type === 'comet' ? time * obj.speed * 30 : Math.sin(time * obj.speed + i) * 5;
        const driftY = Math.cos(time * obj.speed * 0.7 + i) * 3;
        const x = obj.x + driftX;
        const y = obj.y + driftY;
        const opacity = 0.15 + (obj.type === 'comet' ? Math.sin(time * obj.speed * 2 + i) * 0.1 + 0.15 : 0.08);

        return (
          <div key={i} className="absolute pointer-events-none" style={{
            left: `${x}%`, top: `${y}%`,
            opacity,
            transform: 'translate(-50%, -50%)',
          }}>
            {obj.type === 'planet' && (
              <svg width={obj.size * 6} height={obj.size * 6} viewBox="0 0 20 20">
                <circle cx="10" cy="10" r={obj.size * 1.5} fill={obj.color} opacity="0.6" />
                {obj.ringSize && (
                  <ellipse cx="10" cy="10" rx={obj.ringSize * 2} ry={obj.ringSize * 0.6}
                    fill="none" stroke={obj.color} strokeWidth="0.5" opacity="0.4"
                    transform={`rotate(${obj.angle}, 10, 10)`} />
                )}
              </svg>
            )}
            {obj.type === 'asteroid' && (
              <div style={{
                width: obj.size * 3, height: obj.size * 3,
                backgroundColor: obj.color,
                borderRadius: '40% 60% 55% 45% / 50% 45% 55% 50%',
                transform: `rotate(${obj.angle + time * 20}deg)`,
                opacity: 0.5,
              }} />
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

      {/* ═══ Star field ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white" style={{
            width: (Math.random() * 2 + 0.5) + 'px',
            height: (Math.random() * 2 + 0.5) + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            opacity: Math.random() * 0.4 + 0.15,
            animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
            animationDelay: Math.random() * 2 + 's',
          }} />
        ))}
      </div>

      {/* Celebration particles */}
      {celebrating && particles.map(p => (
        <div key={p.id} className="absolute pointer-events-none z-50 rounded-full" style={{
          left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)`,
          width: p.size + 'px', height: p.size + 'px',
          backgroundColor: p.color, opacity: Math.max(0, p.life),
          boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          transition: 'all 0.03s linear',
        }} />
      ))}

      {/* ═══ THE CARD ═══ */}
      <div
        ref={cardRef}
        className="absolute z-10"
        style={{
          left: `calc(${cardX}% - 150px)`,
          top: `calc(${cardY}% - 110px)`,
          transform: `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: 'transform 0.05s ease-out',
        }}
      >
        {/* Medal loop */}
        <div className="absolute left-1/2 -top-5 z-20 pointer-events-none flex flex-col items-center" style={{ marginLeft: '-7px' }}>
          <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center" style={{
            borderColor: '#a855f7',
            boxShadow: '0 0 10px rgba(168,85,247,0.5), inset 0 0 6px rgba(168,85,247,0.3)',
            background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(124,58,237,0.1))',
          }}>
            <div className="w-1 h-1 rounded-full bg-violet-400/50" />
          </div>
        </div>

        {/* Card body */}
        <div className={`relative w-[280px] sm:w-[320px] rounded-2xl overflow-hidden
          bg-gradient-to-br from-gray-900 via-indigo-950/90 to-gray-900
          border shadow-2xl backdrop-blur-xl ${caught ? 'border-violet-400/50 shadow-violet-500/30' : 'border-violet-500/30 shadow-violet-500/15'}`}
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-violet-400/5 to-transparent animate-shimmer"
              style={{ transform: 'skewX(-20deg) translateX(-100%)' }} />
          </div>
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-violet-500/20 pointer-events-none" />
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none" />

          {/* Brand */}
          <div className="relative px-5 pt-5 pb-3 border-b border-violet-500/15">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center shadow-lg shadow-violet-500/20 ring-1 ring-violet-400/30">
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
              <div className={`px-2 py-1 rounded-md border ${caught ? 'bg-violet-500/20 border-violet-400/40' : 'bg-violet-500/10 border-violet-500/25'}`}>
                <span className="text-[9px] font-bold text-violet-400 tracking-wider">0G</span>
              </div>
            </div>
          </div>

          {/* Info */}
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
                  <p className={`text-sm font-bold truncate ${caught ? 'text-violet-300' : 'text-white'}`}>{caught ? 'Ready to Connect' : 'Unregistered'}</p>
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
                    <span className="text-lg font-black text-violet-400 font-mono tabular-nums">{tickerValue.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-500">AI Agents</span>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[9px] text-gray-600 font-medium uppercase tracking-widest mb-0.5">VERIDD Score</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-gray-600">—</span>
                    <span className="text-[10px] text-gray-700">{caught ? 'tap to connect' : 'awaiting activation'}</span>
                  </div>
                </div>
              )}

              {!connecting ? (
                <button onClick={handleConnect}
                  className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                    btnBlink
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 scale-105 animate-pulse shadow-[0_0_30px_#a855f7]'
                      : 'bg-violet-600 hover:bg-violet-500'
                  } shadow-lg shadow-violet-500/25`}
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
              ].map(b => (
                <span key={b.label} className={`text-[8px] px-2 py-0.5 rounded-full border font-medium ${b.color}`}>{b.label}</span>
              ))}
            </div>
          </div>
          <div className={`h-1 bg-gradient-to-r ${caught ? 'from-violet-400 via-purple-400 to-violet-400' : 'from-violet-600/50 via-purple-500/50 to-violet-600/50'}`} />
        </div>
      </div>

      {/* ═══ Value prop tagline ═══ */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <p className="text-sm text-gray-400 animate-fade-in max-w-[340px] leading-relaxed" style={{ animationDelay: '0.5s' }}>
          Onchain reputation your AI agents <span className="text-violet-400 font-medium">earn and own</span> — verified, immutable, always theirs.
        </p>
      </div>
    </div>
  );
};
