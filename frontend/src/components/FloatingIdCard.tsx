import React, { useEffect, useRef, useState, useCallback } from 'react';

interface Props {
  onConnect: () => void;
}

/**
 * Floating VERIDD Identity Card — a prized medal suspended in deep space.
 *
 * No ribbon — just the card flying freely like a superhero. It leans into
 * movement, tilting dynamically as it drifts, dodges, and pulls toward you.
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

  // ───── 3-hover mechanic ────────────────────────────────────────────────
  const [caught, setCaught] = useState(false);
  const [btnBlink, setBtnBlink] = useState(false);
  const hoverStreakRef = useRef(0);
  const lastHoverTime = useRef(0);
  const attractedRef = useRef(false);

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

    if (!caught) mouseRef.current = { x: mx, y: my };

    const now = Date.now();
    if (!caught && checkProx(mx, my, cardX, cardY)) {
      if (now - lastHoverTime.current > 800) {
        const n = Math.min(hoverStreakRef.current + 1, 3);
        hoverStreakRef.current = n;
        lastHoverTime.current = now;
        if (n >= 3) {
          setCaught(true);
          attractedRef.current = true;
          setBtnBlink(true);
          setTimeout(() => setBtnBlink(false), 800);
        }
      }
    }
  }, [cardX, cardY, caught, connecting, checkProx]);

  const handleMouseLeave = useCallback(() => {
    if (caught) return;
    mouseRef.current = { x: -9999, y: -9999 };
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

      if (caught && attractedRef.current) {
        // Magnetic pull toward cursor — smooth, like gravity
        const pullStrength = Math.min(dist * 0.004, 0.15);
        velRef.current.x += (dx / (dist || 1)) * pullStrength;
        velRef.current.y += (dy / (dist || 1)) * pullStrength;
      } else if (!caught && dist < 28 && dist > 0.5) {
        // Repel
        const strength = ((28 - dist) / 28) * 0.12;
        velRef.current.x += -(dx / dist) * strength;
        velRef.current.y += -(dy / dist) * strength * 0.6;
      } else {
        // Gentle drift toward center
        velRef.current.x += (50 - cardX) * 0.0008;
        velRef.current.y += (42 - cardY) * 0.0008;
      }

      velRef.current.x *= 0.94;
      velRef.current.y *= 0.94;

      let newX = cardX + velRef.current.x + floatX * 0.006;
      let newY = cardY + velRef.current.y + floatY * 0.006;
      // Stay fully visible
      newX = Math.max(18, Math.min(82, newX));
      newY = Math.max(18, Math.min(75, newY));

      setCardX(newX);
      setCardY(newY);

      // ── Superhero tilt ────────────────────────────────────────────
      // Lean into velocity like a flying superhero
      const targetRx = -Math.max(-8, Math.min(8, velRef.current.y * 0.5));
      const targetRy = Math.max(-12, Math.min(12, velRef.current.x * 0.5));

      setTilt(prev => ({
        rx: prev.rx + (targetRx - prev.rx) * 0.08,
        ry: prev.ry + (targetRy - prev.ry) * 0.08,
      }));

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
        onConnect();
      }, 2500);
    }, 1200);
  }, [onConnect, spawnCelebration]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-screen overflow-hidden select-none cursor-default"
    >
      {/* ═══ Star field ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white" style={{
            width: (Math.random() * 2 + 1) + 'px',
            height: (Math.random() * 2 + 1) + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            opacity: Math.random() * 0.5 + 0.2,
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
          transform: caught
            ? `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
            : `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: 'transform 0.05s ease-out',
        }}
      >
        {/* Medal loop (small, subtle) */}
        <div className="absolute left-1/2 -top-5 z-20 pointer-events-none flex flex-col items-center" style={{ marginLeft: '-7px' }}>
          <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center" style={{
            borderColor: '#a855f7',
            boxShadow: '0 0 10px rgba(168,85,247,0.5), inset 0 0 6px rgba(168,85,247,0.3)',
            background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(124,58,237,0.1))',
          }}>
            <div className="w-1 h-1 rounded-full bg-violet-400/50" />
          </div>
          <div className="w-0.5 h-2 bg-gradient-to-b from-violet-500/60 to-violet-400/20" />
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
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 scale-105 shadow-[0_0_30px_#a855f7]'
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
