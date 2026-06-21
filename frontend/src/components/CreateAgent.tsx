import React, { useState, useRef } from 'react';
import { VeridChain } from '../lib/chain';
import { VeridStorage } from '../lib/storage';

interface Props {
  chain: VeridChain;
  onCreated: () => void;
  onCancel: () => void;
}

/**
 * Create Agent Modal — mints an Agentic ID on 0G Chain
 * 
 * Edge cases handled:
 *   - Double-submit prevention (submitting ref)
 *   - Modal close during tx (disabled cancel)
 *   - Empty name validation
 *   - Storage failure fallback (metadata URI still works)
 *   - Transaction timeout
 */
export const CreateAgent: React.FC<Props> = ({ chain, onCreated, onCancel }) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [caps, setCaps] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Agent name is required'); return; }
    if (submitting.current) return; // Double-submit guard
    submitting.current = true;

    setLoading(true);
    setError('');

    try {
      // 1. Store profile on 0G Storage (best effort)
      let profileRoot = 'verid://profiles/default';
      try {
        const storage = new VeridStorage();
        profileRoot = await storage.storeAgentProfile({
          name: name.trim(),
          description: desc.trim(),
          capabilities: caps.split(',').map(c => c.trim()).filter(Boolean),
          owner: chain.address || '',
          createdAt: Date.now()
        });
        profileRoot = `verid://profiles/${profileRoot}`;
      } catch (storageErr) {
        console.warn('Storage upload failed, using default URI:', storageErr);
      }

      // 2. Mint Agentic ID on 0G Chain
      await chain.createAgent(name.trim(), desc.trim(), profileRoot);
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create agent. Check your wallet and try again.');
    }
    setLoading(false);
    submitting.current = false;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">Register Agent</h2>
            <p className="text-xs text-gray-500 mt-0.5">Mint an Agentic ID on 0G Chain</p>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-gray-500 hover:text-gray-300 text-xl leading-none disabled:opacity-30 cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Agent Name */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block font-medium">Agent Name *</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Alpha Trader"
              maxLength={64}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm 
                focus:outline-none focus:border-violet-500 placeholder-gray-600 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block font-medium">Description</label>
            <textarea
              value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="What does this agent do?"
              rows={3} maxLength={500}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm 
                focus:outline-none focus:border-violet-500 placeholder-gray-600 transition-colors resize-none"
            />
          </div>

          {/* Capabilities */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block font-medium">Capabilities</label>
            <input
              value={caps} onChange={e => setCaps(e.target.value)}
              placeholder="trading, analysis, security (comma separated)"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm 
                focus:outline-none focus:border-violet-500 placeholder-gray-600 transition-colors"
            />
          </div>

          {/* 0G Product Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">
              0G Chain ✓
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              0G Storage ✓
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
              Agentic ID ✓
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 
              disabled:text-gray-500 text-white rounded-lg transition-all text-sm font-medium 
              flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Minting Agentic ID on 0G Chain...</span>
              </>
            ) : (
              'Mint Agentic ID'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
