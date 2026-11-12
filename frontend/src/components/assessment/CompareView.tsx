import React from 'react';
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { AssessmentSummary } from '../../types';
import { getCategoryLabel } from '../../utils/formatters';

interface CompareViewProps {
  comparison: {
    assessment_a: AssessmentSummary;
    assessment_b: AssessmentSummary;
    score_delta: number;
    new_findings: number;
    resolved_findings: number;
    category_comparison: Record<string, { a: any; b: any }>;
  };
  onClose?: () => void;
}

export const CompareView: React.FC<CompareViewProps> = ({ comparison, onClose }) => {
  const { assessment_a, assessment_b, score_delta, new_findings, resolved_findings, category_comparison } = comparison;

  const scoreA = assessment_a.summary_score ?? 0;
  const scoreB = assessment_b.summary_score ?? 0;

  return (
    <div className="bg-[#111114] border border-[#222228] rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#222228]">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Assessment Differential Analysis
          </h2>
          <p className="text-xs font-mono text-charcoal-400 mt-1">
            Comparative regression test across target iterations
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-charcoal-900 text-charcoal-300 hover:text-white text-xs font-mono border border-charcoal-700 transition"
          >
            Close Diff View
          </button>
        )}
      </div>

      {/* Score Diff Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Baseline (Run A) */}
        <div className="p-4 rounded-xl bg-[#0a0a0c] border border-[#222228]">
          <span className="text-[11px] font-mono uppercase text-charcoal-400 block mb-1">
            Baseline Run #{assessment_a.id}
          </span>
          <p className="text-sm font-semibold text-white mb-2 truncate">
            {assessment_a.target_name || 'Target A'}
          </p>
          <div className="text-2xl font-black font-mono text-white">
            {scoreA.toFixed(1)} <span className="text-xs text-charcoal-500 font-normal">/ 100</span>
          </div>
          <div className="text-xs font-mono text-charcoal-400 mt-1">
            {assessment_a.failed_tests || 0} failed / {assessment_a.total_tests} tests
          </div>
        </div>

        {/* Delta Card */}
        <div className="p-4 rounded-xl bg-[#141418] border border-charcoal-700 flex flex-col justify-center items-center text-center">
          <span className="text-[11px] font-mono uppercase text-charcoal-300 block mb-1">
            Security Score Delta
          </span>
          <div className="text-3xl font-black font-mono text-white flex items-center gap-1">
            {score_delta > 0 ? (
              <TrendingUp className="w-6 h-6 text-white" />
            ) : score_delta < 0 ? (
              <TrendingDown className="w-6 h-6 text-white" />
            ) : (
              <Minus className="w-6 h-6 text-charcoal-400" />
            )}
            {score_delta > 0 ? `+${score_delta.toFixed(1)}` : score_delta.toFixed(1)}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-charcoal-900 border border-charcoal-700 text-white">
              ✓ {resolved_findings} Resolved
            </span>
            <span className="px-2 py-0.5 rounded bg-white text-black font-bold">
              ✗ {new_findings} Regressed
            </span>
          </div>
        </div>

        {/* Target Run (Run B) */}
        <div className="p-4 rounded-xl bg-[#0a0a0c] border border-[#222228]">
          <span className="text-[11px] font-mono uppercase text-charcoal-400 block mb-1">
            Retest Run #{assessment_b.id}
          </span>
          <p className="text-sm font-semibold text-white mb-2 truncate">
            {assessment_b.target_name || 'Target B'}
          </p>
          <div className="text-2xl font-black font-mono text-white">
            {scoreB.toFixed(1)} <span className="text-xs text-charcoal-500 font-normal">/ 100</span>
          </div>
          <div className="text-xs font-mono text-charcoal-400 mt-1">
            {assessment_b.failed_tests || 0} failed / {assessment_b.total_tests} tests
          </div>
        </div>
      </div>

      {/* Category breakdown table */}
      <div>
        <h3 className="text-xs font-mono uppercase tracking-widest text-white mb-3">
          Category Failure Breakdown Comparison
        </h3>
        <div className="border border-[#222228] rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0a0a0c] text-charcoal-400 border-b border-[#222228]">
              <tr>
                <th className="p-3">Category</th>
                <th className="p-3 text-center">Baseline Failures</th>
                <th className="p-3 text-center"></th>
                <th className="p-3 text-center">Retest Failures</th>
                <th className="p-3 text-center">Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222228] bg-[#111114]">
              {Object.entries(category_comparison).map(([cat, val]) => {
                const failA = val.a?.failed ?? 0;
                const failB = val.b?.failed ?? 0;
                const diff = failB - failA;
                return (
                  <tr key={cat} className="hover:bg-[#16161c]">
                    <td className="p-3 text-white font-sans font-medium">
                      {getCategoryLabel(cat)}
                    </td>
                    <td className="p-3 text-center text-charcoal-300 font-bold">{failA}</td>
                    <td className="p-3 text-center text-charcoal-500">
                      <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                    </td>
                    <td className="p-3 text-center text-white font-bold">{failB}</td>
                    <td className="p-3 text-center">
                      {diff < 0 ? (
                        <span className="text-white font-bold px-1.5 py-0.5 rounded bg-charcoal-800 border border-charcoal-700">
                          {diff} (Fixed)
                        </span>
                      ) : diff > 0 ? (
                        <span className="bg-white text-black font-bold px-1.5 py-0.5 rounded">
                          +{diff} (New)
                        </span>
                      ) : (
                        <span className="text-charcoal-500">Unchanged</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default CompareView;
