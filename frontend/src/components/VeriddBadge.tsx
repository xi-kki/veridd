import React from 'react';

interface VeriddBadgeProps {
  score: number;
  totalReviews: number;
  size?: 'sm' | 'md' | 'lg';
}

// ───── Lucide icon SVGs ────────────────────────────────────────────

const iconTrophy = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>';
const iconCheck = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>';
const iconBarChart = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>';
const iconAlert = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>';
const iconBan = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>';

interface TierInfo {
  color: string;
  shadow: string;
  iconSvg: string;
  label: string;
  desc: string;
}

const tiers: TierInfo[] = [
  {
    color: 'from-violet-500 to-purple-700',
    shadow: 'shadow-purple-500/25',
    iconSvg: iconTrophy,
    label: 'Elite',
    desc: 'Top-tier agent',
  },
  {
    color: 'from-emerald-400 to-emerald-600',
    shadow: 'shadow-emerald-500/25',
    iconSvg: iconCheck,
    label: 'Trusted',
    desc: 'Reliable performer',
  },
  {
    color: 'from-blue-400 to-blue-600',
    shadow: 'shadow-blue-500/25',
    iconSvg: iconBarChart,
    label: 'Reliable',
    desc: 'Met expectations',
  },
  {
    color: 'from-amber-400 to-orange-500',
    shadow: 'shadow-amber-500/25',
    iconSvg: iconAlert,
    label: 'Caution',
    desc: 'Below average',
  },
  {
    color: 'from-red-500 to-rose-600',
    shadow: 'shadow-red-500/25',
    iconSvg: iconBan,
    label: 'Risky',
    desc: 'Poor track record',
  },
];

/**
 * Veridd Score Badge — visual reputation indicator
 * Color-coded tiers from Elite (purple) to Risky (red)
 * Design: gradient circle with tier label + review count
 */
export const VeriddBadge: React.FC<VeriddBadgeProps> = ({ score, totalReviews, size = 'md' }) => {
  const getTier = (): TierInfo => {
    if (score >= 4.5) return tiers[0];
    if (score >= 4) return tiers[1];
    if (score >= 3) return tiers[2];
    if (score >= 2) return tiers[3];
    return tiers[4];
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

      {/* Tier Label with Lucide icon */}
      <span className={`${labelSizes[size]} font-bold text-white/80 flex items-center gap-1`}>
        <span
          className="w-3.5 h-3.5 inline-flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: tier.iconSvg }}
        />
        <span>{tier.label}</span>
      </span>

      {/* Description tooltip */}
      <span className="text-[10px] text-gray-600">{tier.desc}</span>

      {/* Review Count */}
      <span className="text-[10px] text-gray-500">
        {totalReviews} review{totalReviews !== 1 ? 's' : ''}
      </span>
    </div>
  );
};
