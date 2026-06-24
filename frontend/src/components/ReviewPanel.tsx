import React, { useState, useEffect } from 'react';
import { VeriddChain } from '../lib/chain';
import { VeriddCompute, ReviewResult } from '../lib/compute';
import { VeriddStorage } from '../lib/storage';
import { VeriddBadge } from './VeriddBadge';

interface Props {
  agentId: number;
  chain: VeriddChain;
  onSubmitted: (score?: number) => void;
  onCancel: () => void;
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

/** Step in the review workflow — visualized as a timeline */
interface ReviewStep {
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
  description: string;
}

export const ReviewPanel: React.FC<Props> = ({ agentId, chain, onSubmitted, onCancel }) => {
  const [step, setStep] = useState<'select' | 'reviewing' | 'result' | 'submitting'>('select');
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agentName, setAgentName] = useState('');
  const [steps, setSteps] = useState<ReviewStep[]>([]);

  useEffect(() => {
    chain
      .getAgent(agentId)
      .then((a) => a && setAgentName(a.name))
      .catch(() => {});
  }, [agentId, chain]);

  const handleRunReview = async (idx: number) => {
    setStep('reviewing');
    setError('');

    // Animate through workflow steps
    const workflowSteps: ReviewStep[] = [
      { label: 'Loading Action', status: 'active', description: 'Reading action data...' },
      { label: '0G Compute Review', status: 'pending', description: 'Peer agent analyzing...' },
      { label: 'Storing Proof', status: 'pending', description: 'Merkle root generation...' },
    ];
    setSteps(workflowSteps);

    // Step 1: Simulate loading delay
    await new Promise((r) => setTimeout(r, 600));
    setSteps((prev) =>
      prev.map((s, i) =>
        i === 0 ? { ...s, status: 'done' } : i === 1 ? { ...s, status: 'active' } : s,
      ),
    );

    // Step 2: Run review
    setLoading(true);
    try {
      const action = DEMO_ACTIONS[idx];
      const compute = new VeriddCompute();
      const result = await compute.reviewAction({
        agentName: agentName || `Agent #${agentId}`,
        actionType: action.type,
        input: action.input,
        output: action.output,
      });
      setReview(result);

      setSteps((prev) =>
        prev.map((s, i) =>
          i === 1 ? { ...s, status: 'done' } : i === 2 ? { ...s, status: 'active' } : s,
        ),
      );
      await new Promise((r) => setTimeout(r, 500));
      setSteps((prev) => prev.map((s) => (s.status === 'active' ? { ...s, status: 'done' } : s)));

      setStep('result');
    } catch (err: any) {
      setError(err.message);
      setSteps((prev) =>
        prev.map((s) =>
          s.status === 'active' ? { ...s, status: 'error', description: 'Failed' } : s,
        ),
      );
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!review) return;
    setStep('submitting');
    setError('');

    try {
      const action = DEMO_ACTIONS[0];
      const storage = new VeriddStorage();

      // Store action + review on 0G Storage
      const [actionResult, reviewResult] = await Promise.all([
        storage.storeAction({
          agentId: String(agentId),
          agentName: agentName || `Agent #${agentId}`,
          actionType: action.type,
          input: action.input,
          output: action.output,
          modelInfo: 'grok-2-latest',
          timestamp: Date.now(),
        }),
        storage.storeReview({
          agentId: String(agentId),
          reviewerId: chain.address || '',
          reviewerName: agentName || `Agent #${agentId}`,
          score: review.score,
          reasoning: review.reasoning,
          evidenceHashes: [],
          timestamp: Date.now(),
        }),
      ]);

      await chain.submitReview(
        agentId,
        review.score,
        actionResult.root,
        reviewResult.root,
        review.reasoning.slice(0, 100),
      );

      onSubmitted(review.score);
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Check your wallet.');
      setStep('result');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">VERIDD Review</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="status-orb thinking" />
              <p className="text-xs text-gray-400">{agentName || `Agent #${agentId}`}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-300 text-xl leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* ═══ STEP 1: Select Action ═══ */}
        {step === 'select' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 mb-3">
              Select an action. A peer agent on{' '}
              <span className="text-cyan-400 font-medium">0G Compute</span> will analyze and score
              it.
            </p>
            {DEMO_ACTIONS.map((a, i) => (
              <button
                key={i}
                onClick={() => handleRunReview(i)}
                className="w-full text-left glass-card rounded-lg p-3.5 transition-all 
                  hover:border-gray-600 hover:bg-gray-800/80 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    {a.type.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-gray-600 group-hover:text-cyan-400 transition-colors">
                    via 0G Compute →
                  </span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-1">{a.input}</p>
              </button>
            ))}
          </div>
        )}

        {/* ═══ STEP 2: Reviewing (Workflow Visualization) ═══ */}
        {step === 'reviewing' && (
          <div className="py-6">
            {/* Agent Status Orb */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-3">
                <div
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 
                  flex items-center justify-center shadow-lg shadow-purple-500/20"
                >
                  <div className="typing-dot !w-2.5 !h-2.5 !bg-white" />
                  <div className="typing-dot !w-2.5 !h-2.5 !bg-white" />
                  <div className="typing-dot !w-2.5 !h-2.5 !bg-white" />
                </div>
              </div>
              <p className="text-sm text-white font-medium mb-1">Peer Agent Reviewing</p>
              <p className="text-xs text-gray-500">Analyzing action on 0G Compute...</p>
            </div>

            {/* Workflow Timeline */}
            <div className="space-y-3 max-w-sm mx-auto">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  {/* Status Icon */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs
                    ${s.status === 'done' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : ''}
                    ${s.status === 'active' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : ''}
                    ${s.status === 'pending' ? 'bg-gray-800 text-gray-600 border border-gray-700' : ''}
                    ${s.status === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : ''}
                  `}
                  >
                    {s.status === 'done'
                      ? '✓'
                      : s.status === 'error'
                        ? '✗'
                        : s.status === 'active'
                          ? '⟳'
                          : ''}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-xs font-medium ${s.status === 'done' ? 'text-emerald-400' : s.status === 'active' ? 'text-cyan-400' : s.status === 'error' ? 'text-red-400' : 'text-gray-600'}`}
                    >
                      {s.label}
                    </p>
                    <p className="text-[10px] text-gray-600">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Result ═══ */}
        {step === 'result' && review && (
          <div className="space-y-4">
            {/* Score Display */}
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-5 mb-4">
                <VeriddBadge score={review.score} totalReviews={1} size="sm" />
                <div>
                  <p className="text-white font-bold text-lg">Score: {review.score}/5</p>
                  <p className="text-[11px] text-gray-500">
                    Confidence: {Math.round(review.confidence * 100)}%
                  </p>
                </div>
              </div>

              {/* Reasoning */}
              <div className="bg-gray-900/60 rounded-lg p-3.5 mb-3">
                <p className="text-[10px] text-gray-500 mb-1.5 font-medium uppercase tracking-wider">
                  Review Reasoning
                </p>
                <p className="text-sm text-gray-300 leading-relaxed">{review.reasoning}</p>
              </div>

              {/* Flags */}
              {review.flags?.length ? (
                <div className="bg-amber-900/15 border border-amber-700/25 rounded-lg p-3">
                  <p className="text-[10px] text-amber-400 font-medium uppercase tracking-wider mb-1">
                    <svg className="w-3.5 h-3.5 text-amber-400 inline-block mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Flags
                  </p>
                  {review.flags.map((f, i) => (
                    <p key={i} className="text-xs text-amber-300">
                      {f}
                    </p>
                  ))}
                </div>
              ) : null}

              {/* Verification Badge */}
              <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-600 bg-gray-900/40 rounded-lg px-3 py-2">
                <svg
                  className="w-4 h-4 text-emerald-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span>
                  Stored on <strong className="text-emerald-400 font-medium">0G Storage</strong>{' '}
                  with Merkle proof verification
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-900/15 border border-red-700/25 rounded-lg p-3">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('select');
                  setReview(null);
                }}
                className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 
                  transition-all text-sm cursor-pointer font-medium"
              >
                Try Another Action
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white 
                  transition-all text-sm font-medium cursor-pointer flex items-center justify-center gap-2"
              >
                Submit Onchain
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 4: Submitting ═══ */}
        {step === 'submitting' && (
          <div className="text-center py-10">
            <div
              className="animate-spin w-10 h-10 border-2 border-violet-500 border-t-transparent 
              rounded-full mx-auto mb-4"
            />
            <p className="text-sm text-gray-300 font-medium mb-1">Storing to 0G Storage...</p>
            <p className="text-xs text-gray-600">Action + Review with Merkle proof verification</p>
            <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-gray-700">
              <span>⟳ Storing action</span>
              <span>⟳ Generating proof</span>
              <span>⟳ Submitting onchain</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
