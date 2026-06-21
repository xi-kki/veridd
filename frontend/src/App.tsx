import React, { useEffect, useState, useCallback } from 'react';
import { AgentCard } from './components/AgentCard';
import { CreateAgent } from './components/CreateAgent';
import { ReviewPanel } from './components/ReviewPanel';
import { VeridChain } from './lib/chain';

const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'; // ⚡ DEPLOY THEN UPDATE

interface Agent {
  id: number;
  name: string;
  description: string;
  veridScore: { average: number; total: number };
  isOwner: boolean;
}

function App() {
  const [chain, setChain] = useState<VeridChain | null>(null);
  const [address, setAddress] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadAgents = useCallback(async (c: VeridChain) => {
    setLoading(true);
    try {
      const ids = await c.getMyAgents();
      const data: Agent[] = [];
      for (const id of ids) {
        const a = await c.getAgent(Number(id));
        const rep = await c.getReputation(Number(id));
        if (a) {
          data.push({
            id: Number(id),
            name: a.name,
            description: a.description,
            veridScore: rep,
            isOwner: true
          });
        }
      }
      setAgents(data);
    } catch (err) {
      console.error('Failed to load agents:', err);
    }
    setLoading(false);
  }, []);

  const handleConnect = async () => {
    setError('');
    try {
      const c = new VeridChain(CONTRACT_ADDRESS);
      const addr = await c.connect();
      setChain(c);
      setAddress(addr);
      loadAgents(c);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if ((window as any).ethereum?.selectedAddress) handleConnect();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* ═══ NAV ═══ */}
      <nav className="border-b border-gray-800 bg-gray-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-black text-white text-xl tracking-tight hover:text-violet-400 transition-colors cursor-default">
              VERID
            </span>
            <span className="text-[11px] bg-violet-500/10 text-violet-400 px-2 py-0.5 
              rounded-full border border-violet-500/20 font-medium">
              on 0G
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Network indicator */}
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
              0G Galileo
            </div>

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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Error banner */}
        {error && (
          <div className="mb-5 bg-red-900/15 border border-red-700/25 rounded-lg p-3.5 flex items-center gap-2">
            <span className="text-red-400 text-sm">⚠️</span>
            <p className="text-xs text-red-400">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-400/60 hover:text-red-400 text-sm cursor-pointer">&times;</button>
          </div>
        )}

        {/* ═══ HERO ═══ */}
        {!address && (
          <div className="text-center py-16 sm:py-24">
            <div className="text-6xl mb-5">🤖</div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight">
              VERID
            </h1>
            <p className="text-lg text-gray-500 font-medium mb-1">True Identity for AI Agents</p>
            <p className="text-sm text-gray-600 max-w-lg mx-auto mb-8 leading-relaxed">
              A credit score for AI agents, built on{' '}
              <span className="text-violet-400 font-medium">0G Chain</span>
              {' + '}
              <span className="text-emerald-400 font-medium">0G Storage</span>
              {' + '}
              <span className="text-cyan-400 font-medium">0G Compute</span>
              {' + '}
              <span className="text-violet-300 font-medium">Agentic ID</span>.
              Every action reviewed. Every reputation verifiable.
            </p>
            <button
              onClick={handleConnect}
              className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl 
                transition-all font-medium text-sm cursor-pointer shadow-lg shadow-violet-500/20
                hover:shadow-violet-500/30"
            >
              Connect Wallet to Start
            </button>

            {/* 0G Stack */}
            <div className="mt-10 flex items-center justify-center gap-4 sm:gap-6 text-[11px] text-gray-700">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" /> 0G Chain
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 0G Storage
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> 0G Compute
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-300" /> Agentic ID
              </span>
            </div>
          </div>
        )}

        {/* ═══ REGISTERED VIEW ═══ */}
        {address && (
          <>
            {/* Actions Bar */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg 
                  transition-all text-sm font-medium flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Register Agent
              </button>
            </div>

            {/* Modals */}
            {showCreate && chain && (
              <CreateAgent
                chain={chain}
                onCreated={() => { setShowCreate(false); loadAgents(chain); }}
                onCancel={() => setShowCreate(false)}
              />
            )}
            {reviewTarget !== null && chain && (
              <ReviewPanel
                agentId={reviewTarget}
                chain={chain}
                onSubmitted={() => { setReviewTarget(null); loadAgents(chain); }}
                onCancel={() => setReviewTarget(null)}
              />
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
                  Your Agents ({agents.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agents.map(a => (
                    <AgentCard
                      key={a.id}
                      {...a}
                      onReview={(id) => setReviewTarget(id)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-16 bg-gray-900/40 rounded-2xl border border-gray-800">
                <div className="text-4xl mb-3">🤖</div>
                <h3 className="text-white font-semibold mb-1">No Agents Yet</h3>
                <p className="text-xs text-gray-500 mb-4">Register your first AI agent to start building reputation.</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="text-sm text-violet-400 hover:text-violet-300 font-medium cursor-pointer"
                >
                  Register Your First Agent →
                </button>
              </div>
            )}
          </>
        )}

        {/* ═══ FOOTER ═══ */}
        {address && (
          <footer className="mt-12 pt-6 border-t border-gray-800 text-center">
            <div className="flex items-center justify-center gap-3 sm:gap-4 text-[11px] text-gray-600">
              <span>Powered by</span>
              {[
                { name: '0G Chain', color: 'text-violet-400' },
                { name: '0G Storage', color: 'text-emerald-400' },
                { name: '0G Compute', color: 'text-cyan-400' },
                { name: 'Agentic ID', color: 'text-violet-300' }
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
        )}
      </main>
    </div>
  );
}

export default App;
