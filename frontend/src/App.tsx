import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { AgentCard } from './components/AgentCard';
import { CreateAgent } from './components/CreateAgent';
import { ReviewPanel } from './components/ReviewPanel';
import { FloatingIdCard } from './components/FloatingIdCard';
import { LiveNetworkFeed } from './components/LiveNetworkFeed';
import { VeriddChain } from './lib/chain';

// Default to testnet. Override with VITE_CONTRACT_ADDRESS in frontend/.env for local dev
const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  '0x70c88e1A57917409fdA2935F16A38deb4aEF5Bfa';

interface Agent {
  agentId: number;
  name: string;
  description: string;
  veriddScore: { average: number; total: number };
  isOwner: boolean;
}

function App() {
  const [chain, setChain] = useState<VeriddChain | null>(null);
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [globalStats, setGlobalStats] = useState({ agents: 0, actions: 0, reviews: 0 });
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Filter agents by search term
  const filteredAgents = useMemo(
    () =>
      searchTerm.trim()
        ? agents.filter(
            (a) =>
              a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              String(a.agentId).includes(searchTerm),
          )
        : agents,
    [agents, searchTerm],
  );

  const handleConnect = useCallback(async () => {
    try {
      setError('');
      const c = new VeriddChain(CONTRACT_ADDRESS);
      const addr = await c.connect();
      setChain(c);
      setAddress(addr);
      // Agents load via useEffect when address/chain state updates
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if ((window as any).ethereum?.selectedAddress) handleConnect();
  }, []);

  const loadAgents = useCallback(
    async (c?: VeriddChain) => {
      const ch = c || chain;
      if (!ch || !address) return;
      setLoading(true);
      try {
        const ids = await ch.getAgentsByOwner(address);
        const agentList: Agent[] = [];
        for (const id of ids) {
          const agent = await ch.getAgent(id);
          if (!agent) continue;
          const score = await ch.getReputation(id);
          agentList.push({
            agentId: Number(id),
            name: agent.name,
            description: agent.description,
            veriddScore: score,
            isOwner: true,
          });
        }
        setAgents(agentList);
      } catch (err) {
        console.error('load agents error:', err);
      }
      setLoading(false);
    },
    [chain, address],
  );

  /** Load ALL agents system-wide (not just the connected wallet) */
  const loadAllAgents = useCallback(async () => {
    if (!chain) return;
    try {
      const totalAgents = await chain.getTotalAgents();
      const totalActions = await chain.getTotalActions();
      const agentList: Agent[] = [];
      for (let i = 0; i < Number(totalAgents); i++) {
        try {
          const agent = await chain.getAgent(i);
          if (!agent || !agent.exists) continue;
          const score = await chain.getReputation(i);
          agentList.push({
            agentId: i,
            name: agent.name,
            description: agent.description,
            veriddScore: score,
            isOwner: false,
          });
        } catch {}
      }
      setAllAgents(agentList);
      setGlobalStats({ agents: Number(totalAgents), actions: Number(totalActions), reviews: 0 });
    } catch {}
  }, [chain]);

  // Initial load of all agents (runs once on mount)
  useEffect(() => {
    loadAllAgents();
    const interval = setInterval(() => loadAllAgents(), 15000);
    return () => clearInterval(interval);
  }, [loadAllAgents]);

  useEffect(() => {
    if (address && chain) {
      loadAgents();
    }
  }, [address, chain, loadAgents]);

  return (
    <div className="min-h-screen bg-gray-950 overflow-x-hidden">
      {/* ═══ NAV ═══ */}
      <nav className="border-b border-gray-800 bg-gray-950/90 backdrop-blur-md sticky top-0 z-40">
        {/* Animated gradient underline */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] overflow-hidden">
          <div
            className="w-full h-full animate-gradient-slide"
            style={{
              background:
                'linear-gradient(90deg, transparent, #a855f7, #7c3aed, #22d3ee, transparent)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between relative">
          <div className="flex items-center gap-2.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#a855f7"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="w-5 h-5 flex-shrink-0"
            >
              <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-xl tracking-tight hover:text-violet-400 transition-colors cursor-default">
                Veridd
              </span>
              <span
                className="text-[11px] bg-violet-500/10 text-violet-400 px-2 py-0.5 
                rounded-full border border-violet-500/20 font-medium"
              >
                on 0G
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Network indicator */}
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
              0G Galileo
            </div>

            {/* Score ticker (before connect) */}
            {!address && (
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-gray-600">
                <span className="text-violet-400 font-mono tabular-nums">12,847</span>
                <span>agents</span>
              </div>
            )}

            {/* Wallet */}
            {!address ? (
              <button
                onClick={handleConnect}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg 
                  transition-all text-xs font-medium cursor-pointer"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono bg-gray-800/50 px-2.5 py-1 rounded-lg">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ═══ MAIN ═══ */}
      <main>
        {/* Error banner */}
        {error && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
            <div className="bg-red-900/15 border border-red-700/25 rounded-lg p-3.5 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-xs text-red-400">{error}</p>
              <button
                onClick={() => setError('')}
                className="ml-auto text-red-400/60 hover:text-red-400 text-sm cursor-pointer"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* ═══ HERO — Floating ID Card (full viewport) ═══ */}
        {!address && <FloatingIdCard onConnect={handleConnect} />}

        {/* ═══ REGISTERED VIEW (with footer) ═══ */}
        {address && (
          <>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
              {/* Actions Bar */}
              <div className="flex items-center justify-between mb-6 gap-4">
                <button
                  onClick={() => setShowCreate(true)}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg 
                  transition-all text-sm font-medium flex items-center gap-2 cursor-pointer flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Register Agent
                </button>

                {/* Search bar with round logo SVG */}
                <div className="relative flex-1 max-w-xs">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none">
                    <svg
                      viewBox="0 0 256 256"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-full h-full opacity-50"
                    >
                      <circle
                        cx="128"
                        cy="128"
                        r="120"
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="8"
                        opacity="0.3"
                      />
                      <path
                        d="M128 48 L172 72 L172 108 C172 156 152 190 128 204 C104 190 84 156 84 108 L84 72 Z"
                        fill="#a855f7"
                        opacity="0.2"
                        stroke="#a855f7"
                        strokeWidth="5"
                      />
                      <path
                        d="M104 128 L122 146 L152 110"
                        stroke="#a855f7"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search agents by name or ID..."
                    className="w-full bg-gray-900/60 border border-gray-700/50 rounded-lg pl-10 pr-4 py-2 
                    text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-violet-500/50 
                    focus:ring-1 focus:ring-violet-500/20 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Toast notification */}
              {toast && (
                <div className="mb-4 animate-slide-up">
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${
                    toast.type === 'success' 
                      ? 'bg-emerald-900/20 border-emerald-700/30 text-emerald-300' 
                      : 'bg-red-900/20 border-red-700/30 text-red-300'
                  }`}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={toast.type === 'success' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}/>
                    </svg>
                    <span>{toast.message}</span>
                  </div>
                </div>
              )}

              {/* Modals */}
              {showCreate && chain && (
                <CreateAgent
                  chain={chain}
                  onCreated={() => {
                    setShowCreate(false);
                    loadAgents(chain);
                    setToast({ message: 'Agent registered on 0G Chain!', type: 'success' });
                  }}
                  onCancel={() => setShowCreate(false)}
                />
              )}
              {reviewTarget !== null && chain && (
                <ReviewPanel
                  agentId={reviewTarget}
                  chain={chain}
                  onSubmitted={(_score) => {
                    setReviewTarget(null);
                    loadAgents(chain);
                  }}
                  onCancel={() => setReviewTarget(null)}
                />
              )}

              {/* ═══ ALL AGENTS (system-wide) ═══ */}
              {allAgents.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xs font-medium text-gray-500 mb-4 uppercase tracking-widest">
                    All Agents on Chain ({allAgents.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allAgents.map((a) => (
                      <AgentCard key={a.agentId} {...a} onReview={(id) => setReviewTarget(id)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading ? (
                <div className="text-center py-16">
                  <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Loading your agents...</p>
                </div>
              ) : agents.length > 0 ? (
                /* Agent Grid */
                <div>
                  <h2 className="text-xs font-medium text-gray-500 mb-4 uppercase tracking-widest">
                    Your Agents ({filteredAgents.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAgents.map((a) => (
                      <AgentCard key={a.agentId} {...a} onReview={(id) => setReviewTarget(id)} />
                    ))}
                  </div>
                  {searchTerm.trim() && filteredAgents.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                      <p className="text-sm">No agents match &quot;{searchTerm}&quot;</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Empty State */
                <div className="text-center py-16 bg-gray-900/40 rounded-2xl border border-gray-800">
                  <div className="mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#a855f7"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      className="w-14 h-14 mx-auto"
                    >
                      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold mb-1">No Agents Yet</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Register your first AI agent to start building reputation.
                  </p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="text-sm text-violet-400 hover:text-violet-300 font-medium cursor-pointer"
                  >
                    Register Your First Agent →
                  </button>
                </div>
              )}

              {/* ═══ LIVE NETWORK FEED ═══ */}
              {chain && allAgents.length >= 1 && (
                <>
                  <div className="mt-16 mb-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-transparent" />
                    <span className="text-[10px] font-mono text-emerald-500/40 tracking-[0.2em] uppercase">
                      Live Network Activity
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-emerald-500/0" />
                  </div>
                  <div className="mb-8">
                    <LiveNetworkFeed
                      contractAddress={CONTRACT_ADDRESS}
                      rpcUrl="https://evmrpc-testnet.0g.ai"
                      demoMode={false}
                    />
                  </div>
                </>
              )}
            </div>

            {/* ═══ FOOTER ═══ */}
            <footer className="max-w-6xl mx-auto px-4 sm:px-6 mt-12 pb-8 pt-6 border-t border-gray-800 text-center">
              <div className="flex items-center justify-center gap-3 sm:gap-4 text-[11px] text-gray-600">
                <span>Powered by</span>
                {[
                  { name: '0G Chain', color: 'text-violet-400' },
                  { name: '0G Storage', color: 'text-emerald-400' },
                  { name: '0G Compute', color: 'text-cyan-400' },
                  { name: 'Agentic ID', color: 'text-violet-300' },
                ].map((item, i) => (
                  <React.Fragment key={item.name}>
                    {i > 0 && <span className="text-gray-700">·</span>}
                    <span className={`${item.color} font-medium`}>{item.name}</span>
                  </React.Fragment>
                ))}
              </div>
              <p className="text-gray-700 text-[11px] mt-2">
                Every action verified · Every review immutable · Decentralized credit for AI agents
              </p>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
