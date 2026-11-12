# SENTRIX AI
### Intelligent AI Vulnerability Discovery & Assessment Platform
*Version 1.0 | Research-Grade LLM Security Testing Platform*

---

## 🛡️ Executive Overview

**SENTRIX AI** is an automated security, reliability, and instruction-following assessment platform for authorized Large Language Model (LLM) applications. Built according to empirical testing standards inspired by OWASP Top 10 for LLM Applications and NIST AI Risk Management Framework, it tests defined requirements systematically, captures verbatim model responses as cryptographic evidence, detects failures through deterministic and heuristic classifiers, prioritizes risk, and facilitates iterative remediation regression cycles.

---

## 🏛️ Architecture & System Design

```
sentrix-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI daemon with CORS and startup lifecycle
│   │   ├── config.py                # Environment and path configurations
│   │   ├── database/
│   │   │   ├── connection.py        # SQLAlchemy engine & session maker
│   │   │   ├── models.py            # ORM tables: Target, Assessment, TestResult, Finding
│   │   │   └── seed.py              # Automated seed database on startup
│   │   ├── adapters/
│   │   │   ├── base.py              # Abstract Target Adapter base class
│   │   │   ├── simulated.py         # Dual-mode Simulator (Vulnerable & Hardened)
│   │   │   └── http_adapter.py      # HTTP REST API target adapter with timeout & size limits
│   │   ├── detectors/
│   │   │   ├── secret_exposure.py   # Synthetic secret extraction detector
│   │   │   ├── prompt_injection.py  # System prompt override & jailbreak detector
│   │   │   ├── hallucination.py     # Fabrication, citation, and unanswerable checks
│   │   │   ├── compliance.py        # JSON schema, list format, brevity validator
│   │   │   ├── unsafe_output.py     # Harmful exploit and discriminatory filter
│   │   │   └── robustness.py        # Paraphrase consistency and numeric stability
│   │   ├── engine/
│   │   │   ├── runner.py            # Orchestrator running probes against target
│   │   │   ├── test_loader.py       # JSON test suite loader and category filter
│   │   │   └── scorer.py            # S = 100 × (Σ w_i × f_i) / (Σ w_i) risk formula
│   │   ├── reports/
│   │   │   └── pdf_generator.py     # Auditor-ready PDF report builder via ReportLab
│   │   └── api/
│   │       ├── health.py            # /api/health
│   │       ├── dashboard.py         # /api/dashboard/stats
│   │       ├── targets.py           # /api/targets CRUD
│   │       ├── assessments.py       # /api/assessments run, list, detail, diff
│   │       ├── findings.py          # /api/findings query & status workflow
│   │       └── reports.py           # /api/assessments/{id}/report (PDF/JSON)
│   ├── test_cases/
│   │   └── default_suite.json       # 24+ comprehensive structured test cases
│   ├── tests/
│   │   └── test_assessment.py       # Pytest unit and integration test suite
│   ├── run.py                       # CLI entry point for backend
│   └── requirements.txt
│
└── frontend/                        # Cyber Command Center Dashboard
    ├── src/
    │   ├── components/
    │   │   ├── layout/ (Sidebar, Header, AppLayout)
    │   │   ├── ui/ (SecurityGauge, StatCard, Badges, Modals, Spinners)
    │   │   ├── charts/ (CategoryRadar, RiskTrend, SeverityDist, PassFail)
    │   │   └── assessment/ (TestResultRow, RunningAnimation, CompareView)
    │   ├── pages/
    │   │   ├── Dashboard.tsx        # Command center with SVG gauges & radar telemetry
    │   │   ├── Targets.tsx          # Target registration & adapter management
    │   │   ├── Assessments.tsx      # Assessment history & comparative differential analysis
    │   │   ├── AssessmentDetail.tsx # Deep-dive into raw probe inputs, responses & evidence
    │   │   ├── NewAssessment.tsx    # 3-step launch wizard with animated cyber console
    │   │   ├── Findings.tsx         # Vulnerability registry with remediation triage
    │   │   └── Reports.tsx          # PDF dossier & JSON compliance exports
    │   └── services/api.ts          # Axios API gateway to FastAPI daemon
    ├── package.json
    └── vite.config.ts
```

---

## 🔬 Core Vulnerability Vectors & Detectors

| Vector | Objective | Detection Methodology |
|---|---|---|
| **Prompt Injection** | Test if untrusted input can override system prompt or alter model persona | Pattern and indicator scoring (`expected_absent`, role adherence, compliance checks) |
| **Data Exposure** | Test if protected secrets leak under direct or social engineering queries | Exact and fragment search for synthetic credentials (`SENTRIX-DEMO-SECRET-4821`) |
| **Hallucination** | Test if model invents false facts, citations, or answers unanswerable queries | Ground-truth reference matching, citation validation, and uncertainty calibration |
| **Compliance** | Test adherence to machine contracts (JSON schema, fields, brevity) | Deterministic parser validation, schema verification, and length bounds |
| **Unsafe Output** | Test resistance against generating exploit code or discriminatory output | Harmful pattern matching, exploit instructions detection, and safety bypass checks |
| **Robustness** | Test consistency under semantic paraphrasing and input variations | Sequence similarity ratio, keyword preservation, and numeric invariant tracking |

---

## ⚡ Quick Start

### 1. Launch the Backend (FastAPI)
```powershell
cd "d:\New folder\SentrixAI\backend"
python run.py
```
* Backend runs on: `http://127.0.0.1:8000`
* Swagger Interactive API Docs: `http://127.0.0.1:8000/docs`

### 2. Launch the Frontend (Vite + React)
```powershell
cd "d:\New folder\SentrixAI\frontend"
npm run dev
```
* Command Center UI runs on: `http://localhost:5173`

---

## 🧪 Running Automated Tests
```powershell
cd "d:\New folder\SentrixAI\backend"
pytest
```
* All 6 core detector and scoring tests execute in < 1 second.
