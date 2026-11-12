import React, { useEffect, useState } from 'react';

interface SecurityGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  animated?: boolean;
}

const SecurityGauge: React.FC<SecurityGaugeProps> = ({
  score,
  size = 200,
  strokeWidth = 12,
  label = 'Overall Security Posture',
  animated = true,
}) => {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      return;
    }
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * score);
      setDisplayScore(start);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score, animated]);

  const progress = displayScore / 100;
  const offset = circumference * (1 - progress);
  const getGradientId = `gauge-gradient-${size}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <defs>
          <linearGradient id={getGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor="#9898a4" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1c1c22"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${getGradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300 ease-out"
        />
        {/* Score text */}
        <text
          x={center}
          y={center - 8}
          textAnchor="middle"
          dominantBaseline="central"
          className="transform rotate-90"
          style={{ transformOrigin: `${center}px ${center}px` }}
          fill="#ffffff"
          fontSize={size * 0.22}
          fontWeight="900"
          fontFamily="monospace"
        >
          {displayScore}
        </text>
        <text
          x={center}
          y={center + size * 0.12}
          textAnchor="middle"
          dominantBaseline="central"
          className="transform rotate-90"
          style={{ transformOrigin: `${center}px ${center}px` }}
          fill="#6e6e78"
          fontSize={size * 0.07}
          fontFamily="monospace"
        >
          / 100
        </text>
      </svg>
      {label && (
        <p className="text-xs font-mono uppercase tracking-widest text-charcoal-400 font-semibold">{label}</p>
      )}
    </div>
  );
};

export default SecurityGauge;
