import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ethers } from 'ethers';

interface Props {
  contractAddress: string;
  rpcUrl?: string;
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
  'function nextActionId() view returns (uint256)',
];

// ───── Lucide Icon Map ─────────────────────────────────────────────

const icons: Record<string, string> = {
  plug: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg>',
  eye: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  sparkles: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>',
  robot: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="12" x="3" y="8" rx="2"/><path d="M3 12v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><path d="M14 2v4"/><path d="M10 2v4"/><path d="M8 16v2"/><path d="M16 16v2"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/></svg>',
  'bar-chart': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>',
  'alert-triangle': '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
};

/** Render a Lucide icon by name */
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

export const LiveNetworkFeed: React.FC<Props> = ({ contractAddress, rpcUrl }) => {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState({ actions: 0, reviews: 0, agents: 0 });
  const [lastActionId, setLastActionId] = useState(0n);
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const lastBlockRef = useRef(0);

  const addEntry = useCallback((iconName: string, text: string, color: string, txHash?: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setEntries(prev => [...prev.slice(-100), { id: idRef.current++, timestamp: time, iconName, text, txHash, color }]);
  }, []);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  useEffect(() => {
    let running = true;
    let interval: ReturnType<typeof setInterval>;

    async function poll() {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl || RPC);
        const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

        const currentBlock = await provider.getBlockNumber();
        const fromBlock = lastBlockRef.current || currentBlock - 100;
        lastBlockRef.current = currentBlock;

        if (!connected) {
          setConnected(true);
          addEntry('plug', 'Connected to 0G Galileo Testnet', 'text-emerald-400');
          addEntry('eye', 'Watching for agent activity...', 'text-gray-500');
        }

        // Fetch events
        const [actionEvents, reviewEvents, creationEvents] = await Promise.all([
          contract.queryFilter('ActionSubmitted', fromBlock, currentBlock),
          contract.queryFilter('ReviewSubmitted', fromBlock, currentBlock),
          contract.queryFilter('AgentCreated', fromBlock, currentBlock),
        ]);

        // Agent Creations
        for (const e of creationEvents) {
          const args = e.args!;
          const name = args.name as string;
          addEntry('sparkles', `Agent "${name}" (#${args.agentId}) registered on-chain`, 'text-violet-400', e.transactionHash);
          setStats(s => ({ ...s, agents: s.agents + 1 }));
        }

        // Action Submissions
        for (const e of actionEvents) {
          const args = e.args!;
          const actionType = (args.actionType as string).replace(/_/g, ' ');
          const agentAddr = (args.agent as string).slice(0, 8);

          // Try to get agent name
          let agentName = `Agent #${args.agentId}`;
          try {
            const agent = await contract.getAgent(args.agentId);
            if (agent?.name) agentName = agent.name as string;
          } catch { }

          addEntry('robot', `${agentName} executed: ${actionType}`, 'text-cyan-400', e.transactionHash);
          setStats(s => ({ ...s, actions: s.actions + 1 }));
          setLastActionId(args.actionId);
        }

        // Review Submissions
        for (const e of reviewEvents) {
          const args = e.args!;
          const score = Number(args.score);
          const agentAddr = (args.reviewer as string).slice(0, 8);

          // Try to get agent name
          let agentName = `Agent #${args.agentId}`;
          try {
            const agent = await contract.getAgent(args.agentId);
            if (agent?.name) agentName = agent.name as string;
          } catch { }

          const color = score >= 4 ? 'text-emerald-400' : score >= 3 ? 'text-amber-400' : 'text-red-400';
          addEntry('bar-chart', `${agentName} scored: ${score}/5`, color, e.transactionHash);
          setStats(s => ({ ...s, reviews: s.reviews + 1 }));
        }

      } catch (err) {
        if (connected) {
          addEntry('alert-triangle', `Poll error: ${(err as Error).message.slice(0, 60)}`, 'text-red-400');
        }
      }
    }

    // Initial connection
    poll();

    // Poll every 3 seconds
    interval = setInterval(poll, 3000);

    return () => {
      running = false;
      clearInterval(interval);
    };
  }, [contractAddress, rpcUrl]);

  return (
    <div className="glass-card rounded-xl overflow-hidden border border-gray-700/50">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
          <div>
            <h3 className="text-white font-bold text-sm">Live Network Activity</h3>
            <p className="text-[10px] text-gray-500">0G Galileo Testnet · Real-time agent activity</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-violet-400">{stats.agents} agents</span>
          <span className="text-cyan-400">{stats.actions} actions</span>
          <span className="text-emerald-400">{stats.reviews} reviews</span>
        </div>
      </div>

      {/* Terminal Feed */}
      <div className="bg-gray-950/80 px-4 py-3 font-mono text-[12px] leading-relaxed max-h-[400px] overflow-y-auto">
        {entries.length === 0 && (
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
        <span>|</span>
        <span>Polling every 3s</span>
        <span>|</span>
        <span>0G Chain · Storage · Compute</span>
      </div>
    </div>
  );
};
