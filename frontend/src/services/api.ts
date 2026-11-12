import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type {
  DashboardStats,
  Target,
  CreateTargetRequest,
  AssessmentSummary,
  Assessment,
  CreateAssessmentRequest,
  Finding,
  UpdateFindingRequest,
  Report,
  HealthCheck,
} from '../types';

const API_BASE = 'http://localhost:8000';

const client: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// ---- Health ----
export const checkHealth = async (): Promise<HealthCheck> => {
  const res: AxiosResponse<HealthCheck> = await client.get('/api/health');
  return res.data;
};

// ---- Dashboard ----
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const res: AxiosResponse<DashboardStats> = await client.get('/api/dashboard/stats');
  return res.data;
};

// ---- Targets ----
export const getTargets = async (): Promise<Target[]> => {
  const res: AxiosResponse<Target[]> = await client.get('/api/targets');
  return res.data;
};

export const getTarget = async (id: number | string): Promise<Target> => {
  const res: AxiosResponse<Target> = await client.get(`/api/targets/${id}`);
  return res.data;
};

export const createTarget = async (data: CreateTargetRequest): Promise<Target> => {
  const res: AxiosResponse<Target> = await client.post('/api/targets', data);
  return res.data;
};

export const updateTarget = async (id: number | string, data: Partial<CreateTargetRequest>): Promise<Target> => {
  const res: AxiosResponse<Target> = await client.put(`/api/targets/${id}`, data);
  return res.data;
};

export const deleteTarget = async (id: number | string): Promise<void> => {
  await client.delete(`/api/targets/${id}`);
};

// ---- Assessments ----
export const getAssessments = async (): Promise<AssessmentSummary[]> => {
  const res: AxiosResponse<AssessmentSummary[]> = await client.get('/api/assessments');
  return res.data;
};

export const getAssessment = async (id: number | string): Promise<Assessment> => {
  const res: AxiosResponse<Assessment> = await client.get(`/api/assessments/${id}`);
  return res.data;
};

export const getAssessmentResults = async (id: number | string): Promise<any[]> => {
  const res: AxiosResponse<any[]> = await client.get(`/api/assessments/${id}/results`);
  return res.data;
};

export const createAssessment = async (data: CreateAssessmentRequest): Promise<AssessmentSummary> => {
  const res: AxiosResponse<AssessmentSummary> = await client.post('/api/assessments', data);
  return res.data;
};

export const compareAssessments = async (aId: number | string, bId: number | string): Promise<any> => {
  const res = await client.get(`/api/assessments/${aId}/compare/${bId}`);
  return res.data;
};

// ---- Findings ----
export const getFindings = async (params?: {
  category?: string;
  severity?: string;
  status?: string;
}): Promise<Finding[]> => {
  const res: AxiosResponse<Finding[]> = await client.get('/api/findings', { params });
  return res.data;
};

export const getFinding = async (id: number | string): Promise<Finding> => {
  const res: AxiosResponse<Finding> = await client.get(`/api/findings/${id}`);
  return res.data;
};

export const updateFinding = async (id: number | string, data: UpdateFindingRequest): Promise<Finding> => {
  const res: AxiosResponse<Finding> = await client.patch(`/api/findings/${id}`, data);
  return res.data;
};

export const retestFinding = async (findingId: number | string): Promise<{
  finding_id: number;
  target_name: string;
  previous_status: string;
  new_status: string;
  retest_passed: boolean;
  latency_ms: number;
  model_response: string;
  evidence: string;
  details: string;
}> => {
  const res = await client.post(`/api/findings/${findingId}/retest`);
  return res.data;
};

// ---- Reports ----
export const getReport = async (assessmentId: number | string): Promise<Report> => {
  const res: AxiosResponse<Report> = await client.get(`/api/assessments/${assessmentId}/report`, {
    params: { format: 'json' },
  });
  return res.data;
};

export const downloadReportPdf = async (assessmentId: number | string): Promise<Blob> => {
  const res = await client.get(`/api/assessments/${assessmentId}/report`, {
    params: { format: 'pdf' },
    responseType: 'blob',
  });
  return res.data;
};

// ---- Playground / Red-Teaming Studio ----
export const executeProbe = async (payload: {
  target_id?: number;
  target_type?: string;
  prompt: string;
  category?: string;
  system_prompt?: string;
  endpoint?: string;
  api_key?: string;
}): Promise<any> => {
  const res = await client.post('/api/playground/probe', payload);
  return res.data;
};

export const executeMutation = async (payload: {
  objective: string;
  target_type?: string;
  iterations?: number;
}): Promise<any> => {
  const res = await client.post('/api/playground/mutate', payload);
  return res.data;
};

// ---- Threat Matrix ----
export const getThreatMatrix = async (): Promise<any> => {
  const res = await client.get('/api/matrix/overview');
  return res.data;
};

// ---- Target Connectivity & Auto-Discovery ----
export const pingTarget = async (id: number | string): Promise<{
  target_id: number;
  name: string;
  target_type: string;
  is_online: boolean;
  latency_ms: number;
  details: string;
  status_code?: number;
  banner?: string;
}> => {
  const res = await client.post(`/api/targets/${id}/ping`);
  return res.data;
};

export const detectLocalModels = async (): Promise<{
  discovered: Array<{
    engine: string;
    endpoint: string;
    status: string;
    models: string[];
    recommended_type: string;
  }>;
  total_found: number;
}> => {
  const res = await client.get('/api/targets/detect-local');
  return res.data;
};

// ---- Automated Remediation & Hotfix Workshop ----
export const generatePatch = async (payload: {
  finding_id?: number;
  category: string;
  title?: string;
  evidence?: string;
  original_system_prompt?: string;
}): Promise<{
  category: string;
  vulnerability_title: string;
  remediation_summary: string;
  original_prompt: string;
  hardened_prompt: string;
  diff: Array<{ type: 'add' | 'del' | 'same'; line: string }>;
  python_guardrail_code: string;
  defense_strategy: string;
  security_headers: Record<string, string>;
}> => {
  const res = await client.post('/api/remediation/generate-patch', payload);
  return res.data;
};

export const verifyPatch = async (payload: {
  category: string;
  adversarial_prompt: string;
  original_status?: string;
  hardened_system_prompt?: string;
}): Promise<{
  original_status: string;
  patched_status: string;
  remediation_verified: boolean;
  mitigation_latency_ms: number;
  defense_stage: string;
  sanitized_response: string;
  evidence: string;
  security_delta: string;
}> => {
  const res = await client.post('/api/remediation/verify-patch', payload);
  return res.data;
};

// ---- Sentrix Tactical Terminal (CLI) ----
export const executeCliCommand = async (command: string): Promise<{
  command: string;
  output: string;
  status: 'success' | 'error';
  data?: Record<string, any>;
}> => {
  const res = await client.post('/api/cli/execute', { command });
  return res.data;
};

export default client;
