import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { SeverityBreakdown } from '../../types';

interface SeverityDistChartProps {
  data: SeverityBreakdown;
}

const severityConfig = [
  { key: 'critical', label: 'Critical', color: '#ffffff' },
  { key: 'high', label: 'High', color: '#c4c4cf' },
  { key: 'medium', label: 'Medium', color: '#9898a4' },
  { key: 'low', label: 'Low', color: '#6e6e78' },
  { key: 'info', label: 'Info', color: '#45454d' },
];

const CustomTooltip: React.FC<{ active?: boolean; payload?: any[] }> = ({
  active,
  payload,
}) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-[#0a0a0c] border border-[#33333d] rounded-lg px-3 py-2 shadow-2xl">
      <p className="text-xs font-mono font-bold text-white">
        {item.payload.label}: {item.value}
      </p>
    </div>
  );
};

const SeverityDistChart: React.FC<SeverityDistChartProps> = ({ data = { critical: 0, high: 0, medium: 0, low: 0, info: 0 } }) => {
  const chartData = severityConfig.map((s) => ({
    ...s,
    value: data?.[s.key as keyof SeverityBreakdown] ?? 0,
  }));

  return (
    <div className="bg-[#111114] border border-[#222228] rounded-xl p-5">
      <h3 className="text-xs font-mono uppercase tracking-widest text-white mb-4 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
        Findings by Severity
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            dataKey="label"
            type="category"
            width={60}
            tick={{ fill: '#8b8b96', fontSize: 11, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#17171c' }} />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            barSize={14}
            animationDuration={1000}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-between mt-3 px-1">
        {chartData.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[11px] font-mono text-charcoal-400">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeverityDistChart;
