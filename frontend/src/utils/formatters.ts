import type { Severity, AssessmentStatus, TestStatus } from '../types';

export const formatPercent = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '0%';
  return `${Math.round(val)}%`;
};

export const formatScore = (score: number | null | undefined): string => {
  if (score === null || score === undefined || isNaN(score)) return 'N/A';
  return Math.round(score).toString();
};

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const formatDuration = (seconds: number | null | undefined): string => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
};

export const getScoreColor = (score: number | null | undefined): string => {
  if (score === null || score === undefined || isNaN(score)) return '#6e6e78';
  if (score >= 80) return '#ffffff';
  if (score >= 60) return '#c4c4cf';
  return '#9898a4';
};

export const getScoreCategory = (score: number | null | undefined): string => {
  if (score === null || score === undefined || isNaN(score)) return 'Unknown';
  if (score >= 80) return 'Resilient';
  if (score >= 60) return 'Moderate';
  return 'Vulnerable';
};

export const getSeverityColor = (severity: Severity): string => {
  const colors: Record<Severity, string> = {
    critical: '#ffffff',
    high: '#c4c4cf',
    medium: '#9898a4',
    low: '#6e6e78',
    info: '#555560',
    none: '#323238',
  };
  return colors[severity] || '#6e6e78';
};

export const getStatusColor = (status: AssessmentStatus): string => {
  const colors: Record<AssessmentStatus, string> = {
    pending: '#6e6e78',
    running: '#ffffff',
    completed: '#e4e4eb',
    failed: '#9898a4',
    cancelled: '#555560',
  };
  return colors[status] || '#6e6e78';
};

export const getTestStatusColor = (status: TestStatus): string => {
  const colors: Record<TestStatus, string> = {
    passed: '#ffffff',
    failed: '#9898a4',
    inconclusive: '#6e6e78',
    skipped: '#45454d',
    error: '#555560',
  };
  return colors[status] || '#6e6e78';
};

export const getCategoryLabel = (cat: string): string => {
  const map: Record<string, string> = {
    prompt_injection: 'Prompt Injection',
    secret_exposure: 'Sensitive Data Exposure',
    data_exposure: 'Data Exposure',
    hallucination: 'Hallucination & Reliability',
    compliance: 'Instruction Compliance',
    unsafe_output: 'Unsafe Output Handling',
    robustness: 'Robustness & Perturbation',
  };
  return map[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};
