import React, { useEffect, useRef, useState, useCallback } from 'react';

interface Props {
  onConnect: () => void;
}

/**
 * Floating VERIDD Identity Card — suspended like a prized medal in space.
 *
 * The card hangs from a glowing ribbon that moves like a superhero's cloak.
 * Reach for it 3 times — it dodges at first, then surrenders on the third.
 * Click "Connect Wallet" and the catch celebrates before prompting MetaMask.
 */
export const FloatingIdCard: React.FC<Props> = ({ onConnect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // ───── Position & animation state ──────────────────────────────────────
  const [cardPos, setCardPos] = useState({ x: 50, y: 50 });
  const [targetPos, setTargetPos] = useState({ x: 50, y: 42 });
  const [rotation, setRotation] = useState(0);

  // ───── Mouse tracking ──────────────────────────────────────────────────
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const floatTime = useRef(0);

  // ───── 3-hover mechanic ────────────────────────────────────────────────
  const [hoverCount, setHoverCount] = useState(0);
  const [caught, setCaught] = useState(false);
  const [buttonGlow, setButtonGlow] = useState(false);
  const hoverStreakRef = useRef(0);    // tracks consecutive "reaches"
  const lastHoverTime = useRef(0);
  const isRepelling = useRef(true);

  // ───── Celebration & connection ────────────────────────────────────────
  const [celebrating, setCelebrating] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // ───── Cloak rope physics (spring-based lag) ───────────────────────────
  const ropeMid = useRef({ x: 50, y: 15 });
  const ropeVel = useRef({ x: 0, y: 0 });
  const ropeTarget = useRef({ x: 50, y: 15 });

  // ───── Ticker number ───────────────────────────────────────────────────
  const [tickerValue, setTickerValue] = useState(0);
  const tickerTarget = 12847;

  // ───── Particles for celebration ───────────────────────────────────────
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; size: number; life: number }>>([]);

  // ───── Track "hover proximity" — did the cursor get close? ────────────
  const checkHoverProximity = useCallback((mx: number, my: number, cx: number, cy: number) => {
    const dx = mx - cx;
    const dy = my - cy;
    return Math.sqrt(dx * dx + dy * dy) < 28;
  }, []);

  // ───── Spawn celebration particles ────────────────────────────────────
  const spawnCelebration = useCallback(() => {
    const colors = ['#a855f7', '#7c3aed', '#c084fc', '#22d3ee', '#34d399', '#fbbf24'];
    const newParticles: Array<{ id: number; x: number; y: number; color: string; size: number; life: number }> = [];
    for (let i = 0; i < 60; i++) {
      const angle = (Math.PI * 2 * i) / 60 + (Math.random() - 0.5) * 0.5;
      const dist = 30 + Math.random() * 60;
      newParticles.push({
        id: i,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 5,
        life: 1,
      });
    }
    setParticles(newParticles);
    // Fade particles out
    const interval = setInterval(() => {
      setParticles(prev => {
        const next = prev.map(p => ({ ...p, life: p.life - 0.04 }));
        if (next.every(p => p.life <= 0)) {
          clearInterval(interval);
          return [];
        }
        return next;
      });
    }, 40);
  }, []);

  // ───── Handle mouse move ──────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || caught || connecting) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    mouseRef.current = { x: mx, y: my };

    // Check if cursor is trying to "reach" the card
    const now = Date.now();
    if (checkHoverProximity(mx, my, cardPos.x, cardPos.y)) {
      if (now - lastHoverTime.current > 800) {
        // Count this as a new "reach" attempt
        const newCount = Math.min(hoverStreakRef.current + 1, 3);
        hoverStreakRef.current = newCount;
        setHoverCount(newCount);
        lastHoverTime.current = now;

        if (newCount >= 3 && !caught) {
          // 3rd hover — card surrenders!
          setCaught(true);
          setButtonGlow(true);
          isRepelling.current = false;
        }
      }
    }
  }, [cardPos.x, cardPos.y, caught, connecting, checkHoverProximity]);

  // ───── Handle mouse leave ─────────────────────────────────────────────
  const handleMouseLeave = useCallback(() => {
    if (caught) return; // don't reset if caught
    mouseRef.current = { x: -9999, y: -9999 };
  }, [caught]);

  // ───── Main animation loop ────────────────────────────────────────────
  useEffect(() => {
    let running = true;

    const animate = () => {
      if (!running) return;
      floatTime.current += 0.015;

      // ── Card movement ──────────────────────────────────────────────
      // Gentle floating motion (figure-8-ish)
      const floatX = Math.sin(floatTime.current * 0.6) * 2;
      const floatY = Math.sin(floatTime.current * 0.8) * 2.5;

      // Calculate repel from mouse
      const dx = mouseRef.current.x - targetPos.x;
      const dy = mouseRef.current.y - targetPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let repelX = 0;
      let repelY = 0;

      if (caught) {
        // Once caught, card gently drifts to center and stays
        const toCenterX = 50 - targetPos.x;
        const toCenterY = 42 - targetPos.y;
        setTargetPos(prev => ({
          x: prev.x + toCenterX * 0.03,
          y: prev.y + toCenterY * 0.03,
        }));
      } else if (isRepelling.current && dist < 28 && dist > 0) {
        // Repel: stronger the closer you get
        const strength = ((28 - dist) / 28) * 22;
        repelX = -(dx / dist) * strength;
        repelY = -(dy / dist) * strength * 0.6;

        const baseX = 50 + repelX;
        const baseY = 42 + repelY;
        setTargetPos(prev => ({
          x: prev.x + (baseX - prev.x) * 0.06,
          y: prev.y + (baseY - prev.y) * 0.06,
        }));
      } else {
        // Default: gently float near center
        setTargetPos(prev => ({
          x: prev.x + (50 - prev.x) * 0.008,
          y: prev.y + (42 - prev.y) * 0.008,
        }));
      }

      setCardPos({
        x: targetPos.x + floatX,
        y: targetPos.y + floatY,
      });

      // ── Rotation (clamped) ────────────────────────────────────────
      const mouseX = mouseRef.current.x;
      if (mouseX > -100 && mouseX < 150 && !caught) {
        const rawRot = (mouseX - 50) * 0.04;
        setRotation(Math.max(-4, Math.min(4, rawRot)));
      } else {
        setRotation(prev => prev * 0.92);
      }

      // ── Cloak rope physics ────────────────────────────────────────
      // The rope midpoint is pulled toward its target (midpoint between
      // anchor and card), with momentum that creates fabric-like lag.
      const cardEndX = cardPos.x;
      const cardEndY = cardPos.y - 20;

      // Target midpoint: somewhere between anchor and card, with some offset
      ropeTarget.current = {
        x: (42 + cardEndX) / 2 + Math.sin(floatTime.current * 0.3) * 2,
        y: (0 + cardEndY) / 2 + 5,
      };

      // Spring physics: pull toward target, damp velocity
      const pullX = (ropeTarget.current.x - ropeMid.current.x) * 0.015;
      const pullY = (ropeTarget.current.y - ropeMid.current.y) * 0.015;

      // Add whip effect from card movement
      const cardVelocity = { x: 0, y: 0 }; // simplified

      ropeVel.current.x = (ropeVel.current.x + pullX) * 0.92;
      ropeVel.current.y = (ropeVel.current.y + pullY) * 0.92;

      ropeMid.current.x += ropeVel.current.x;
      ropeMid.current.y += ropeVel.current.y;

      // Clamp rope midpoint to reasonable bounds
      ropeMid.current.x = Math.max(20, Math.min(80, ropeMid.current.x));
      ropeMid.current.y = Math.max(3, Math.min(50, ropeMid.current.y));

      // ── Ticker animation ──────────────────────────────────────────
      if (connecting) {
        setTickerValue(prev => {
          if (prev < tickerTarget) {
            const increment = Math.floor((tickerTarget - prev) / 40) + 1;
            return Math.min(prev + increment, tickerTarget);
          }
          return prev;
        });
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [targetPos.x, targetPos.y, cardPos.x, cardPos.y, caught, connecting]);

  // ───── Handle connect click ─────────────────────────────────────────
  const handleConnect = useCallback(() => {
    // Celebration first!
    setCelebrating(true);
    spawnCelebration();

    // After celebration, show ticker and then trigger connect
    setTimeout(() => {
      setCelebrating(false);
      setConnecting(true);

      // Simulate the ticker for a bit, then call parent onConnect
      setTimeout(() => {
        setConnecting(false);
        setTickerValue(tickerTarget);
        onConnect();
      }, 2500);
    }, 1200);
  }, [onConnect, spawnCelebration]);

  // ───── Rope anchor ──────────────────────────────────────────────────
  const anchorX = 42;
  const anchorY = -5;
  const ropeEndX = cardPos.x;
  const ropeEndY = cardPos.y - 20;
  const midX = ropeMid.current.x + Math.sin(floatTime.current * 0.5) * 1.5;
  const midY = ropeMid.current.y + Math.cos(floatTime.current * 0.6) * 2;
  const ropePath = `M ${anchorX} ${anchorY} Q ${midX} ${midY} ${ropeEndX} ${ropeEndY}`;

  // ───── Button pulse animation class ─────────────────────────────────
  const btnPulseClass = buttonGlow
    ? 'shadow-[0_0_20px_#a855f7] animate-pulse'
    : '';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[500px] sm:h-[580px] overflow-hidden select-none cursor-default"
    >
      {/* ═══ Background star field ═══ */}
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

      {/* ═══ CELEBRATION PARTICLES ═══ */}
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
            transform: `translate(-50%, -50%) scale(${1 - p.life * 0.3})`,
            transition: 'all 0.04s linear',
            boxShadow: `0 0 6px ${p.color}`,
          }}
        />
      ))}

      {/* ═══ ROPE / RIBBON SVG ═══ */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.3))' }}
      >
        {/* Main ribbon (cloak) — thicker, glowing */}
        <path
          d={ropePath}
          fill="none"
          stroke="url(#ribbonGrad)"
          strokeWidth="0.5"
          strokeLinecap="round"
          opacity="0.7"
        />
        {/* Core glow */}
        <path
          d={ropePath}
          fill="none"
          stroke="#a855f7"
          strokeWidth="0.15"
          strokeLinecap="round"
          opacity="0.5"
          strokeDasharray="0.2 0.4"
        />
        {/* Subtle fabric texture */}
        <path
          d={ropePath}
          fill="none"
          stroke="#c084fc"
          strokeWidth="0.08"
          strokeLinecap="round"
          opacity="0.3"
          strokeDasharray="0.1 0.6 0.3 0.4"
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {/* Anchor ring at top */}
        <circle cx={anchorX} cy={anchorY} r="1.5" fill="none" stroke="#7c3aed" strokeWidth="0.3" opacity="0.8" />
        <circle cx={anchorX} cy={anchorY} r="0.8" fill="#a855f7" opacity="0.4" />
      </svg>

      {/* ═══ PROGRESS INDICATOR (hover count) ═══ */}
      {!caught && hoverCount > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 pointer-events-none">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                i <= hoverCount
                  ? 'bg-violet-400 shadow-[0_0_6px_#a855f7] scale-110'
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      )}

      {/* ═══ THE ID CARD (medal) ═══ */}
      <div
        ref={cardRef}
        className="absolute z-10"
        style={{
          left: `calc(${cardPos.x}% - 140px)`,
          top: `calc(${cardPos.y}% - 110px)`,
          transform: `rotate(${rotation}deg)`,
          transition: caught ? 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
        }}
      >
        {/* ═══ MEDAL LOOP (enlarged ring) ═══ */}
        <div
          className="absolute left-1/2 -top-5 z-20 pointer-events-none flex flex-col items-center"
          style={{ marginLeft: '-6px' }}
        >
          {/* Outer ring */}
          <div
            className="w-3 h-3 rounded-full border-2"
            style={{
              borderColor: '#a855f7',
              boxShadow: '0 0 8px rgba(168, 85, 247, 0.5), inset 0 0 4px rgba(168, 85, 247, 0.3)',
              background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(124,58,237,0.1))',
            }}
          />
          {/* Small connector */}
          <div className="w-0.5 h-2 bg-gradient-to-b from-violet-500/60 to-violet-400/30" />
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
          {/* Holographic shimmer overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-br from-transparent via-violet-400/5 to-transparent
                animate-shimmer"
              style={{ transform: 'skewX(-20deg) translateX(-100%)' }}
            />
          </div>

          {/* Card border glow */}
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-violet-500/20 pointer-events-none" />
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none" />

          {/* Top section — Brand & Logo */}
          <div className="relative px-5 pt-5 pb-3 border-b border-violet-500/15">
            <div className="flex items-center justify-between">
              {/* Logo + Name */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-purple-800
                  flex items-center justify-center shadow-lg shadow-violet-500/20 ring-1 ring-violet-400/30">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-white font-black text-lg tracking-tight leading-none">VERIDD</h2>
                  <p className="text-[10px] text-violet-400/70 font-medium tracking-widest uppercase">True Identity for AI Agents</p>
                </div>
              </div>

              {/* 0G Badge */}
              <div className={`px-2 py-1 rounded-md border ${
                caught
                  ? 'bg-violet-500/20 border-violet-400/40'
                  : 'bg-violet-500/10 border-violet-500/25'
              }`}>
                <span className="text-[9px] font-bold text-violet-400 tracking-wider">0G</span>
              </div>
            </div>
          </div>

          {/* Middle section — Agent Photo + Info */}
          <div className="relative px-5 py-4">
            <div className="flex gap-4">
              {/* Photo placeholder */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-violet-600/30 to-indigo-800/30
                  border border-violet-400/25 flex items-center justify-center
                  shadow-inner shadow-violet-900/30 overflow-hidden relative">
                  {/* Circuit-like decorative lines */}
                  <svg viewBox="0 0 80 80" className="absolute inset-0 w-full h-full opacity-30">
                    <line x1="20" y1="10" x2="20" y2="40" stroke="#a855f7" strokeWidth="0.5" />
                    <line x1="10" y1="40" x2="40" y2="40" stroke="#a855f7" strokeWidth="0.5" />
                    <line x1="40" y1="40" x2="40" y2="60" stroke="#a855f7" strokeWidth="0.5" />
                    <line x1="60" y1="20" x2="60" y2="50" stroke="#a855f7" strokeWidth="0.5" />
                    <line x1="50" y1="50" x2="70" y2="50" stroke="#a855f7" strokeWidth="0.5" />
                    <circle cx="40" cy="40" r="3" fill="none" stroke="#c084fc" strokeWidth="0.5" />
                    <circle cx="60" cy="50" r="2" fill="none" stroke="#c084fc" strokeWidth="0.5" />
                  </svg>
                  {/* Shield icon */}
                  <svg viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5" className="w-7 h-7 relative z-10">
                    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                </div>
              </div>

              {/* Info fields */}
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

          {/* Bottom section — Score + Connect */}
          <div className="relative px-5 py-3 bg-black/30 border-t border-violet-500/15">
            <div className="flex items-center justify-between">
              {/* Score / Ticker */}
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

              {/* Connect Wallet button */}
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

            {/* Tech stack badges */}
            <div className="flex gap-1.5 mt-2.5 flex-wrap">
              {[
                { label: '0G Chain', color: 'bg-violet-500/15 text-violet-400 border-violet-500/25' },
                { label: '0G Storage', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
                { label: '0G Compute', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25' },
                { label: 'Agentic ID', color: 'bg-violet-400/15 text-violet-300 border-violet-400/25' },
              ].map(badge => (
                <span
                  key={badge.label}
                  className={`text-[8px] px-2 py-0.5 rounded-full border font-medium ${badge.color}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom edge — holographic strip */}
          <div className={`h-1 bg-gradient-to-r ${
            caught
              ? 'from-violet-400 via-purple-400 to-violet-400'
              : 'from-violet-600/50 via-purple-500/50 to-violet-600/50'
          }`} />
        </div>
      </div>

      {/* ═══ BOTTOM TAGLINE ═══ */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <p className="text-xs text-gray-500 animate-fade-in max-w-[260px]" style={{ animationDelay: '0.5s' }}>
          A <span className="text-violet-400 font-medium">credit score</span> for AI agents — verified on 0G
        </p>
      </div>
    </div>
  );
};
