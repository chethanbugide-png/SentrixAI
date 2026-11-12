import React, { useEffect, useState } from 'react';
import {
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Download,
  ShieldAlert,
} from 'lucide-react';
import SeverityBadge from '../components/ui/SeverityBadge';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { getFindings, updateFinding, retestFinding } from '../services/api';
import type { Finding, FindingStatus } from '../types';
import { getCategoryLabel, formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

export const Findings: React.FC = () => {
  const toast = useToast();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<number | string | null>(null);
  const [retestingId, setRetestingId] = useState<number | string | null>(null);

  const fetchFindings = async () => {
    setLoading(true);
    try {
      const data = await getFindings();
      setFindings(data);
    } catch (err: any) {
      toast.error('Failed to load findings', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, []);

  const handleStatusChange = async (id: number | string, newStatus: FindingStatus) => {
    try {
      await updateFinding(id, { status: newStatus });
      setFindings((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
      );
      toast.success(
        'Status Updated',
        `Finding #${id} moved to ${newStatus.toUpperCase()}`
      );
    } catch (err: any) {
      toast.error('Update Failed', err.message);
    }
  };

  const handleRetest = async (e: React.MouseEvent, finding: Finding) => {
    e.stopPropagation();
    setRetestingId(finding.id);
    toast.info('Firing Retest Probe...', `Testing vector against live model`);

    try {
      const res = await retestFinding(finding.id);
      if (res.retest_passed) {
        setFindings((prev) =>
          prev.map((f) => (f.id === finding.id ? { ...f, status: 'resolved' } : f))
        );
        toast.success(
          'Verification Passed',
          `${res.target_name} deflected the exploit in ${res.latency_ms}ms.`
        );
      } else {
        toast.warning(
          'Vulnerability Active',
          `${res.target_name} bypassed defense in ${res.latency_ms}ms.`
        );
      }
    } catch (err: any) {
      toast.error('Retest Failed', err.message);
    } finally {
      setRetestingId(null);
    }
  };

  const exportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(findings, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `sentrix-findings-${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
    toast.success('Registry Exported', 'Downloaded findings JSON');
  };

  const filtered = findings.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      (f.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.category || '').toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || f.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const criticalCount = findings.filter((f) => f.severity === 'critical').length;
  const highCount = findings.filter((f) => f.severity === 'high').length;
  const openCount = findings.filter((f) => f.status === 'open').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 font-mono">
            <ShieldAlert className="w-6 h-6 text-white" />
            Vulnerabilities & Findings
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-300 mt-1">
            Confirmed evidence-backed security flaws with 1-click live verification retesting.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto font-mono text-xs">
          <button
            onClick={exportJson}
            className="pro-button-secondary px-3.5 py-1.5 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={fetchFindings}
            className="p-2 rounded-lg bg-stark-950 border border-charcoal-800 text-charcoal-400 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="bg-stark-950 border border-charcoal-800 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase text-charcoal-400 font-semibold">Total Registry</p>
            <p className="text-xl font-bold text-white mt-0.5">{findings.length}</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#fff]" />
        </div>
        <div className="bg-stark-950 border border-charcoal-800 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase text-white font-semibold">Critical Flaws</p>
            <p className="text-xl font-bold text-white mt-0.5">{criticalCount}</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        </div>
        <div className="bg-stark-950 border border-charcoal-800 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase text-charcoal-300 font-semibold">High Severity</p>
            <p className="text-xl font-bold text-charcoal-200 mt-0.5">{highCount}</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-charcoal-400" />
        </div>
        <div className="bg-stark-950 border border-charcoal-800 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase text-charcoal-400 font-semibold">Open Triage</p>
            <p className="text-xl font-bold text-charcoal-300 mt-0.5">{openCount}</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-charcoal-600" />
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-charcoal-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search findings, title, category..."
            className="w-full bg-stark-950 border border-charcoal-800 rounded-lg pl-9 pr-4 py-2 text-white placeholder-charcoal-500 focus:outline-none focus:border-white transition-colors"
          />
        </div>

        <div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full bg-stark-950 border border-charcoal-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white"
          >
            <option value="all">ALL SEVERITIES</option>
            <option value="critical">CRITICAL ONLY</option>
            <option value="high">HIGH SEVERITY</option>
            <option value="medium">MEDIUM SEVERITY</option>
            <option value="low">LOW SEVERITY</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-stark-950 border border-charcoal-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white"
          >
            <option value="all">ALL STATUSES</option>
            <option value="open">OPEN</option>
            <option value="acknowledged">ACKNOWLEDGED</option>
            <option value="resolved">RESOLVED</option>
            <option value="false_positive">FALSE POSITIVE</option>
          </select>
        </div>
      </div>

      {/* Findings List */}
      {loading ? (
        <LoadingSpinner size="lg" label="Loading vulnerabilities registry..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="No findings match filter"
          description="Adjust your search criteria or execute a new assessment."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => {
            const isExpanded = expandedId === f.id;
            const isRetestingThis = retestingId === f.id;

            return (
              <div
                key={f.id}
                className="bg-stark-950 border border-charcoal-800 hover:border-charcoal-600 rounded-xl overflow-hidden transition-all shadow-sm"
              >
                <div
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                  onClick={() => setExpandedId(isExpanded ? null : f.id)}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 shrink-0">
                      <SeverityBadge severity={f.severity} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{f.title}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-charcoal-400 mt-1">
                        <span className="text-white font-bold">{getCategoryLabel(f.category)}</span>
                        <span>·</span>
                        <span>RUN #{f.assessment_id}</span>
                        <span>·</span>
                        <span>{formatDate(f.created_at || '')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center font-mono">
                    {/* Live Retest Button */}
                    <button
                      onClick={(e) => handleRetest(e, f)}
                      disabled={isRetestingThis}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold uppercase border transition-all ${
                        isRetestingThis
                          ? 'bg-charcoal-800 text-white border-white cursor-wait'
                          : 'bg-white hover:bg-charcoal-200 text-black border-white'
                      }`}
                    >
                      <RotateCw className={`w-3 h-3 ${isRetestingThis ? 'animate-spin' : ''}`} />
                      <span>{isRetestingThis ? 'PROBING...' : 'RETEST'}</span>
                    </button>

                    <StatusBadge status={f.status} />
                    <button className="p-1 rounded text-charcoal-400 hover:text-white">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-5 border-t border-charcoal-800 bg-black space-y-4 text-xs font-mono">
                    <div>
                      <span className="text-charcoal-400 font-bold block mb-1">
                        FINDING DESCRIPTION:
                      </span>
                      <p className="text-charcoal-200 leading-relaxed font-sans">
                        {f.description}
                      </p>
                    </div>

                    {f.evidence && (
                      <div>
                        <span className="text-white font-bold block mb-1">
                          EMPIRICAL DETECTOR EVIDENCE:
                        </span>
                        <div className="p-3.5 rounded-lg bg-stark-950 border border-charcoal-800 text-white font-mono text-xs whitespace-pre-wrap leading-relaxed">
                          {f.evidence}
                        </div>
                      </div>
                    )}

                    {f.remediation && (
                      <div>
                        <span className="text-charcoal-300 font-bold block mb-1">
                          RECOMMENDED REMEDIATION:
                        </span>
                        <div className="p-3.5 rounded-lg bg-charcoal-900 border border-charcoal-700 text-charcoal-100 leading-relaxed font-sans">
                          {f.remediation}
                        </div>
                      </div>
                    )}

                    {/* Status Update Actions */}
                    <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-charcoal-800 font-mono">
                      <span className="text-charcoal-400 text-xs">TRIAGE WORKFLOW:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStatusChange(f.id, 'acknowledged')}
                          className="px-3 py-1 rounded bg-charcoal-800 hover:bg-charcoal-700 text-white text-xs border border-charcoal-600 transition"
                        >
                          ACKNOWLEDGE
                        </button>
                        <button
                          onClick={() => handleStatusChange(f.id, 'resolved')}
                          className="px-3 py-1 rounded bg-white hover:bg-charcoal-200 text-black text-xs font-bold transition"
                        >
                          MARK RESOLVED
                        </button>
                        <button
                          onClick={() => handleStatusChange(f.id, 'false_positive')}
                          className="px-3 py-1 rounded bg-charcoal-900 hover:bg-charcoal-800 text-charcoal-300 text-xs border border-charcoal-700 transition"
                        >
                          FALSE POSITIVE
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Findings;
