import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface PassFailChartProps {
  passed: number;
  failed: number;
  inconclusive: number;
  errors: number;
}

const statusConfig = [
  { key: 'passed', label: 'Passed', color: '#ffffff' },
  { key: 'failed', label: 'Failed', color: '#9898a4' },
  { key: 'inconclusive', label: 'Inconclusive', color: '#555560' },
  { key: 'errors', label: 'Errors', color: '#33333d' },
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
        {item.name}: {item.value}
      </p>
    </div>
  );
};

const PassFailChart: React.FC<PassFailChartProps> = ({
  passed,
  failed,
  inconclusive,
  errors,
}) => {
  const data = [
    { name: 'Passed', value: passed, color: '#ffffff' },
    { name: 'Failed', value: failed, color: '#9898a4' },
    { name: 'Inconclusive', value: inconclusive, color: '#555560' },
    { name: 'Errors', value: errors, color: '#33333d' },
  ].filter((d) => d.value > 0);

  const total = passed + failed + inconclusive + errors;

  return (
    <div className="bg-[#111114] border border-[#222228] rounded-xl p-5">
      <h3 className="text-xs font-mono uppercase tracking-widest text-white mb-4 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
        Test Execution Split
      </h3>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={130} height={130}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={58}
              paddingAngle={2}
              dataKey="value"
              animationDuration={1000}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} stroke="#111114" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {statusConfig.map((s) => {
            const counts: Record<string, number> = { passed, failed, inconclusive, errors };
            const val = counts[s.key] ?? 0;
            return (
              <div key={s.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-xs font-mono text-charcoal-400">{s.label}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-xs font-bold text-white">{val}</span>
                  <span className="text-[10px] text-charcoal-500">
                    {total > 0 ? Math.round((val / total) * 100) : 0}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PassFailChart;
