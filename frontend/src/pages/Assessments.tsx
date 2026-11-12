import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  ArrowRight,
  GitCompare,
  Search,
  Filter,
  Inbox,
  RefreshCw,
  Loader2,
  X,
} from 'lucide-react';
import { getAssessments, compareAssessments } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { AssessmentSummary } from '../types';
import { formatDate } from '../utils/formatters';
import CompareView from '../components/assessment/CompareView';

function StatusBadge({ status }: { status: string }) {
  const norm = (status ?? 'pending').toLowerCase();
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-charcoal-800 text-white border border-charcoal-600">
      {norm === 'running' && (
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
      )}
      {status}
    </span>
  );
}

function ScorePill({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) {
    return <span className="text-xs text-charcoal-400 font-mono">—</span>;
  }
  const rounded = Math.round(score);
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-charcoal-800 text-white border border-charcoal-600">
      {rounded} / 100
    </span>
  );
}

export const Assessments: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [comparing, setComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState<any | null>(null);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const data = await getAssessments();
      setAssessments(data);
    } catch (err: any) {
      toast.error('Failed to load assessments', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleSelect = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleCompare = async () => {
    if (selectedIds.length !== 2) return;
    setComparing(true);
    const [idA, idB] = selectedIds[0] < selectedIds[1]
      ? [selectedIds[0], selectedIds[1]]
      : [selectedIds[1], selectedIds[0]];

    try {
      const data = await compareAssessments(idA, idB);
      setComparisonData(data);
      toast.success('Comparison ready', `Comparing Run #${idA} vs Run #${idB}`);
    } catch (err: any) {
      toast.error('Comparison failed', err?.message || 'Could not fetch differential analysis');
    } finally {
      setComparing(false);
    }
  };

  const filtered = assessments.filter((a) => {
    const matchesSearch =
      (a.target_name || '').toLowerCase().includes(search.toLowerCase()) ||
      String(a.id).includes(search);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 font-mono">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight uppercase">
            Assessment History
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-300 mt-1 font-sans">
            Review past security assessment runs, scores, and test outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          {selectedIds.length === 2 && (
            <button
              onClick={handleCompare}
              disabled={comparing}
              className="px-3.5 py-2 uppercase flex items-center gap-1.5 rounded-lg bg-white text-black font-bold font-mono hover:bg-charcoal-200 transition shadow-lg"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{comparing ? 'Comparing…' : `Compare (#${selectedIds[0]} vs #${selectedIds[1]})`}</span>
            </button>
          )}
          <button
            onClick={fetchAssessments}
            className="p-2 rounded-lg bg-stark-950 border border-charcoal-800 text-charcoal-400 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/assessments/new')}
            className="pro-button-primary px-4 py-2 uppercase flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-black stroke-black" />
            <span>New Assessment</span>
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-charcoal-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by target or ID…"
            className="w-full bg-stark-950 border border-charcoal-800 rounded-lg pl-9 pr-4 py-2 text-white placeholder-charcoal-500 focus:outline-none focus:border-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-charcoal-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-stark-950 border border-charcoal-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white"
          >
            <option value="all">ALL STATUSES</option>
            <option value="completed">COMPLETED</option>
            <option value="running">RUNNING</option>
            <option value="failed">FAILED</option>
            <option value="pending">PENDING</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 font-mono text-xs text-charcoal-400">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <p>Loading assessment history…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center font-mono">
          <div className="p-4 bg-stark-950 rounded-2xl border border-charcoal-800 mb-4">
            <Inbox className="w-10 h-10 text-charcoal-600" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">NO ASSESSMENTS RECORDED</h3>
          <p className="text-sm text-charcoal-400 max-w-sm mb-6 font-sans">
            Launch your first security scan to begin continuous evaluation.
          </p>
        </div>
      ) : (
        <div className="bg-stark-950 border border-charcoal-800 rounded-xl overflow-hidden font-mono text-xs">
          <div className="px-4 py-2.5 bg-black border-b border-charcoal-800 flex items-center justify-between text-charcoal-400 text-[11px]">
            <span>Select any 2 checkboxes below to compare security deltas</span>
            {selectedIds.length > 0 && (
              <span className="text-white font-bold bg-charcoal-800 px-2 py-0.5 rounded border border-charcoal-700">
                {selectedIds.length} / 2 selected {selectedIds.length === 2 && '• Ready to Compare'}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black text-charcoal-400 border-b border-charcoal-800 text-[10px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-4 w-10 text-center">COMPARE</th>
                  <th className="py-3 px-4">RUN</th>
                  <th className="py-3 px-4">TARGET MODEL</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4 text-center">SCORE</th>
                  <th className="py-3 px-4 text-center">PASS / FAIL</th>
                  <th className="py-3 px-4">TIMESTAMP</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-900">
                {filtered.map((a) => {
                  const idNum = Number(a.id);
                  const isChecked = selectedIds.includes(idNum);
                  return (
                    <tr
                      key={a.id}
                      onClick={() => navigate(`/assessments/${a.id}`)}
                      className={`hover:bg-charcoal-900/60 cursor-pointer transition-colors ${
                        isChecked ? 'bg-charcoal-900/80 border-l-2 border-white' : ''
                      }`}
                    >
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(idNum);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-charcoal-600 bg-black text-white focus:ring-0 cursor-pointer h-4 w-4 accent-white"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">#{a.id}</td>
                      <td className="py-3.5 px-4 text-white font-semibold">{a.target_name || 'Target'}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <ScorePill score={a.summary_score} />
                      </td>
                      <td className="py-3.5 px-4 text-center text-charcoal-300">
                        <span className="text-white font-bold">{a.passed_tests ?? 0}</span>
                        <span className="text-charcoal-500 mx-1">/</span>
                        <span className="text-charcoal-400">{a.failed_tests ?? 0}</span>
                      </td>
                      <td className="py-3.5 px-4 text-charcoal-400">
                        {a.started_at ? formatDate(a.started_at) : 'Recent'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/assessments/${a.id}`);
                          }}
                          className="text-xs text-white hover:underline font-bold inline-flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compare Differential Modal */}
      {comparisonData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setComparisonData(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-charcoal-700 bg-[#111114] shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <CompareView
              comparison={comparisonData}
              onClose={() => setComparisonData(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Assessments;
