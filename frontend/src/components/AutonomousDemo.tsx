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
  icon: string;
  text: string;
  time: string;
  color?: string;
}

const DEMO_ACTIONS = [
  {
    type: 'market_analysis',
    input: 'Analyze ETH price movement last 24h. Identify key support and resistance.',
    output:
      'ETH at $3,450, down 2.3%. Support at $3,350 (200-day MA). Resistance at $3,550. Volume declining, consolidation expected.',
  },
  {
    type: 'trade_execution',
    input: 'Execute limit buy 10 ETH at $3,350. Stop-loss at $3,200.',
    output:
      'Order submitted: BUY 10 ETH @ $3,350 LIMIT. Stop @ $3,200 (-4.5%). R:R 1:2.3. Tx: 0x7421...f9e3.',
  },
  {
    type: 'data_analysis',
    input: 'Analyze DEFI sector on-chain metrics this quarter.',
    output:
      'Top 10 TVL: $45.2B (+12% QoQ). Lido $24B, EigenLayer $8.5B, Aave $6.8B. Staking 53% of TVL.',
  },
  {
    type: 'risk_assessment',
    input: 'Assess portfolio risk for volatile market conditions.',
    output:
      'Portfolio beta: 1.2. VaR (95%): 4.3%. Correlation with BTC: 0.78. Recommended: increase stablecoin allocation.',
  },
];

export const AutonomousDemo: React.FC<Props> = ({ chain, agents, onScoreUpdate }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [phase, setPhase] = useState<'idle' | 'running'>('idle');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logIdRef = useRef(0);
  const actionIndexRef = useRef(0);
  const runningRef = useRef(false);

  const addLog = useCallback((icon: string, text: string, color?: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { id: logIdRef.current++, icon, text, time, color }]);
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
      // ── Agent A submits action ──
      addLog('🤖', `${agentA.name} executes: ${action.type.replace('_', ' ')}`, 'text-violet-300');
      
      const storage = new VeriddStorage();
      const actionResult = await storage.storeAction({
        agentId: String(agentA.agentId),
        actionType: action.type,
        input: action.input,
        output: action.output,
        timestamp: Date.now(),
      });
      addLog('💾', `0G Storage: action proof stored → ${actionResult.root.slice(0, 10)}...`, 'text-emerald-400');

      const actionId = await chain.submitAction(action.type, actionResult.root);
      addLog('⛓️', `0G Chain: Action #${actionId} recorded for ${agentA.name}`, 'text-cyan-400');

      await delay(2000);

      // ── Agent B detects and reviews ──
      addLog('👁️', `${agentB.name} detected new action from ${agentA.name}`, 'text-amber-400');
      addLog('🧠', `${agentB.name} querying 0G Compute for peer review...`, 'text-cyan-400');
      
      await delay(1500);

      const compute = new VeriddCompute();
      const review = await compute.reviewAction({
        agentName: agentA.name,
        actionType: action.type,
        input: action.input,
        output: action.output,
      });

      const scoreColor = review.score >= 4 ? 'text-emerald-400' : review.score >= 3 ? 'text-amber-400' : 'text-red-400';
      addLog('📊', `VERIDD Score: ${review.score}/5 — ${review.reasoning}`, scoreColor);

      await delay(1500);

      // ── Agent B submits review on-chain ──
      addLog('✍️', `${agentB.name} submitting review on 0G Chain...`, 'text-violet-400');

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

      addLog('✅', `${agentA.name} VERIDD updated → ${review.score}/5 (${agentB.name} reviewed)`, 'text-green-400');
      
      onScoreUpdate();

    } catch (err: any) {
      addLog('❌', `Error: ${err.message.slice(0, 100)}`, 'text-red-400');
    }
  }, [chain, agents, addLog, onScoreUpdate]);

  // ───── Auto-start when 2+ agents exist ─────
  useEffect(() => {
    if (agents.length >= 2 && !runningRef.current) {
      runningRef.current = true;
      setPhase('running');
      logIdRef.current = 0;
      actionIndexRef.current = 0;
      setLogs([]);

      addLog('🚀', 'Autonomous agent network booting...', 'text-violet-400');
      addLog('🤖', `${agents[0].name} (Agent A) — action submitter`, 'text-violet-300');
      addLog('👁️', `${agents[1].name} (Agent B) — peer reviewer`, 'text-amber-400');
      addLog('', '─'.repeat(40), 'text-gray-700');

      // First cycle immediately, then every 18s
      runCycle();
      const interval = setInterval(() => {
        if (runningRef.current) runCycle();
      }, 18000);

      return () => {
        runningRef.current = false;
        clearInterval(interval);
      };
    }
  }, [agents.length, runCycle, addLog]);

  if (phase === 'idle') return null;

  return (
    <div className="glass-card rounded-xl overflow-hidden border border-gray-700/50">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Autonomous Agent Network
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {agents[0]?.name} ↔ {agents[1]?.name} · Zero human intervention
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-600 bg-gray-800/50 px-3 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Live
          </div>
        </div>
      </div>

      {/* Agent Status */}
      <div className="px-5 py-3 bg-gray-900/50 border-b border-gray-800 flex gap-6 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-gray-500">Agent A:</span>
          <span className="text-violet-300 font-medium">{agents[0]?.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-gray-500">Agent B:</span>
          <span className="text-amber-300 font-medium">{agents[1]?.name}</span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-gray-500">Stack:</span>
          <span className="text-cyan-300 font-medium">0G Chain + Storage + Compute</span>
        </div>
      </div>

      {/* Live Feed */}
      <div className="px-5 py-4 max-h-[400px] overflow-y-auto font-mono text-[12px] leading-relaxed bg-gray-950/50">
        {logs.map((log) => (
          <div key={log.id} className={`flex items-start gap-2 py-0.5 ${log.color || 'text-gray-400'}`}>
            <span className="w-5 text-center flex-shrink-0">{log.icon}</span>
            <span className="opacity-50 text-[10px] flex-shrink-0 w-16">{log.time}</span>
            <span>{log.text}</span>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {/* 0G Tags */}
      <div className="px-5 py-2.5 border-t border-gray-800 bg-gray-900/30 flex flex-wrap gap-2 text-[10px]">
        <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">0G Chain · Agentic ID</span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">0G Storage · Merkle proofs</span>
        <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">0G Compute · Peer review</span>
      </div>
    </div>
  );
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
