/**
 * MissionTerminal — Intergalactic scrolling command-line typing animation.
 * Types out VERIDD mission statements one character at a time,
 * cycles through a playlist of space-command messages.
 *
 * How it works:
 * - Messages are stored as an array of mission strings.
 * - A char index advances each frame, appending one character to the display.
 * - When a message is fully typed, it holds (cursor blinks), then fades and
 *   starts the next message — creating a continuous mission-briefing loop.
 * - Green/cyan terminal aesthetic with scanline overlay + blinking cursor.
 * - Uses requestAnimationFrame for smooth, controllable timing.
 */
import React, { useEffect, useRef, useState } from 'react';

const MESSAGES = [
  '> VERIDD MISSION CONTROL v2.4.1 // BOOT SEQUENCE INITIALIZED...',
  '> //                                                    ',
  '> // Veridd leverages 0G\'s high-throughput storage and   ',
  '> // decentralized compute to issue immutable, on-chain  ',
  '> // reputations for autonomous AI agents.               ',
  '> //                                                    ',
  '> // Stop trusting black boxes.                          ',
  '> // Start verifying agent actions on-chain.             ',
  '> //                                                    ',
  '> // → 100% ON 0G: STORAGE • CHAIN • COMPUTE ←          ',
  '> //                                                    ',
  '> SCANNING AGENT NETWORK // 12,847 ENTITIES DETECTED',
  '> TRUST PROTOCOL ENGAGED // REPUTATION LEDGER SYNCED',
  '> AUTONOMOUS AGENT LOOP // VERIFICATION CYCLE: RUNNING',
  '> REAL-TIME REPUTATION // IMMUTABLE • VERIFIABLE • ONCHAIN',
  '> STANDING BY // AWAITING AGENT ACTIVITY...',
];

const TYPING_SPEED = 28; // ms per character
const HOLD_DURATION = 2500; // ms to hold after message finishes
const FADE_DURATION = 400; // ms for crossfade

export const MissionTerminal: React.FC = () => {
  const [displayText, setDisplayText] = useState('');
  const [visible, setVisible] = useState(true);
  const [showCursor, setShowCursor] = useState(true);
  const msgIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const phaseRef = useRef<'typing' | 'hold' | 'fade'>('typing');
  const timerRef = useRef<number>(0);
  const lastCharTimeRef = useRef(0);

  // Blinking cursor
  useEffect(() => {
    const iv = setInterval(() => {
      setShowCursor((p) => !p);
    }, 530);
    return () => clearInterval(iv);
  }, []);

  // Main typing loop
  useEffect(() => {
    let running = true;

    const tick = (now: number) => {
      if (!running) return;

      if (phaseRef.current === 'typing') {
        if (now - lastCharTimeRef.current >= TYPING_SPEED) {
          lastCharTimeRef.current = now;
          const msg = MESSAGES[msgIndexRef.current];
          if (charIndexRef.current < msg.length) {
            charIndexRef.current++;
            setDisplayText(msg.slice(0, charIndexRef.current));
          } else {
            // Finished typing → hold
            phaseRef.current = 'hold';
            timerRef.current = now;
          }
        }
      } else if (phaseRef.current === 'hold') {
        if (now - timerRef.current >= HOLD_DURATION) {
          phaseRef.current = 'fade';
          setVisible(true);
          // Briefly flash then advance
          setTimeout(() => {
            if (!running) return;
            msgIndexRef.current = (msgIndexRef.current + 1) % MESSAGES.length;
            charIndexRef.current = 0;
            setDisplayText('');
            phaseRef.current = 'typing';
          }, FADE_DURATION);
        }
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    return () => {
      running = false;
    };
  }, []);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-[600px] px-4 pointer-events-none">
      {/* Terminal window frame */}
      <div
        className="relative bg-black/50 backdrop-blur-sm rounded-lg border border-emerald-500/15 overflow-hidden"
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
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-emerald-500/10">
          <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
          <span className="text-[8px] text-emerald-500/40 font-mono ml-1 tracking-widest uppercase">
            veridd://mission-control
          </span>
        </div>

        {/* Terminal content */}
        <div className="px-3 py-2.5 font-mono" style={{ minHeight: '2.4em' }}>
          <span
            className="text-xs leading-relaxed transition-opacity duration-300"
            style={{
              color: '#34d399',
              textShadow: '0 0 6px rgba(52, 211, 153, 0.3)',
              opacity: visible ? 1 : 0,
            }}
          >
            {displayText}
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

        {/* Bottom glow line */}
        <div
          className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"
          style={{
            animation: 'terminalGlow 3s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
};
