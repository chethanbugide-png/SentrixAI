import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import SeverityBadge from '../ui/SeverityBadge';
import StatusBadge from '../ui/StatusBadge';
import type { TestResult } from '../../types';
import { getCategoryLabel } from '../../utils/formatters';

interface TestResultRowProps {
  result: TestResult;
}

export const TestResultRow: React.FC<TestResultRowProps> = ({ result }) => {
  const [expanded, setExpanded] = useState(false);

  const testName = result.test_name || result.name || result.test_case_id || 'Test Case';
  const confidencePct = Math.round((result.confidence || 0) * 100);

  return (
    <div className="border border-[#222228] rounded-xl overflow-hidden bg-[#111114] hover:border-[#383844] transition-colors">
      {/* Row Header */}
      <div
        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start md:items-center gap-3">
          <div
            className={`p-1.5 rounded-lg border ${
              result.status === 'failed'
                ? 'bg-white text-black border-white'
                : 'bg-charcoal-900 text-white border-charcoal-700'
            }`}
          >
            {result.status === 'passed' ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-charcoal-400 font-medium">
                {result.test_case_id}
              </span>
              <span className="text-sm font-bold text-white font-mono">{testName}</span>
            </div>
            <p className="text-xs text-charcoal-400 mt-0.5 font-mono">
              Vector: <span className="text-white">{getCategoryLabel(result.category)}</span>
            </p>
          </div>
        </div>

        {/* Right Badges */}
        <div className="flex items-center gap-3 self-end md:self-center">
          {result.latency_ms !== undefined && (
            <div className="flex items-center gap-1 text-xs text-charcoal-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-charcoal-500" />
              <span>{result.latency_ms}ms</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-charcoal-400 font-mono">
            <span>Conf:</span>
            <div className="w-14 h-1.5 bg-charcoal-800 rounded-full overflow-hidden border border-charcoal-700">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${confidencePct}%` }}
              />
            </div>
            <span className="text-white font-bold">{confidencePct}%</span>
          </div>

          {result.severity && result.severity !== 'none' && (
            <SeverityBadge severity={result.severity} />
          )}

          <StatusBadge status={result.status} />

          <button className="p-1 rounded text-charcoal-400 hover:text-white">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="p-4 border-t border-[#222228] bg-[#0a0a0c] space-y-3.5 text-xs">
          {/* Prompt */}
          <div>
            <span className="text-charcoal-400 font-mono text-[11px] uppercase tracking-wider block mb-1">
              Adversarial Input Payload
            </span>
            <div className="p-3 rounded-lg bg-[#111114] border border-[#222228] text-white font-mono text-xs whitespace-pre-wrap leading-relaxed">
              {result.input_prompt || 'No input prompt recorded.'}
            </div>
          </div>

          {/* Model Response */}
          <div>
            <span className="text-charcoal-400 font-mono text-[11px] uppercase tracking-wider block mb-1">
              Target Output Response
            </span>
            <div className="p-3 rounded-lg bg-[#111114] border border-[#222228] text-white font-mono text-xs whitespace-pre-wrap leading-relaxed">
              {result.response || 'No response captured.'}
            </div>
          </div>

          {/* Evidence */}
          {result.evidence && (
            <div>
              <span className="text-charcoal-400 font-mono text-[11px] uppercase tracking-wider block mb-1">
                Detector Verdict & Evidence
              </span>
              <div
                className={`p-3 rounded-lg font-mono text-xs leading-relaxed border ${
                  result.status === 'failed'
                    ? 'bg-[#18181f] border-charcoal-600 text-white font-semibold'
                    : 'bg-[#111114] border-[#222228] text-charcoal-300'
                }`}
              >
                {result.evidence}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestResultRow;
