import React from 'react';
import type { Severity } from '../../types';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

const severityStyles: Record<string, string> = {
  critical: 'bg-white text-black font-extrabold border-white shadow-[0_0_8px_rgba(255,255,255,0.4)]',
  high: 'bg-charcoal-700 text-white font-bold border-charcoal-500',
  medium: 'bg-charcoal-800 text-charcoal-200 border-charcoal-600',
  low: 'bg-charcoal-900 text-charcoal-300 border-charcoal-700',
  info: 'bg-charcoal-900 text-charcoal-400 border-charcoal-800',
  none: 'bg-black text-charcoal-400 border-charcoal-800',
};

const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className = '' }) => {
  const norm = severity?.toLowerCase() || 'info';
  const style = severityStyles[norm] || severityStyles.info;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${style} ${className}`}
    >
      {severity}
    </span>
  );
};

export default SeverityBadge;
