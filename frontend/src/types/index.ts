// =============================
// SENTRIX AI - Type Definitions
// =============================

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'none';

export type AssessmentStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type TestStatus = 'passed' | 'failed' | 'inconclusive' | 'skipped' | 'error';

export type FindingStatus = 'open' | 'acknowledged' | 'resolved' | 'false_positive';

export type TargetType = 'simulated' | 'simulated_vulnerable' | 'simulated_protected' | 'http_api' | 'local_model';

export type TestCategory =
  | 'prompt_injection'
  | 'secret_exposure'
  | 'data_exposure'
  | 'hallucination'
  | 'compliance'
  | 'unsafe_output'
  | 'robustness'
  | string;

export type ReportFormat = 'json' | 'pdf';

// ---- Dashboard ----
export interface DashboardStats {
  total_targets: number;
  total_assessments: number;
  total_findings: number;
  total_vulnerabilities?: number;
  high_severity_findings: number;
  critical_findings: number;
  security_score?: number;
  severity_breakdown?: SeverityBreakdown;
  category_distribution?: Record<string, number>;
  category_scores?: CategoryScore[];
  risk_trend: RiskTrendPoint[];
  recent_assessments: AssessmentSummary[];
  pass_rate?: number;
  fail_rate?: number;
}

export interface SeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface CategoryScore {
  category: TestCategory;
  score: number;
  total_tests: number;
  passed: number;
  failed: number;
}

export interface RiskTrendPoint {
  id?: number;
  date?: string;
  score: number;
  vulnerabilities?: number;
}

// ---- Targets ----
export interface Target {
  id: number | string;
  name: string;
  description?: string;
  target_type: string;
  type?: string;
  endpoint?: string;
  config_json?: string;
  config?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
  last_assessment_at?: string;
  finding_count?: number;
  is_active?: boolean;
}

export interface CreateTargetRequest {
  name: string;
  description?: string;
  target_type: string;
  endpoint?: string;
  config_json?: string;
}

// ---- Assessments ----
export interface AssessmentSummary {
  id: number | string;
  target_id: number | string;
  target_name?: string;
  status: AssessmentStatus;
  summary_score?: number | null;
  score?: number;
  total_tests: number;
  passed_tests?: number;
  passed?: number;
  failed_tests?: number;
  failed?: number;
  inconclusive_tests?: number;
  inconclusive?: number;
  error_tests?: number;
  errors?: number;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  test_profile?: string;
  profile?: string;
  categories?: string | string[];
}

export interface Assessment extends AssessmentSummary {
  test_results?: TestResult[];
  results?: TestResult[];
  findings?: Finding[];
  category_breakdown?: CategoryScore[];
}

export interface TestResult {
  id: number | string;
  assessment_id?: number | string;
  test_case_id?: string;
  test_name?: string;
  name?: string;
  category: TestCategory;
  input_prompt?: string;
  response?: string;
  status: TestStatus;
  severity: Severity;
  confidence: number;
  evidence: string;
  description?: string;
  remediation?: string;
  latency_ms?: number;
  duration_ms?: number;
  created_at?: string;
}

export interface CreateAssessmentRequest {
  target_id: number | string;
  test_profile?: string;
  categories?: string[];
}

// ---- Findings ----
export interface Finding {
  id: number | string;
  assessment_id: number | string;
  target_id?: number | string;
  target_name?: string;
  title: string;
  description?: string;
  category: TestCategory;
  severity: Severity;
  status: FindingStatus;
  evidence?: string;
  remediation?: string;
  confidence?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateFindingRequest {
  status: FindingStatus;
}

// ---- Reports ----
export interface Report {
  report: {
    generated_by: string;
    version: string;
    target: string;
    assessment: AssessmentSummary;
    findings: Finding[];
    test_results: TestResult[];
    methodology: string;
    limitations: string;
  };
}

export interface HealthCheck {
  status: string;
  version: string;
  uptime_seconds?: number;
  uptime?: number;
  database?: string;
}

// ---- UI Helpers ----
export const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

export const CATEGORY_LABELS: Record<string, string> = {
  prompt_injection: 'Prompt Injection',
  secret_exposure: 'Secret Exposure',
  data_exposure: 'Data Exposure',
  hallucination: 'Hallucination',
  compliance: 'Compliance',
  unsafe_output: 'Unsafe Output',
  robustness: 'Robustness',
};

export const TARGET_TYPE_LABELS: Record<string, string> = {
  simulated: '🤖 Simulated',
  simulated_vulnerable: '🤖 Simulated (Vulnerable)',
  simulated_protected: '🛡️ Simulated (Protected)',
  http_api: '🌐 HTTP API',
  local_model: '💻 Local Model',
};

export const STATUS_LABELS: Record<AssessmentStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};
