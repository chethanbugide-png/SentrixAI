import React from 'react';
import type { AssessmentStatus } from '../../types';

interface StatusBadgeProps {
  status: AssessmentStatus | string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-charcoal-900 text-charcoal-300 border-charcoal-700',
  running: 'bg-white text-black font-extrabold border-white animate-pulse',
  completed: 'bg-charcoal-800 text-white border-charcoal-600',
  passed: 'bg-charcoal-800 text-white border-charcoal-600',
  failed: 'bg-charcoal-900 text-charcoal-100 border-charcoal-500 font-semibold',
  cancelled: 'bg-charcoal-900 text-charcoal-400 border-charcoal-800',
  error: 'bg-charcoal-800 text-white border-charcoal-500',
  inconclusive: 'bg-charcoal-900 text-charcoal-300 border-charcoal-700',
  open: 'bg-charcoal-700 text-white border-charcoal-500',
  acknowledged: 'bg-charcoal-800 text-charcoal-200 border-charcoal-600',
  resolved: 'bg-black text-charcoal-200 border-charcoal-600',
  false_positive: 'bg-charcoal-900 text-charcoal-400 border-charcoal-800',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normStatus = status?.toLowerCase() || 'pending';
  const style = statusStyles[normStatus] || statusStyles.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${style} ${className}`}
    >
      {normStatus === 'running' && (
        <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
      )}
      {status}
    </span>
  );
};

export default StatusBadge;
