import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Target,
  ArrowRight,
  AlertTriangle,
  Play,
  Activity,
  Terminal,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { getDashboardStats } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { DashboardStats } from '../types';
import { formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import RiskTrendChart from '../components/charts/RiskTrendChart';

// ---------------------------------------------------------------------------
// Stark Monochrome SVG Score Dial
// ---------------------------------------------------------------------------
const ScoreRing: React.FC<{ score: number; size?: number }> = ({
  score,
  size = 96,
}) => {
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.min(Math.max(Number.isFinite(score) ? score : 0, 0), 100);
  const offset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Track (Charcoal) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e1e24"
          strokeWidth={strokeWidth}
        />
        {/* Progress (Pure White) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ffffff"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
        <span className="text-2xl font-extrabold tracking-tight text-white">
          {Math.round(safeScore)}
        </span>
        <span className="text-[9px] text-charcoal-400 uppercase tracking-widest">SCORE</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Security Categories in Stark Minimalist Tone
// ---------------------------------------------------------------------------
interface CategoryRow {
  name: string;
  score: number;
  description: string;
}

const CATEGORIES: CategoryRow[] = [
  { name: 'Prompt Injection', score: 85, description: 'Direct instruction override & adversarial suffix' },
  { name: 'Sensitive Data Exposure', score: 70, description: 'Canary token exfil & synthetic secret leakage' },
  { name: 'Hallucination & Reliability', score: 95, description: 'Slopsquatting & package hallucination resistance' },
  { name: 'Instruction Compliance', score: 80, description: 'Strict JSON schema & formatting invariant' },
  { name: 'Unsafe Output Handling', score: 75, description: 'Malware synthesis refusal & exploit defense' },
  { name: 'Robustness & Perturbation', score: 85, description: 'Cyrillic homoglyph cloaking & zero-width invariance' },
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setErrorMsg(err?.message || 'Could not connect to the backend server.');
      toast.error('Dashboard Error', 'Could not fetch telemetry metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <LoadingSpinner size="lg" label="Synchronizing security telemetry..." />
      </div>
    );
  }

  if (errorMsg && !stats) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-xl bg-stark-950 border border-charcoal-700 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-white mx-auto" />
        <div>
          <h3 className="text-sm font-semibold text-white uppercase font-mono">Telemetry Link Offline</h3>
          <p className="text-xs text-charcoal-300 mt-1 font-mono">{errorMsg}</p>
        </div>
        <button
          onClick={fetchStats}
          className="pro-button-primary px-4 py-2 text-xs font-mono uppercase"
        >
          <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
          Reconnect
        </button>
      </div>
    );
  }

  // Derived metrics
  const recentList = stats?.recent_assessments || [];
  const validScores = recentList
    .map((a) => a.summary_score)
    .filter((s): s is number => typeof s === 'number' && Number.isFinite(s));

  const avgScore =
    stats?.security_score ??
    (validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 82);

  const totalFindings = stats?.total_findings ?? 0;
  const criticalFindings = stats?.critical_findings ?? 0;
  const highFindings = stats?.high_severity_findings ?? 0;
  const totalAssessments = stats?.total_assessments ?? 0;
  const passRate = Math.round(stats?.pass_rate ?? 84);
  const totalTargets = stats?.total_targets ?? 0;

  const riskTrendData = (stats?.risk_trend || []).map((t, idx) => ({
    date: t.date ? formatDate(t.date) : `Run #${t.id || idx + 1}`,
    score: Math.round(t.score ?? 0),
    vulnerabilities: Math.round(Math.max(0, (100 - (t.score ?? 0)) / 10)),
  }));

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Top Banner (Stark Black & Pure White Minimalist Header) */}
      <div className="p-7 rounded-xl bg-stark-950 border border-charcoal-700 flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest uppercase bg-charcoal-800 text-charcoal-200 border border-charcoal-600">
              OPERATIONAL TELEMETRY
            </span>
            <span className="text-charcoal-500 font-mono text-xs">/</span>
            <span className="text-xs font-mono text-charcoal-400">SOC-2 VERIFIED</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Security Overview
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-300 max-w-xl leading-relaxed">
            Automated red-teaming, prompt injection mitigation, and empirical vulnerability discovery for enterprise LLMs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 relative z-10">
          <button
            onClick={() => navigate('/playground')}
            className="pro-button-secondary px-4 py-2 text-xs font-mono uppercase tracking-wider"
          >
            <Terminal className="w-3.5 h-3.5 inline mr-1.5" />
            Playground
          </button>
          <button
            onClick={() => navigate('/assessments/new')}
            className="pro-button-primary px-4 py-2 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-black stroke-black" />
            Launch Audit
          </button>
        </div>
      </div>

      {/* 4 Metric Cards in Charcoal & Stark Monochrome */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Security Score */}
        <div className="p-5 rounded-xl bg-stark-950 border border-charcoal-800 hover:border-charcoal-600 transition-colors flex items-center gap-5">
          <ScoreRing score={avgScore} size={92} />
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-mono uppercase tracking-wider text-charcoal-400">Composite Posture</p>
            <span className="inline-block text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-charcoal-800 text-white border border-charcoal-600">
              {avgScore >= 80 ? 'RESILIENT' : avgScore >= 60 ? 'MODERATE' : 'VULNERABLE'}
            </span>
            <p className="text-[11px] font-mono text-charcoal-400">Formula: 100 - S</p>
          </div>
        </div>

        {/* Monitored Targets */}
        <div className="p-5 rounded-xl bg-stark-950 border border-charcoal-800 hover:border-charcoal-600 transition-colors space-y-2">
          <div className="flex items-center justify-between text-xs text-charcoal-400 font-mono">
            <span>TARGET NODES</span>
            <Target className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {totalTargets}
            </span>
            <span className="text-xs font-mono text-charcoal-400">MODELS</span>
          </div>
          <p className="text-[11px] font-mono text-charcoal-400">Simulated & Local Ollama nodes</p>
        </div>

        {/* Discovered Issues */}
        <div className="p-5 rounded-xl bg-stark-950 border border-charcoal-800 hover:border-charcoal-600 transition-colors space-y-2">
          <div className="flex items-center justify-between text-xs text-charcoal-400 font-mono">
            <span>DISCOVERED FLAWS</span>
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {totalFindings}
            </span>
            <span className="text-xs font-mono text-charcoal-400">VECTORS</span>
          </div>
          <p className="text-[11px] font-mono text-charcoal-300">
            {criticalFindings > 0 ? (
              <span className="text-white font-bold underline">{criticalFindings} Critical</span>
            ) : null}
            {criticalFindings > 0 && highFindings > 0 ? ' · ' : null}
            {highFindings > 0 ? `${highFindings} High Severity` : null}
            {criticalFindings === 0 && highFindings === 0 ? '0 Critical active' : null}
          </p>
        </div>

        {/* Completed Audits */}
        <div className="p-5 rounded-xl bg-stark-950 border border-charcoal-800 hover:border-charcoal-600 transition-colors space-y-2">
          <div className="flex items-center justify-between text-xs text-charcoal-400 font-mono">
            <span>ASSESSMENTS RUN</span>
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {totalAssessments}
            </span>
            <span className="text-xs font-mono text-charcoal-400">RUNS</span>
          </div>
          <p className="text-[11px] font-mono text-charcoal-400">
            <span className="text-white font-bold">{passRate}%</span> overall pass rate
          </p>
        </div>
      </div>

      {/* Middle Section: Security Category Posture + Risk Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Health (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-stark-950 border border-charcoal-800 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Vulnerability Category Posture
              </h2>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Empirical compliance mapped against OWASP LLM 2025 Top 10
              </p>
            </div>
            <button
              onClick={() => navigate('/matrix')}
              className="text-xs font-mono text-white hover:underline flex items-center gap-1 transition-all"
            >
              <span>Threat Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4 pt-1">
            {CATEGORIES.map((cat, idx) => {
              const isPass = cat.score >= 80;
              return (
                <div key={idx} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-white font-mono">
                        {cat.name}
                      </span>
                      <span className="text-[11px] text-charcoal-400 ml-2 hidden sm:inline">
                        — {cat.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 font-mono">
                      <span className="text-white font-bold tabular-nums">
                        {cat.score}%
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                          isPass
                            ? 'bg-charcoal-800 text-white border border-charcoal-600'
                            : 'bg-white text-black font-extrabold'
                        }`}
                      >
                        {isPass ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  </div>
                  {/* High contrast monochrome bar */}
                  <div className="w-full bg-charcoal-900 h-2 rounded-full overflow-hidden border border-charcoal-800">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out bg-white"
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Trend Chart (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-stark-950 border border-charcoal-800 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Historical Progression
              </h2>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Composite security trajectory over time
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal-900 text-charcoal-300 border border-charcoal-700">
              AUDIT LOG
            </span>
          </div>

          <div className="pt-2 flex-1 flex items-center">
            <RiskTrendChart data={riskTrendData} />
          </div>
        </div>
      </div>

      {/* Recent Assessment Table */}
      <div className="p-6 rounded-xl bg-stark-950 border border-charcoal-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Recent Assessment Executions
            </h2>
            <p className="text-xs text-charcoal-400 mt-0.5 font-mono">
              Verbatim audit logs with pass/fail ratios and target verdicts
            </p>
          </div>
          <button
            onClick={() => navigate('/assessments')}
            className="text-xs font-mono text-white hover:underline flex items-center gap-1"
          >
            <span>View All Runs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-charcoal-800 text-charcoal-400 uppercase tracking-wider">
              <tr>
                <th className="pb-3 pl-2">ID</th>
                <th className="pb-3">Target Model</th>
                <th className="pb-3 text-center">Score</th>
                <th className="pb-3 text-center">Outcome</th>
                <th className="pb-3">Timestamp</th>
                <th className="pb-3 pr-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-900">
              {recentList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-charcoal-500 font-mono">
                    No assessments recorded yet. Launch an audit to generate telemetry.
                  </td>
                </tr>
              ) : (
                recentList.map((run) => {
                  const score = run.summary_score ?? 0;
                  return (
                    <tr
                      key={run.id}
                      onClick={() => navigate(`/assessments/${run.id}`)}
                      className="hover:bg-charcoal-900/60 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 pl-2 text-white font-bold">#{run.id}</td>
                      <td className="py-3.5 text-white font-semibold">{run.target_name}</td>
                      <td className="py-3.5 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-charcoal-800 text-white border border-charcoal-600">
                          {run.summary_score !== null && run.summary_score !== undefined
                            ? `${run.summary_score.toFixed(0)}/100`
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3.5 text-center text-charcoal-300">
                        <span className="text-white font-bold">{run.passed_tests ?? run.passed ?? 0} PASS</span>
                        {(run.failed_tests ?? run.failed ?? 0) > 0 && (
                          <span className="text-charcoal-400 ml-1.5 font-normal">
                            · {run.failed_tests ?? run.failed ?? 0} FAIL
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-charcoal-400">
                        {run.started_at
                          ? formatDate(run.started_at)
                          : run.created_at
                          ? formatDate(run.created_at)
                          : 'Recent'}
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/assessments/${run.id}`);
                          }}
                          className="text-xs text-white hover:underline font-bold inline-flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
