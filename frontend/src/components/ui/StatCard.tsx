import React, { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral' | string;
  color?: string;
  suffix?: string;
  pulse?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  change,
  changeType = 'neutral',
  color = '#ffffff',
  suffix = '',
  pulse = false,
}) => {
  const isNumeric = typeof value === 'number';
  const [displayValue, setDisplayValue] = useState<number | string>(
    isNumeric ? 0 : value
  );
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isNumeric) {
      setDisplayValue(value);
      return;
    }

    const target = value as number;
    const duration = 1200;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [value, isNumeric]);

  return (
    <div className="relative bg-[#111114] border border-[#222228] rounded-xl p-5 hover:border-[#383844] transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-mono uppercase tracking-widest text-charcoal-400 mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black tracking-tight text-white font-mono">
              {typeof displayValue === 'number'
                ? displayValue.toLocaleString()
                : displayValue}
            </span>
            {suffix && (
              <span className="text-sm font-mono text-charcoal-400">{suffix}</span>
            )}
          </div>
          {change && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-xs font-mono font-medium text-white px-1.5 py-0.5 rounded bg-charcoal-800/80 border border-charcoal-700/60">
                {change}
              </span>
            </div>
          )}
          {trend && !change && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-xs font-mono font-bold text-white px-1.5 py-0.5 rounded bg-charcoal-800/80 border border-charcoal-700/60">
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs font-mono text-charcoal-400">vs prev cycle</span>
            </div>
          )}
        </div>
        <div
          className={`p-3 rounded-xl bg-charcoal-900 border border-charcoal-800 text-white transition-all duration-200 group-hover:border-charcoal-600 ${
            pulse ? 'animate-pulse' : ''
          }`}
        >
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
