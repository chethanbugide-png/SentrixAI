import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  ShieldCheck,
  ArrowRight,
  Code,
} from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StatusBadge from '../components/ui/StatusBadge';
import { getAssessments, downloadReportPdf, getReport } from '../services/api';
import type { AssessmentSummary } from '../types';
import { formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAssessments();
        setAssessments(data);
      } catch (err: any) {
        toast.error('Failed to load assessments', err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDownloadPdf = async (id: number | string) => {
    setDownloadingId(id);
    toast.info('Compiling Audit Dossier...', 'Generating formal PDF report');
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
      toast.success('Dossier Ready', `Exported sentrix_assessment_${id}_report.pdf`);
    } catch (err: any) {
      toast.error('Download Failed', err.message || 'Report compilation error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadJson = async (id: number | string) => {
    try {
      const data = await getReport(id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sentrix_assessment_${id}_report.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('JSON Exported', `Saved machine-readable report for Assessment #${id}`);
    } catch (err: any) {
      toast.error('Export Failed', err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-mono">
          Audit & Compliance Reports
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-300 mt-1">
          Export auditor-grade PDF security dossiers and machine-readable JSON telemetry.
        </p>
      </div>

      {/* Methodology Card */}
      <div className="p-5 rounded-xl bg-stark-950 border border-charcoal-800 space-y-2 font-mono">
        <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-white" />
          <span>Verification Methodology</span>
        </div>
        <p className="text-xs text-charcoal-300 leading-relaxed font-sans">
          SENTRIX AI assessments strictly follow deterministic detector criteria mapped against OWASP Top 10 for LLMs and MITRE ATLAS. 
          Every finding includes verbatim prompt telemetry, raw responses, confidence scores, and reproducible parameters.
        </p>
      </div>

      {/* Reports List */}
      <div className="space-y-3 font-mono">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Historical Assessment Dossiers</h2>

        {loading ? (
          <LoadingSpinner size="lg" label="Loading audit dossiers..." />
        ) : assessments.length === 0 ? (
          <div className="p-8 rounded-xl bg-stark-950 border border-charcoal-800 text-center text-xs text-charcoal-400">
            No assessments completed yet. Launch a scan to generate compliance reports.
          </div>
        ) : (
          <div className="space-y-3">
            {assessments.map((a) => (
              <div
                key={a.id}
                className="p-5 rounded-xl bg-stark-950 border border-charcoal-800 hover:border-charcoal-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-white">
                      {a.target_name || 'AI Target'}
                    </span>
                    <span className="text-xs font-mono text-charcoal-400">RUN #{a.id}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-charcoal-400 font-mono">
                    <span>{a.started_at ? formatDate(a.started_at) : 'Recent'}</span>
                    <span>·</span>
                    <span className="text-white font-bold">
                      SCORE: {a.summary_score !== null ? `${Math.round(a.summary_score)}/100` : 'N/A'}
                    </span>
                    <span>·</span>
                    <span>{a.total_tests} vectors</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <button
                    onClick={() => handleDownloadJson(a.id)}
                    className="pro-button-secondary px-3 py-1.5 flex items-center gap-1.5"
                    title="Export raw JSON"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>
                  <button
                    onClick={() => handleDownloadPdf(a.id)}
                    disabled={downloadingId === a.id}
                    className="pro-button-primary px-3.5 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingId === a.id ? 'COMPILING...' : 'PDF REPORT'}</span>
                  </button>
                  <button
                    onClick={() => navigate(`/assessments/${a.id}`)}
                    className="p-1.5 rounded-lg text-charcoal-400 hover:text-white transition"
                    title="Inspect run"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
