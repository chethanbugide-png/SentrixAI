import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number | 'sm' | 'md' | 'lg';
  text?: string;
  label?: string;
  fullPage?: boolean;
}

const sizeMap = { sm: 20, md: 32, lg: 48 } as const;

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 36,
  text,
  label,
  fullPage = false,
}) => {
  const numericSize =
    typeof size === 'number' ? size : sizeMap[size] ?? 32;
  const displayText = label || text || 'Loading...';

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2
        size={numericSize}
        className="text-white animate-spin"
      />
      {displayText && (
        <p className="text-xs font-mono tracking-widest uppercase text-charcoal-400 animate-pulse">
          {displayText}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {content}
      </div>
    );
  }

  return content;
};

export const SkeletonCard: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <div
    className={`bg-[#111114] border border-[#222228] rounded-xl p-5 animate-pulse ${className}`}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-3">
        <div className="h-2.5 w-20 bg-charcoal-800 rounded" />
        <div className="h-7 w-24 bg-charcoal-800 rounded" />
        <div className="h-2.5 w-32 bg-charcoal-800 rounded" />
      </div>
      <div className="h-10 w-10 bg-charcoal-800 rounded-lg" />
    </div>
  </div>
);

export const SkeletonTable: React.FC = () => (
  <div className="bg-[#111114] border border-[#222228] rounded-xl overflow-hidden animate-pulse">
    <div className="p-4 border-b border-[#222228]">
      <div className="h-3.5 w-40 bg-charcoal-800 rounded" />
    </div>
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 p-4 border-b border-[#222228]/50"
      >
        <div className="h-3 w-24 bg-charcoal-800 rounded" />
        <div className="h-3 w-16 bg-charcoal-800 rounded" />
        <div className="h-3 w-12 bg-charcoal-800 rounded" />
        <div className="h-3 w-20 bg-charcoal-800 rounded" />
        <div className="h-3 w-16 bg-charcoal-800 rounded flex-1" />
      </div>
    ))}
  </div>
);

export default LoadingSpinner;
