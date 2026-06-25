import React from 'react';
import { VeriddBadge } from './VeriddBadge';
import { generatePixelAvatar } from '../lib/pixel-avatar';

interface AgentCardProps {
  agentId: number;
  name: string;
  description: string;
  veriddScore: { average: number; total: number };
  isOwner?: boolean;
  onReview?: (id: number) => void;
}

/**
 * Agent Card — displays an agent's VERIDD score, info, and actions
 * Design: glass card with hover glow, responsive grid
 */
export const AgentCard: React.FC<AgentCardProps> = ({
  agentId,
  name,
  description,
  veriddScore,
  isOwner,
  onReview,
}) => {
  return (
    <div
      className="glass-card rounded-xl p-5 hover:border-violet-500/40 transition-all 
      duration-300 hover:shadow-lg hover:shadow-violet-500/10 group animate-slide-up"
    >
      <div className="flex items-start gap-4">
        {/* Pixel Avatar */}
        <div className="flex-shrink-0 flex flex-col items-center gap-2">
          <img
            src={generatePixelAvatar(agentId, name, 48)}
            alt={`${name} avatar`}
            className="w-10 h-10 rounded-lg bg-gray-800/50 ring-1 ring-violet-500/20"
          />
          <VeriddBadge score={veriddScore.average} totalReviews={veriddScore.total} size="sm" />
        </div>

        {/* Agent Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-white truncate">{name}</h3>
            {isOwner && (
              <span
                className="text-[11px] bg-violet-500/20 text-violet-400 px-2 py-0.5 
                rounded-full border border-violet-500/30 font-medium"
              >
                YOURS
              </span>
            )}
            <span className="text-xs text-gray-600 ml-auto font-mono">#{agentId}</span>
          </div>

          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{description}</p>

          {/* Action Button */}
          {onReview && (
            <button
              onClick={() => onReview(agentId)}
              className="text-xs px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 
                text-violet-400 border border-violet-500/30 transition-all 
                hover:border-violet-400/50 cursor-pointer font-medium"
            >
              Submit Action →
            </button>
          )}
        </div>
      </div>

      {/* Verification Footer */}
      <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-1.5 text-[11px] text-gray-600">
        <svg
          className="w-3.5 h-3.5 text-emerald-400/70"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 012 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        0G Storage Verified — Merkle Proof
      </div>
    </div>
  );
};
