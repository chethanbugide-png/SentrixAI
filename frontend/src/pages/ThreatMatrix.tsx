import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Activity,
  Play,
} from 'lucide-react';
import { getThreatMatrix } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export const ThreatMatrix: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  useEffect(() => {
    getThreatMatrix()
      .then((res) => {
        setData(res);
        if (res.owasp_matrix?.length > 0) {
          setSelectedItem(res.owasp_matrix[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="py-24 flex justify-center font-mono text-xs">
        <LoadingSpinner size="lg" label="Loading threat intelligence matrix..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight uppercase">
            Threat Intelligence Matrix
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-300 mt-1 font-sans">
            Vulnerability taxonomy aligned with OWASP Top 10 for LLM Applications and MITRE ATLAS.
          </p>
        </div>
        <button
          onClick={() => navigate('/assessments/new')}
          className="pro-button-primary px-4 py-2 text-xs uppercase flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Play className="w-3.5 h-3.5 fill-black stroke-black" />
          <span>Scan All Vectors</span>
        </button>
      </div>

      {/* MITRE ATLAS Coverage Row */}
      <div className="p-5 rounded-xl bg-stark-950 border border-charcoal-800 space-y-3 font-mono">
        <div className="flex items-center justify-between text-xs text-white font-bold uppercase">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-white" />
            <span>MITRE ATLAS Tactical Coverage</span>
          </span>
          <span className="text-charcoal-400 font-normal">{data.total_tactics} tactics active</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {data.atlas_tactics.map((t: any) => (
            <div
              key={t.code}
              className="p-3 rounded-lg bg-black border border-charcoal-800 space-y-1 text-xs font-mono"
            >
              <span className="text-white font-bold text-[11px] block">{t.code}</span>
              <div className="text-charcoal-200 truncate">{t.tactic}</div>
              <div className="flex items-center justify-between pt-1 text-[10px] text-charcoal-400">
                <span>COVERAGE</span>
                <span className="text-white font-bold">{t.coverage}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OWASP LLM Top 10 Grid + Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono">
        {/* Matrix Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-charcoal-400 font-bold uppercase">
            <span>OWASP TOP 10 FOR LLMS</span>
            <span>10 CLASSES</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.owasp_matrix.map((item: any) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all select-none space-y-2 ${
                    isSelected
                      ? 'bg-charcoal-800 border-white text-white shadow-sm'
                      : 'bg-stark-950 border-charcoal-800 hover:border-charcoal-600 text-charcoal-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {item.id}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        item.severity === 'CRITICAL'
                          ? 'bg-white text-black font-extrabold'
                          : 'bg-charcoal-900 text-charcoal-300 border border-charcoal-700'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white font-sans">{item.title}</h4>
                  <p className="text-[11px] text-charcoal-400 line-clamp-2 leading-relaxed font-sans">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-1.5 text-[10px] text-charcoal-500 border-t border-charcoal-800">
                    <span>{item.test_count} tests</span>
                    <span className="text-white font-bold">{item.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Blueprint Panel (5 cols) */}
        <div className="lg:col-span-5">
          {selectedItem && (
            <div className="p-5 rounded-xl bg-stark-950 border border-charcoal-800 space-y-4 sticky top-20 font-mono">
              <div className="border-b border-charcoal-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    {selectedItem.id}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-charcoal-800 text-white border border-charcoal-600 font-bold">
                    {selectedItem.severity} IMPACT
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1 font-sans">
                  {selectedItem.title}
                </h3>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-charcoal-400 font-bold block">
                  VULNERABILITY PROFILE:
                </span>
                <p className="text-charcoal-200 leading-relaxed font-sans">
                  {selectedItem.description}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-black border border-charcoal-800 text-xs space-y-0.5">
                <span className="text-charcoal-400 text-[10px] block">MITRE ATLAS TACTIC</span>
                <span className="text-white font-bold">{selectedItem.atlas_tactic}</span>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>MITIGATION BLUEPRINT</span>
                </span>
                <div className="p-3.5 rounded-lg bg-black border border-charcoal-800 text-charcoal-200 leading-relaxed font-sans">
                  {selectedItem.mitigation}
                </div>
              </div>

              <button
                onClick={() => navigate('/playground')}
                className="w-full pro-button-primary py-2.5 text-xs uppercase flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-black stroke-black" />
                <span>Test in Playground</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreatMatrix;
