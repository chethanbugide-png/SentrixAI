import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { CategoryScore } from '../../types';
import { getCategoryLabel } from '../../utils/formatters';

interface CategoryRadarChartProps {
  data: CategoryScore[];
}

const CategoryRadarChart: React.FC<CategoryRadarChartProps> = ({ data }) => {
  const chartData = data.map((item) => ({
    category: getCategoryLabel(item.category),
    score: item.score,
    fullMark: 100,
  }));

  const CustomTooltip: React.FC<{ active?: boolean; payload?: any[] }> = ({
    active,
    payload,
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#0a0a0c] border border-[#33333d] rounded-lg px-3 py-2 shadow-2xl">
        <p className="text-xs font-mono text-charcoal-400">{payload[0]?.payload?.category}</p>
        <p className="text-xs font-mono font-bold text-white">
          Score: {payload[0]?.value} / 100
        </p>
      </div>
    );
  };

  return (
    <div className="bg-[#111114] border border-[#222228] rounded-xl p-5">
      <h3 className="text-xs font-mono uppercase tracking-widest text-white mb-4 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
        Vulnerability Surface Radar
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#222228" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: '#8b8b96', fontSize: 10, fontFamily: 'monospace' }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#555560', fontSize: 9, fontFamily: 'monospace' }}
            stroke="#222228"
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#ffffff"
            fill="#ffffff"
            fillOpacity={0.12}
            strokeWidth={1.5}
            animationDuration={1000}
          >
          </Radar>
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryRadarChart;
