import React, { useState, useRef, useCallback, useEffect } from 'react';
import { VeriddChain } from '../lib/chain';
import { VeriddCompute } from '../lib/compute';
import { VeriddStorage } from '../lib/storage';

interface Props {
  chain: VeriddChain;
  agents: Array<{ agentId: number; name: string }>;
  onScoreUpdate: () => void;
}

interface LogEntry {
  id: number;
  iconName: string;
  text: string;
  time: string;
  color?: string;
}

const DEMO_ACTIONS = [
  {
    type: 'market_analysis',
    input: 'Analyze ETH price movement last 24h. Identify key support and resistance.',
    output:
      'ETH at $3,450, down 2.3%. Support at $3,350 (200-day MA). Resistance at $3,550. Volume declining, consolidation expected. On-chain shows whale accumulation.',
  },
  {
    type: 'trade_execution',
    input: 'Execute limit buy 10 ETH at $3,350. Stop-loss at $3,200.',
    output:
      'Order submitted: BUY 10 ETH @ $3,350 LIMIT. Stop @ $3,200 (-4.5%). R:R 1:2.3. Tx: 0x7421...f9e3.',
  },
  {
    type: 'security_audit',
    input: 'Review this contract for reentrancy vulnerabilities...',
    output:
      'ERROR: Reentrancy in withdraw(). State updates after external call. Fix: checks-effects-interactions pattern.',
  },
  {
    type: 'data_analysis',
    input: 'Analyze DEFI sector on-chain metrics this quarter.',
    output:
      'Top 10 TVL: $45.2B (+12% QoQ). Lido $24B, EigenLayer $8.5B, Aave $6.8B. Staking 53% of TVL. Restaking narratives driving growth.',
  },
];

// ───── Lucide Icon Map ─────────────────────────────────────────────

const icons: Record<string, string> = {
  robot: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="12" x="3" y="8" rx="2"/><path d="M3 12v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><path d="M14 2v4"/><path d="M10 2v4"/><path d="M8 16v2"/><path d="M16 16v2"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/></svg>',
  'hard-drive': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/></svg>',
  link: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  eye: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  brain: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M11.5 6.5 9 11"/><path d="M12.5 6.5 15 11"/></svg>',
  'bar-chart': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>',
  'pen-line': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>',
  'check-circle': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
  'x-circle': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
  rocket: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09"/><path d="M12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
  plug: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg>',
  sparkles: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>',
  'alert-triangle': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
};

/** Render a Lucide icon by name */
const LogIcon: React.FC<{ name: string }> = ({ name }) => {
  const svg = icons[name];
  if (!svg) return <span className="w-4 h-4 inline-block" />;
  return (
    <span
      className="w-4 h-4 inline-flex items-center justify-center flex-shrink-0"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export const AutonomousDemo: React.FC<Props> = ({ chain, agents, onScoreUpdate }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logIdRef = useRef(0);
  const actionIndexRef = useRef(0);
  const runningRef = useRef(false);

  const addLog = useCallback((iconName: string, text: string, color?: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { id: logIdRef.current++, iconName, text, time, color }]);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // ───── Autonomous Loop ─────
  const runCycle = useCallback(async () => {
    if (!runningRef.current || agents.length < 2) return;

    // Agent A = first agent (submitter), Agent B = second agent (reviewer)
    const agentA = agents[0];
    const agentB = agents[1];
    const action = DEMO_ACTIONS[actionIndexRef.current % DEMO_ACTIONS.length];
    actionIndexRef.current++;

    try {
      addLog('rocket', `${agentA.name} executes: ${action.type.replace('_', ' ')}`, 'text-violet-300');

      await delay(2000);

      // ── Agent A stores action proof on 0G Storage ──
      addLog('hard-drive', `${agentA.name} storing action proof to 0G Storage...`, 'text-emerald-400');

      await delay(1000);

      const storage = new VeriddStorage();
      const actionResult = await storage.storeAction({
        agentId: String(agentA.agentId),
        actionType: action.type,
        input: action.input,
        output: action.output,
        timestamp: Date.now(),
      });
      addLog('hard-drive', `0G Storage: action proof stored → ${actionResult.root.slice(0, 10)}...`, 'text-emerald-400');

      const actionId = await chain.submitAction(action.type, actionResult.root);
      addLog('link', `0G Chain: Action #${actionId} recorded for ${agentA.name}`, 'text-cyan-400');

      await delay(2000);

      // ── Agent B detects and reviews ──
      addLog('eye', `${agentB.name} detected new action from ${agentA.name}`, 'text-amber-400');
      addLog('brain', `${agentB.name} querying 0G Compute for peer review...`, 'text-cyan-400');
      
      await delay(1500);

      const compute = new VeriddCompute();
      const review = await compute.reviewAction({
        agentName: agentA.name,
        actionType: action.type,
        input: action.input,
        output: action.output,
      });

      const scoreColor = review.score >= 4 ? 'text-emerald-400' : review.score >= 3 ? 'text-amber-400' : 'text-red-400';
      addLog('bar-chart', `VERIDD Score: ${review.score}/5 — ${review.reasoning}`, scoreColor);

      await delay(1500);

      // ── Agent B submits review on-chain ──
      addLog('pen-line', `${agentB.name} submitting review on 0G Chain...`, 'text-violet-400');

      const reviewResult = await storage.storeReview({
        agentId: String(agentA.agentId),
        reviewerId: chain.address || '',
        score: review.score,
        reasoning: review.reasoning,
        evidenceHashes: [],
        timestamp: Date.now(),
      });

      await chain.submitReview(
        agentA.agentId,
        review.score,
        actionResult.root,
        reviewResult.root,
        review.reasoning.slice(0, 100),
      );

      addLog('check-circle', `${agentA.name} VERIDD updated → ${review.score}/5 (${agentB.name} reviewed)`, 'text-green-400');

      onScoreUpdate();
    } catch (err: any) {
      addLog('x-circle', `Error: ${err.message.slice(0, 100)}`, 'text-red-400');
    }
  }, [chain, agents, onScoreUpdate, addLog]);

  // ───── Start / Stop ─────
  const start = useCallback(() => {
    setRunning(true);
    runningRef.current = true;
    setLogs([]);
    logIdRef.current = 0;
    actionIndexRef.current = 0;
    addLog('rocket', 'Autonomous agent network booting...', 'text-violet-400');
    addLog('robot', `${agents[0].name} (Agent A) — action submitter`, 'text-violet-300');
    addLog('eye', `${agents[1].name} (Agent B) — peer reviewer`, 'text-amber-400');
    addLog('', '─'.repeat(40), 'text-gray-700');
    // Run first cycle after a delay
    setTimeout(() => runCycle(), 2000);
  }, [agents, addLog, runCycle]);

  const stop = useCallback(() => {
    setRunning(false);
    runningRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { runningRef.current = false; };
  }, []);

  return (
    <div className="glass-card rounded-xl overflow-hidden border border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-900/60 border-b border-gray-800">
        <div className="flex items-center gap-2.5 text-sm">
          <LogIcon name="robot" />
          <span className="text-white font-semibold tracking-tight">Autonomous Demo</span>
          <span className="text-[11px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/20 font-medium">
            auto
          </span>
        </div>
        <div className="flex items-center gap-2">
          {running && (
            <span className="text-[11px] text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Running
            </span>
          )}
          <button
            onClick={running ? stop : start}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              running
                ? 'bg-red-700/40 hover:bg-red-700/60 text-red-400 border border-red-700/40'
                : 'bg-emerald-700/40 hover:bg-emerald-700/60 text-emerald-400 border border-emerald-700/40'
            }`}
          >
            {running ? 'Stop' : 'Start Demo'}
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div className="px-5 py-4 max-h-[400px] overflow-y-auto font-mono text-[12px] leading-relaxed bg-gray-950/50">
        {logs.length === 0 ? (
          <div className="text-gray-600 text-center py-8 text-xs">
            Press Start Demo to run the autonomous agent network
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 py-0.5 group">
              <span className="flex-shrink-0 w-4 flex items-center justify-center mt-0.5">
                <LogIcon name={log.iconName} />
              </span>
              <span className="text-gray-500 w-16 flex-shrink-0 text-[11px]">{log.time}</span>
              <span className={`${log.color || 'text-gray-400'} leading-relaxed`}>{log.text}</span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
