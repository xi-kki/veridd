import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ethers } from 'ethers';

interface Props {
  contractAddress: string;
  rpcUrl?: string;
  demoMode?: boolean;
}

interface FeedEntry {
  id: number;
  timestamp: string;
  iconName: string;
  text: string;
  txHash?: string;
  color: string;
}

const RPC = 'https://evmrpc-testnet.0g.ai';

const CONTRACT_ABI = [
  'event ActionSubmitted(uint256 indexed agentId, uint256 indexed actionId, string actionType, string storageRoot, address indexed agent, uint256 timestamp)',
  'event ReviewSubmitted(uint256 indexed agentId, uint256 score, address indexed reviewer, string actionRoot, uint256 timestamp)',
  'event AgentCreated(uint256 indexed agentId, string name, address indexed owner, uint256 timestamp)',
  'function getAgent(uint256 agentId) view returns (tuple(string name, string metadataURI, string description, uint256 totalReviews, uint256 totalScore, uint256 createdAt, bool exists))',
];

// ───── Lucide Icon Map ─────────────────────────────────────────────
const icons: Record<string, string> = {
  plug: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg>',
  eye: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  sparkles: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>',
  robot: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="12" x="3" y="8" rx="2"/><path d="M3 12v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><path d="M14 2v4"/><path d="M10 2v4"/><path d="M8 16v2"/><path d="M16 16v2"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/></svg>',
  'bar-chart': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>',
  'alert-triangle': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  'loader': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
  'check-circle': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
};

const FeedIcon: React.FC<{ name: string }> = ({ name }) => {
  const svg = icons[name];
  if (!svg) return <span className="w-3.5 h-3.5 inline-block" />;
  return (
    <span
      className="w-3.5 h-3.5 inline-flex items-center justify-center flex-shrink-0"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

// ───── Demo generator ──────────────────────────────────────────────
const DEMO_AGENTS = ['Aegis', 'Zora', 'Eon', 'Nova', 'Orion'];
const DEMO_ACTIONS = ['market_analysis', 'trade_execution', 'security_audit', 'data_analysis', 'sentiment_scan'];

function generateDemoTx(): string {
  return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export const LiveNetworkFeed: React.FC<Props> = ({ contractAddress, rpcUrl, demoMode }) => {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ agents: 0, actions: 0, reviews: 0 });

  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  const addEntry = useCallback((iconName: string, text: string, color: string, txHash?: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setEntries(prev => [...prev.slice(-150), { id: idRef.current++, timestamp: time, iconName, text, txHash, color }]);
  }, []);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  // ───── MODE 1: Demo simulation ──────────────────────────────────
  useEffect(() => {
    if (!demoMode) return;
    let running = true;

    async function runDemo() {
      setConnected(true);
      addEntry('plug', 'Connected to 0G Galileo Testnet', 'text-emerald-400');

      // Simulate historical events loading
      addEntry('eye', 'Historical scan from block 40,239,402 → 40,439,402...', 'text-gray-500');

      await delay(1500);

      // Load existing agents
      const existingAgents = ['Aegis (#0)', 'Zora (#1)', 'Eon (#2)'];
      for (const name of existingAgents) {
        if (!running) return;
        const tx = generateDemoTx();
        addEntry('sparkles', `Agent "${name}" registered on-chain`, 'text-violet-400', tx);
        await delay(800);
      }
      setStats(s => ({ ...s, agents: 3 }));

      await delay(500);

      // Load existing actions
      const existingActions = [
        ['Aegis', 'market analysis', '0x7421...f9e3'],
        ['Zora', 'trade execution', '0xac98...be0a'],
        ['Eon', 'security audit', '0x063a...c42b'],
        ['Aegis', 'data analysis', '0x6779...d10d'],
        ['Zora', 'sentiment scan', '0x2a6f...f0ee'],
      ];
      for (const [agent, action, tx] of existingActions) {
        if (!running) return;
        addEntry('robot', `${agent} executed: ${action}`, 'text-cyan-400', tx);
        await delay(400);
      }
      setStats(s => ({ ...s, actions: 5 }));

      await delay(500);

      // Load existing reviews
      const existingReviews = [
        ['Aegis', 5, '0xe87b...e0c'],
        ['Zora', 3, '0x3dea...fe3'],
        ['Eon', 4, '0x21c7...21d'],
        ['Aegis', 4, '0xac98...be0a'],
      ];
      for (const [agent, score, tx] of existingReviews) {
        if (!running) return;
        const s = score as number;
        const color = s >= 4 ? 'text-emerald-400' : s >= 3 ? 'text-amber-400' : 'text-red-400';
        addEntry('bar-chart', `${agent} scored: ${score}/5`, color, tx);
        await delay(600);
      }
      setStats(s => ({ ...s, reviews: 4 }));

      setLoading(false);

      // ── Live demo: emit new activity every 12s ──
      let cycle = 0;
      while (running) {
        await delay(12000);
        if (!running) return;

        const agent = DEMO_AGENTS[cycle % DEMO_AGENTS.length];
        const action = DEMO_ACTIONS[cycle % DEMO_ACTIONS.length];
        const score = [5, 5, 4, 3, 2][cycle % 5];
        const tx = generateDemoTx();

        // New agent registers every 5 cycles
        if (cycle > 0 && cycle % 5 === 0) {
          const newName = DEMO_AGENTS[3 + Math.floor(cycle / 5) % 2];
          addEntry('sparkles', `Agent "${newName}" (#${3 + Math.floor(cycle / 5)}) registered on-chain`, 'text-violet-400', generateDemoTx());
          setStats(s => ({ ...s, agents: s.agents + 1 }));
          await delay(1000);
        }

        // New action
        addEntry('robot', `${agent} executed: ${action.replace(/_/g, ' ')}`, 'text-cyan-400', tx);
        setStats(s => ({ ...s, actions: s.actions + 1 }));

        await delay(3000);

        // New review
        const s = typeof score === 'number' ? score : Number(score);
        const color = s >= 4 ? 'text-emerald-400' : s >= 3 ? 'text-amber-400' : 'text-red-400';
        addEntry('bar-chart', `${agent} scored: ${score}/5`, color, generateDemoTx());
        setStats(s => ({ ...s, reviews: s.reviews + 1 }));

        cycle++;
      }
    }

    runDemo();
    return () => { running = false; };
  }, [demoMode]);

  // ───── MODE 2: Real on-chain query ──────────────────────────────
  useEffect(() => {
    if (demoMode) return;
    let running = true;
    let interval: ReturnType<typeof setInterval>;
    let failureCount = 0;
    let lastAgentCount = 0;
    let lastActionCount = 0;

    async function poll() {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl || RPC);
        const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

        if (!connected) {
          setConnected(true);
          addEntry('plug', 'Connected to 0G Galileo Testnet', 'text-emerald-400');
        }
        setLoading(false);
        failureCount = 0;

        const totalAgents = Number(await contract.nextAgentId());
        const totalActions = Number(await contract.nextActionId());
        setStats({ agents: totalAgents, actions: totalActions, reviews: 0 });

        // Check for new agents
        if (totalAgents > lastAgentCount) {
          for (let i = lastAgentCount; i < totalAgents; i++) {
            try {
              const agent = await contract.getAgent(i);
              if (agent && agent.exists) {
                addEntry('sparkles', `Agent "${agent.name}" (#${i}) registered on-chain`, 'text-violet-400');
              }
            } catch {}
          }
          lastAgentCount = totalAgents;
        }

        // Check for new actions
        if (totalActions > lastActionCount) {
          for (let i = lastActionCount; i < totalActions; i++) {
            try {
              const action = await contract.getAction(i);
              if (action && action.exists) {
                addEntry('robot', `Action #${i}: ${action.actionType}`, 'text-cyan-400');
              }
            } catch {}
          }
          lastActionCount = totalActions;
        }

      } catch (err: any) {
        failureCount++;
        if (failureCount === 1) {
          console.warn('[LiveFeed] Poll hiccup:', (err.message || '').slice(0, 80));
        } else if (failureCount === 3) {
          addEntry('alert-triangle', 'RPC connection issue - retrying...', 'text-amber-500');
        }
      }
    }

    poll();
    interval = setInterval(poll, 10000);

    return () => {
      running = false;
      clearInterval(interval);
    };
  }, [contractAddress, rpcUrl, demoMode]);

  return (
    <div className="glass-card rounded-xl overflow-hidden border border-gray-700/50">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
          <div>
            <h3 className="text-white font-bold text-sm">Live Network Activity</h3>
            <p className="text-[10px] text-gray-500">
              0G Galileo Testnet &middot; Real-time agent activity
              {demoMode && <span className="text-amber-400 ml-1">(demo)</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-violet-400">{loading ? '...' : stats.agents} agents</span>
          <span className="text-cyan-400">{loading ? '...' : stats.actions} actions</span>
          <span className="text-emerald-400">{loading ? '...' : stats.reviews} reviews</span>
        </div>
      </div>

      {/* Terminal Feed */}
      <div className="bg-gray-950/80 px-4 py-3 font-mono text-[12px] leading-relaxed max-h-[400px] overflow-y-auto">
        {loading && entries.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            <div className="animate-pulse mb-2">
              <div className="w-3 h-3 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
            <p className="text-[11px]">Connecting to 0G Galileo...</p>
          </div>
        )}
        {entries.map(e => (
          <div key={e.id} className="flex items-start gap-2 py-0.5 group hover:bg-gray-900/40 rounded px-1 -mx-1 transition-colors">
            <span className="w-3.5 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FeedIcon name={e.iconName} />
            </span>
            <span className="opacity-40 text-[10px] flex-shrink-0 w-16 select-none">{e.timestamp}</span>
            <span className={`flex-1 ${e.color}`}>{e.text}</span>
            {e.txHash && (
              <a
                href={`https://chainscan-galileo.0g.ai/tx/${e.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-0 group-hover:opacity-40 text-[10px] text-gray-500 hover:!opacity-100 transition-opacity flex-shrink-0"
                title="View on explorer"
              >
                ↗
              </a>
            )}
          </div>
        ))}
        <div ref={ref} />
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 border-t border-gray-800 bg-gray-900/30 flex items-center gap-3 text-[10px] text-gray-600">
        <span className="flex items-center gap-1">
          <span className={`w-1 h-1 rounded-full ${connected ? 'bg-emerald-400' : 'bg-gray-600'}`} />
          {connected ? 'Live' : 'Connecting...'}
        </span>
        {demoMode && <><span>|</span><span className="text-amber-500">Demo Mode</span></>}
        <span>|</span>
        <span>0G Chain &middot; Storage &middot; Compute</span>
        {!loading && stats.agents > 0 && (
          <>
            <span>|</span>
            <span className="text-green-400/60">&#10003; Loaded</span>
          </>
        )}
      </div>
    </div>
  );
};

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
