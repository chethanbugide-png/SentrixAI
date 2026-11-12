import React from 'react';

interface StatusDotProps {
  status: 'running' | 'online' | 'offline' | 'idle';
  className?: string;
}

const dotColors: Record<string, { ping: string; dot: string }> = {
  running: { ping: 'bg-white', dot: 'bg-white' },
  online: { ping: 'bg-white', dot: 'bg-white' },
  offline: { ping: 'bg-charcoal-400', dot: 'bg-charcoal-500' },
  idle: { ping: 'bg-charcoal-400', dot: 'bg-charcoal-400' },
};

const StatusDot: React.FC<StatusDotProps> = ({ status, className = '' }) => {
  const colors = dotColors[status] || dotColors.idle;
  const shouldAnimate = status === 'running' || status === 'online';

  return (
    <span className={`relative flex h-2.5 w-2.5 ${className}`}>
      {shouldAnimate && (
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${colors.ping}`}
        />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors.dot}`} />
    </span>
  );
};

export default StatusDot;
