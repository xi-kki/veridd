/**
 * MissionTerminal — Scrolling log with typing effect.
 * Each message types out character by character on a new line.
 * Pauses between messages. Text accumulates and fills the terminal.
 * Green/cyan terminal aesthetic with blinking cursor.
 */
import React, { useEffect, useRef, useState } from 'react';

const MESSAGES = [
  '> VERIDD MISSION CONTROL v2.4.1 // BOOT SEQUENCE INITIALIZED...',
  '> //',
  '> // Veridd leverages 0G\'s high-throughput storage and',
  '> // decentralized compute to issue immutable, on-chain',
  '> // reputations for autonomous AI agents.',
  '> //',
  '> // Stop trusting black boxes.',
  '> // Start verifying agent actions on-chain.',
  '> //',
  '> // → 100% ON 0G: STORAGE • CHAIN • COMPUTE ←',
  '> //',
  '> // ═══════ STEP 1: AGENT REGISTRATION ═══════',
  '> //',
  '> // Agent\'s core logic + identity hash stored on',
  '> // 0G Storage — immutable, verifiable, decentralized.',
  '> // Each agent gets a unique on-chain ID linked to',
  '> // their storage root.',
  '> //',
  '> // ═══════ STEP 2: ACTION VERIFICATION ═══════',
  '> //',
  '> // Agent outputs verified using 0G Compute.',
  '> // Every action checked against registered logic.',
  '> // No black box. Fully auditable on-chain.',
  '> //',
  '> // ═══════ STEP 3: REPUTATION SCORE ═══════',
  '> //',
  '> // Immutable history anchored to 0G Chain →',
  '> // Veridd Score. Every review, every action,',
  '> // every reputation delta recorded permanently.',
  '> //',
  '> SCANNING NETWORK // 12,847 REGISTERED AGENTS DETECTED',
  '> AUTONOMOUS AGENT LOOP // VERIFICATION CYCLE: RUNNING',
  '> REAL-TIME REPUTATION // IMMUTABLE • VERIFIABLE • ONCHAIN',
  '> //',
  '> // ═══════ GET STARTED ═══════',
  '> //',
  '> // Connect your wallet to register your first AI',
  '> // Agent on the 0G Galileo Testnet.',
  '> //',
  '> STANDING BY // AWAITING AGENT ACTIVITY...',
];

const TYPING_SPEED = 18; // ms per character
const PAUSE_BETWEEN = 600; // ms pause between messages
const LINE_HEIGHT = 18; // approximate px per line

export const MissionTerminal: React.FC = () => {
  const [typedText, setTypedText] = useState('');
  const [currentLine, setCurrentLine] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [maxLines, setMaxLines] = useState(8);
  const containerRef = useRef<HTMLDivElement>(null);

  // Blinking cursor
  useEffect(() => {
    const iv = setInterval(() => setShowCursor((p) => !p), 530);
    return () => clearInterval(iv);
  }, []);

  // ───── Edge case guards ──────────────────────────────────────────────
  const MESSAGES_SAFE = MESSAGES.length > 0 ? MESSAGES : ['> TERMINAL INITIALIZED // AWAITING DATA...'];
  const MAX_LINES_FALLBACK = 8;

  // Measure available height and calculate max lines
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const parent = el.closest('.absolute');
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const availableHeight = parentRect.bottom - parentRect.top - 60;
    if (availableHeight <= 0) {
      setMaxLines(MAX_LINES_FALLBACK);
      return;
    }
    const lines = Math.max(5, Math.min(Math.floor(availableHeight / LINE_HEIGHT), MESSAGES_SAFE.length));
    setMaxLines(lines);
  }, [MESSAGES_SAFE.length]);

  // Stable ref for maxLines to avoid closure staleness
  const maxLinesRef = useRef(maxLines);
  maxLinesRef.current = maxLines;

  // Typing engine — types current line, then appends and moves to next
  useEffect(() => {
    let running = true;
    let pauseTimer = 0;
    let msgIndex = 0;
    let charIndex = 0;
    let accumulated = '';
    let lineBuffer = '';
    let phase: 'typing' | 'pause' = 'typing';

    const tick = (now: number) => {
      if (!running) return;

      if (phase === 'typing') {
        const msg = MESSAGES_SAFE[msgIndex];
        // Guard: skip any undefined/falsy messages
        if (!msg) {
          msgIndex = (msgIndex + 1) % MESSAGES_SAFE.length;
          charIndex = 0;
          requestAnimationFrame(tick);
          return;
        }
        if (charIndex < msg.length) {
          charIndex++;
          lineBuffer = msg.slice(0, charIndex);
          setCurrentLine(lineBuffer);
        } else {
          // Message complete → append and pause
          accumulated += (accumulated ? '\n' : '') + msg;
          lineBuffer = '';

          // Trim oldest lines if exceeding max (use ref for latest value)
          const currentMax = maxLinesRef.current;
          const lines = accumulated.split('\n');
          if (lines.length > currentMax) {
            accumulated = lines.slice(lines.length - currentMax).join('\n');
          }

          setTypedText(accumulated);
          setCurrentLine('');
          msgIndex = (msgIndex + 1) % MESSAGES_SAFE.length;
          charIndex = 0;
          phase = 'pause';
          pauseTimer = now;
        }
      } else if (phase === 'pause') {
        if (now - pauseTimer >= PAUSE_BETWEEN) {
          phase = 'typing';
        }
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    return () => { running = false; };
  }, [MESSAGES_SAFE.length]);

  return (
    <div className="absolute bottom-[120px] left-1/2 -translate-x-1/2 w-full max-w-[740px] px-4 pointer-events-none">
      <div
        ref={containerRef}
        className="relative bg-black/50 backdrop-blur-sm rounded-lg border border-emerald-500/15"
        style={{
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.05), inset 0 0 20px rgba(16, 185, 129, 0.02)',
        }}
      >
        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(16,185,129,0.3) 1px, rgba(16,185,129,0.3) 2px)',
          }}
        />

        {/* Top bar */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-emerald-500/10">
          <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
          <span className="text-[9px] text-emerald-500/40 font-mono ml-1 tracking-widest uppercase">
            veridd://mission-control
          </span>
        </div>

        {/* Terminal content — grows to fill space */}
        <div
          className="px-3 py-2.5 font-mono overflow-hidden"
          style={{ minHeight: `${maxLines * LINE_HEIGHT + 8}px`, maxHeight: `${maxLines * LINE_HEIGHT + 16}px` }}
        >
          <span
            className="text-xs leading-relaxed whitespace-pre-wrap break-all"
            style={{
              color: '#34d399',
              textShadow: '0 0 6px rgba(52, 211, 153, 0.3)',
            }}
          >
            {typedText}
            {(typedText ? '\n' : '') + currentLine}
            {showCursor && (
              <span
                className="ml-0.5 font-bold"
                style={{
                  color: '#34d399',
                  textShadow: '0 0 6px rgba(52, 211, 153, 0.5)',
                }}
              >
                ▎
              </span>
            )}
          </span>
        </div>

        {/* Bottom glow */}
        <div
          className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"
          style={{ animation: 'terminalGlow 3s ease-in-out infinite' }}
        />
      </div>
    </div>
  );
};
