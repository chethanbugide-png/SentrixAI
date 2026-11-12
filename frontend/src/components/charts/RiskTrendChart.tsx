import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { RiskTrendPoint } from '../../types';

interface RiskTrendChartProps {
  data: RiskTrendPoint[];
}

const CustomTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string }> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-stark-950 border border-charcoal-700 rounded-lg px-3.5 py-2.5 shadow-2xl text-xs font-mono">
      <p className="text-charcoal-400 mb-1">{label}</p>
      <div className="flex items-center justify-between gap-4 text-white">
        <span className="text-charcoal-300">Security Score:</span>
        <span className="font-bold text-white">{payload[0]?.value} / 100</span>
      </div>
      {payload[1] && (
        <div className="flex items-center justify-between gap-4 text-charcoal-300 mt-1 border-t border-charcoal-800 pt-1">
          <span>Active Issues:</span>
          <span className="font-bold text-white">{payload[1]?.value}</span>
        </div>
      )}
    </div>
  );
};

export const RiskTrendChart: React.FC<RiskTrendChartProps> = ({ data }) => {
  const chartData = data && data.length > 0 ? data : [
    { date: 'Run #1', score: 72, vulnerabilities: 3 },
    { date: 'Run #2', score: 85, vulnerabilities: 1 },
    { date: 'Current', score: 92, vulnerabilities: 0 },
  ];

  return (
    <div className="w-full">
      <div className="h-[210px] w-full min-h-[210px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreMonoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="vulnMonoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6e6e78" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6e6e78" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 2" stroke="#1f1f26" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#555560"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              fontFamily="monospace"
            />
            <YAxis
              stroke="#555560"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              fontFamily="monospace"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#ffffff"
              strokeWidth={2}
              fill="url(#scoreMonoGrad)"
            />
            <Area
              type="monotone"
              dataKey="vulnerabilities"
              stroke="#888894"
              strokeWidth={1.5}
              fill="url(#vulnMonoGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RiskTrendChart;
