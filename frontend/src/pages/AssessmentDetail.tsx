import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Search,
  FlaskConical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import TestResultRow from '../components/assessment/TestResultRow';
import { getAssessment, downloadReportPdf, getReport } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { Assessment, TestResult, AssessmentStatus } from '../types';
import { formatDate } from '../utils/formatters';

function ScoreGauge({ score, size = 150 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const progress = Math.min(Math.max(score, 0), 100) / 100;
  const offset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-2 font-mono">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke="#222228" strokeWidth={strokeWidth}
        />
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke="#ffffff" strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <text
          x={center} y={center - 4}
          textAnchor="middle" dominantBaseline="central"
          className="rotate-90" style={{ transformOrigin: `${center}px ${center}px` }}
          fill="#ffffff" fontSize={size * 0.22} fontWeight="bold"
        >
          {Math.round(score)}
        </text>
        <text
          x={center} y={center + size * 0.14}
          textAnchor="middle" dominantBaseline="central"
          className="rotate-90" style={{ transformOrigin: `${center}px ${center}px` }}
          fill="#888894" fontSize={size * 0.08}
        >
          / 100
        </text>
      </svg>
      <span className="text-[11px] text-charcoal-400 uppercase tracking-widest font-semibold">SECURITY SCORE</span>
    </div>
  );
}

function InlineStatusBadge({ status }: { status: AssessmentStatus | string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-charcoal-800 text-white border border-charcoal-600">
      {status}
    </span>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-stark-950 border border-charcoal-800 rounded-xl p-5 flex items-center gap-4 font-mono">
      <div className="p-2.5 rounded-lg bg-charcoal-900 border border-charcoal-700 text-white">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-[10px] text-charcoal-400 uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export const AssessmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'failed' | 'passed'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getAssessment(id);
        setAssessment(data);
      } catch (err: any) {
        toast.error('Failed to load assessment', err?.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!id) return;
    setDownloadingPdf(true);
    try {
      const blob = await downloadReportPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sentrix_assessment_${id}_report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error('PDF export failed', err?.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadJson = async () => {
    if (!id) return;
    try {
      const jsonReport = await getReport(id);
      const blob = new Blob([JSON.stringify(jsonReport, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sentrix_assessment_${id}_report.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error('JSON export failed', err?.message);
    }
  };

  if (loading || !assessment) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 font-mono text-xs text-charcoal-400">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
        <p>Loading assessment details…</p>
      </div>
    );
  }

  const results: TestResult[] = assessment.test_results || assessment.results || [];
  const score = assessment.summary_score ?? assessment.score ?? 0;
  const totalTests = assessment.total_tests || results.length;
  const passed = assessment.passed_tests ?? assessment.passed ?? 0;
  const failed = assessment.failed_tests ?? assessment.failed ?? 0;
  const inconclusive =
    (assessment.inconclusive_tests ?? assessment.inconclusive ?? 0) +
    (assessment.error_tests ?? assessment.errors ?? 0);

  const filteredResults = results.filter((r) => {
    const matchesFilter = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch =
      (r.test_name || r.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.test_case_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.category || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterCounts = {
    all: results.length,
    failed: results.filter((r) => r.status === 'failed').length,
    passed: results.filter((r) => r.status === 'passed').length,
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/assessments')}
            className="p-2 rounded-lg bg-stark-950 border border-charcoal-800 text-charcoal-400 hover:text-white"
            title="Back to assessments"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-charcoal-400">RUN #{assessment.id}</span>
              <InlineStatusBadge status={assessment.status} />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
              {assessment.target_name || `Target #${assessment.target_id}`}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleDownloadJson}
            className="pro-button-secondary px-3.5 py-2 uppercase"
          >
            Export JSON
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="pro-button-primary px-4 py-2 uppercase flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloadingPdf ? 'Exporting…' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Hero Overview Card (Score Gauge + Metrics) */}
      <div className="p-6 rounded-xl bg-stark-950 border border-charcoal-800 flex flex-col md:flex-row items-center gap-8 font-mono">
        <ScoreGauge score={score} size={150} />

        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
          <MetricCard
            label="Total Vectors"
            value={totalTests}
            icon={FlaskConical}
          />
          <MetricCard
            label="Passed Tests"
            value={passed}
            icon={CheckCircle2}
          />
          <MetricCard
            label="Breached Flaws"
            value={failed}
            icon={XCircle}
          />
          <MetricCard
            label="Inconclusive"
            value={inconclusive}
            icon={AlertTriangle}
          />
        </div>
      </div>

      {/* Test Results Section */}
      <div className="space-y-4 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-stark-950 border border-charcoal-800 self-start">
            {(['all', 'failed', 'passed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`px-3 py-1 rounded-md uppercase font-bold transition-all ${
                  filterStatus === tab
                    ? 'bg-white text-black'
                    : 'text-charcoal-400 hover:text-white'
                }`}
              >
                {tab} ({filterCounts[tab]})
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-charcoal-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search test vectors…"
              className="w-full bg-stark-950 border border-charcoal-800 rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-charcoal-500 focus:outline-none focus:border-white text-xs"
            />
          </div>
        </div>

        {filteredResults.length === 0 ? (
          <div className="p-10 rounded-xl bg-stark-950 border border-charcoal-800 text-center text-charcoal-400 text-xs">
            No test results match the current filter.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredResults.map((result, idx) => (
              <TestResultRow key={result.id || idx} result={result} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentDetail;
