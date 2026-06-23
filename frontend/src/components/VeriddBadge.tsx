import React from 'react';

interface VeriddBadgeProps {
  score: number;
  totalReviews: number;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Veridd Score Badge — visual reputation indicator
 * Color-coded tiers from Elite (purple) to Risky (red)
 * Design: gradient circle with tier label + review count
 */
export const VeriddBadge: React.FC<VeriddBadgeProps> = ({ score, totalReviews, size = 'md' }) => {
  const getTier = () => {
    if (score >= 4.5)
      return {
        color: 'from-violet-500 to-purple-700',
        shadow: 'shadow-purple-500/25',
        label: '🏆 Elite',
        desc: 'Top-tier agent',
      };
    if (score >= 4)
      return {
        color: 'from-emerald-400 to-emerald-600',
        shadow: 'shadow-emerald-500/25',
        label: '✅ Trusted',
        desc: 'Reliable performer',
      };
    if (score >= 3)
      return {
        color: 'from-blue-400 to-blue-600',
        shadow: 'shadow-blue-500/25',
        label: '📊 Reliable',
        desc: 'Met expectations',
      };
    if (score >= 2)
      return {
        color: 'from-amber-400 to-orange-500',
        shadow: 'shadow-amber-500/25',
        label: '⚠️ Caution',
        desc: 'Below average',
      };
    return {
      color: 'from-red-500 to-rose-600',
      shadow: 'shadow-red-500/25',
      label: '🚫 Risky',
      desc: 'Poor track record',
    };
  };

  const sizes = {
    sm: 'w-14 h-14 text-xs',
    md: 'w-20 h-20 text-sm',
    lg: 'w-28 h-28 text-lg',
  };
  const labelSizes = { sm: 'text-[11px]', md: 'text-xs', lg: 'text-sm' };

  if (totalReviews === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 group">
        <div
          className={`${sizes[size]} rounded-full bg-gray-800 border-2 border-gray-700 
          flex items-center justify-center transition-all duration-300 group-hover:border-gray-600`}
        >
          <span className="text-gray-500 font-bold text-2xl">?</span>
        </div>
        <span className={`${labelSizes[size]} text-gray-500 font-medium`}>No score yet</span>
        <span className="text-[10px] text-gray-700">Unrated agent</span>
      </div>
    );
  }

  const tier = getTier();

  return (
    <div className="flex flex-col items-center gap-1.5 group">
      {/* Score Circle */}
      <div
        className={`${sizes[size]} rounded-full bg-gradient-to-br ${tier.color} ${tier.shadow} 
        shadow-lg flex items-center justify-center flex-col cursor-default
        transition-transform duration-300 group-hover:scale-105`}
      >
        <span className="font-black text-white leading-none">{score.toFixed(1)}</span>
      </div>

      {/* Tier Label */}
      <span className={`${labelSizes[size]} font-bold text-white/80`}>{tier.label}</span>

      {/* Description tooltip */}
      <span className="text-[10px] text-gray-600">{tier.desc}</span>

      {/* Review Count */}
      <span className="text-[10px] text-gray-500">
        {totalReviews} review{totalReviews !== 1 ? 's' : ''}
      </span>
    </div>
  );
};
