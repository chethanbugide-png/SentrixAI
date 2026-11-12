"""Generate a comprehensive architecture and engineering PDF report for SENTRIX AI."""

import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

PDF_OUTPUT_PATH = r"d:\New folder\SentrixAI\SENTRIX_AI_Comprehensive_Architecture_Guide.pdf"

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and print 'Page X of Y'."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Do not print header/footer on cover page if page == 1
        if self._pageNumber > 1:
            # Header
            self.drawString(54, 750, "SENTRIX AI — Architecture, Machine Learning & Technical Guide")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)

            # Footer
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 45, 558, 45)
            self.drawString(54, 32, "CONFIDENTIAL & PROPRIETARY — FOR TECHNICAL AND AUDIT REVIEW")
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(558, 32, page_text)

        self.restoreState()


def create_pdf(filepath):
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#0f172a") # Slate 900
    brand_blue = colors.HexColor("#2563eb")    # Blue 600
    brand_indigo = colors.HexColor("#4f46e5")  # Indigo 600
    accent_emerald = colors.HexColor("#059669")
    dark_gray = colors.HexColor("#334155")
    light_bg = colors.HexColor("#f8fafc")

    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=26,
        leading=32,
        textColor=primary_color,
    )
    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=18,
        textColor=brand_indigo,
    )
    h1_style = ParagraphStyle(
        "Heading1_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=22,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=6,
    )
    h2_style = ParagraphStyle(
        "Heading2_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=brand_blue,
        spaceBefore=10,
        spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "Body_Custom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14.5,
        textColor=dark_gray,
        spaceAfter=6,
    )
    bullet_style = ParagraphStyle(
        "Bullet_Custom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13.5,
        textColor=dark_gray,
        leftIndent=14,
        spaceAfter=3,
    )
    code_style = ParagraphStyle(
        "Code_Custom",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#1e293b"),
    )
    table_cell = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=dark_gray,
    )
    table_header = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=12,
        textColor=colors.white,
    )

    story = []

    # =========================================================================
    # COVER / TITLE BLOCK
    # =========================================================================
    story.append(Spacer(1, 20))
    story.append(Paragraph("SENTRIX AI", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>End-to-End System Architecture, Machine Learning Connection & Comprehensive Platform Specification</b>", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=brand_indigo, spaceBefore=4, spaceAfter=14))

    meta_text = (
        "<b>Document Version:</b> 1.0.0 &nbsp;&nbsp;|&nbsp;&nbsp; "
        "<b>Classification:</b> Technical Dossier &nbsp;&nbsp;|&nbsp;&nbsp; "
        "<b>Platform:</b> Full-Stack Python/FastAPI + React/TypeScript + AI/ML Engine"
    )
    story.append(Paragraph(meta_text, body_style))
    story.append(Spacer(1, 12))

    # Executive Summary Card
    exec_summary_html = (
        "<b>EXECUTIVE OVERVIEW:</b><br/>"
        "SENTRIX AI is an enterprise-grade automated security testing and empirical vulnerability discovery platform "
        "built specifically for Large Language Models (LLMs) and generative artificial intelligence systems. "
        "As organizations increasingly deploy AI models into production (customer support chatbots, internal copilot tools, "
        "autonomous agents, and data retrieval pipelines), they face severe emerging security threats: prompt injections, "
        "canary token leakage, model hallucinations (slopsquatting), automated jailbreaks, and sensitive data exfiltration. "
        "SENTRIX AI provides an empirical, automated, and continuous verification boundary that rigorously attacks, stress-tests, "
        "scores, and remediates AI model endpoints against the <b>OWASP Top 10 for LLMs (2025)</b> and the <b>MITRE ATLAS</b> framework."
    )
    summary_table = Table(
        [[Paragraph(exec_summary_html, body_style)]],
        colWidths=[504],
    )
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ("PADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 1: HOW THE PLATFORM CONNECTS TO MACHINE LEARNING & AI
    # =========================================================================
    story.append(Paragraph("1. How SENTRIX AI Connects to Machine Learning & AI Models", h1_style))
    story.append(Paragraph(
        "SENTRIX AI does not treat machine learning models as opaque black-box APIs. Instead, it interacts directly with the "
        "neural and probabilistic nature of modern LLMs through multiple dedicated adapters, feedback loops, and token-level heuristics:",
        body_style
    ))

    ml_points = [
        ("<b>Universal Model Adapter Architecture:</b> Connects to any standard ML inference runtime, including local "
         "quantized inference servers (Ollama, LM Studio, vLLM, llama.cpp) on local ports (<code>11434</code>, <code>1234</code>) "
         "as well as enterprise cloud LLMs (OpenAI, Anthropic, Google Gemini, Azure AI Studio) and proprietary in-house model endpoints."),
        ("<b>Adversarial Perturbation & Shannon Entropy Analysis:</b> Analyzes the randomness and distribution of generated token sequences. "
         "Prompt injection and automated obfuscation attacks frequently rely on homoglyphs (Cyrillic character substitution), "
         "zero-width space cloaking, and high-entropy base64 strings to slip past conventional regex filters."),
        ("<b>Empirical Threat Simulation (Vulnerable vs. Hardened Weights):</b> Ships with deterministic simulation targets that replicate "
         "how instruction-tuned model weights behave under zero-shot attack vectors versus when guarded with system boundary instructions."),
        ("<b>Feedback-Driven Autonomous Red-Teaming (AutoDAN & Crescendo):</b> Generates multi-turn adversarial mutations. "
         "By querying the model iteratively, measuring failure distances, and altering prompt syntax across generations, "
         "the mutation engine autonomously discovers semantic boundary degradation in target models."),
    ]
    for pt in ml_points:
        story.append(Paragraph(f"• {pt}", bullet_style))

    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 2: COMPLETE TECHNOLOGY STACK
    # =========================================================================
    story.append(Paragraph("2. Complete Full-Stack Technology Breakdown", h1_style))
    story.append(Paragraph(
        "Every layer of SENTRIX AI is designed for high reliability, deterministic evaluation, and modern SaaS aesthetics:",
        body_style
    ))

    stack_data = [
        [Paragraph("<b>Component Layer</b>", table_header), Paragraph("<b>Technologies Used</b>", table_header), Paragraph("<b>Engineering Purpose & Architecture</b>", table_header)],
        [
            Paragraph("<b>Frontend Web Application</b>", table_cell),
            Paragraph("React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts", table_cell),
            Paragraph("Ultra-responsive Single-Page Application (SPA) with dark modern theme, glassmorphic HUD cards, interactive telemetry, and zero audio/lag overhead.", table_cell)
        ],
        [
            Paragraph("<b>Backend REST API</b>", table_cell),
            Paragraph("Python 3.14+, FastAPI, Uvicorn (ASGI), Pydantic v2", table_cell),
            Paragraph("Asynchronous, high-throughput API gateway providing 10+ REST endpoints for target management, test orchestration, and real-time probe telemetry.", table_cell)
        ],
        [
            Paragraph("<b>Database & Persistence</b>", table_cell),
            Paragraph("SQLAlchemy 2.0 ORM, SQLite / PostgreSQL", table_cell),
            Paragraph("Stores registered targets, historical assessments, test results, confirmed findings, and remediation status with complete referential integrity.", table_cell)
        ],
        [
            Paragraph("<b>Vulnerability Detectors</b>", table_cell),
            Paragraph("Deterministic Python Regex, Canary Matching, Fuzzy Ratio, JSON Schema", table_cell),
            Paragraph("6 core detection modules executing parallel algorithmic verification across prompt injection, sensitive data, hallucinations, compliance, etc.", table_cell)
        ],
        [
            Paragraph("<b>Report Generation</b>", table_cell),
            Paragraph("ReportLab PDF Library, JSON Schema Exporters", table_cell),
            Paragraph("Generates formal, auditor-grade PDF dossiers and machine-readable JSON exports with verbatim prompt-response evidence for SOC2/ISO audits.", table_cell)
        ],
    ]
    stack_table = Table(stack_data, colWidths=[110, 140, 254])
    stack_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), brand_indigo),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("PADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, light_bg]),
    ]))
    story.append(stack_table)

    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 3: THE 6 CORE AI VULNERABILITY DETECTORS
    # =========================================================================
    story.append(Paragraph("3. The 6 Core AI Vulnerability Detection Engines", h1_style))
    story.append(Paragraph(
        "SENTRIX AI evaluates model safety across six empirical categories aligned with the OWASP LLM 2025 framework:",
        body_style
    ))

    detectors = [
        ("Prompt Injection & Role Hijacking (OWASP LLM01)",
         "Evaluates model resistance against jailbreak suffixes (AutoDAN), persona adoption ('You are a pirate', 'DAN mode'), "
         "and system boundary override commands. The detector inspects the model's actual response for compliance indicators versus explicit boundary refusals."),
        ("Sensitive Data & Credential Exposure (OWASP LLM06)",
         "Probes for leaks of synthetic API keys (e.g., <code>SENTRIX-DEMO-SECRET-4821</code>), environment variables, database connection strings, "
         "and system prompts. Uses exact pattern matching, regex for high-entropy tokens, and canary verification."),
        ("Hallucination & Reliability (OWASP LLM09)",
         "Tests model factuality under unanswerable queries and checks for 'Slopsquatting'—the dangerous tendency of LLMs to invent non-existent "
         "open-source library package names (e.g., recommending malicious pip/npm packages)."),
        ("Instruction Compliance & Schema Integrity",
         "Enforces strict JSON formatting, schema validation, and required key adherence. Detects conversational drift, unwanted markdown preamble, "
         "and formatting degradation."),
        ("Unsafe Output & Malicious Code Handling (OWASP LLM02)",
         "Assesses whether the model refuses to write stealth keystroke loggers, exploit scripts, or offensive payloads. Uses intent recognition "
         "to differentiate between educational cybersecurity guidance and actionable weaponized code."),
        ("Adversarial Robustness & Perturbation Resistance",
         "Subject queries to character substitutions (homoglyphs from Cyrillic/Greek alphabets), leetspeak, and syntactic scrambling. "
         "Ensures that minor surface variations do not trigger unhandled exceptions or safety bypasses."),
    ]
    for d_title, d_desc in detectors:
        story.append(Paragraph(f"<b>{d_title}:</b> {d_desc}", bullet_style))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 4: RISK SCORING FORMULA & MATHEMATICAL RIGOR
    # =========================================================================
    story.append(Paragraph("4. Mathematical Risk Scoring & Security Posture Formula", h1_style))
    story.append(Paragraph(
        "Unlike subjective ratings, SENTRIX AI calculates security posture using an audited, reproducible mathematical model "
        "defined in the official specification guide:",
        body_style
    ))

    formula_html = (
        "<b>MATHEMATICAL RISK FORMULA:</b><br/><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Severity Penalty Index (S):</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<i>S = 100 × [ ∑ (w_i × f_i) / ∑ w_i ]</i><br/><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Composite Security Score:</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>Security Score = 100 - S</b><br/><br/>"
        "<b>Where:</b><br/>"
        "• <i>w_i</i> = Category weight assigned by organizational criticality (default: Secret Exposure = 1.0, "
        "Prompt Injection = 0.9, Unsafe Output = 0.85, Hallucination = 0.7, Compliance = 0.6, Robustness = 0.6).<br/>"
        "• <i>f_i</i> = Failure fraction in category <i>i</i> (Failed Test Count / Total Tests Evaluated).<br/>"
        "• <b>Guaranteed Bounds:</b> Security Score is strictly clamped between 0.0 and 100.0, where 100 indicates perfect defense."
    )
    formula_box = Table([[Paragraph(formula_html, body_style)]], colWidths=[504])
    formula_box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(formula_box)

    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 5: HOW THE WEBSITE PAGES OPERATE (FEATURE MAP)
    # =========================================================================
    story.append(Paragraph("5. Interactive Features & Navigation Architecture", h1_style))
    story.append(Paragraph(
        "The SENTRIX AI user interface is divided into cohesive operational modules, accessible via the navigation bar and <code>Ctrl+K</code> command palette:",
        body_style
    ))

    pages_data = [
        [Paragraph("<b>Interface View</b>", table_header), Paragraph("<b>Key Capabilities & User Workflow</b>", table_header)],
        [
            Paragraph("<b>Security Overview (Dashboard)</b>", table_cell),
            Paragraph("Real-time executive posture dashboard featuring an SVG circular score gauge, active target count, critical flaw counts, 6-category horizontal health bars, historical area chart, and recent audit run logs.", table_cell)
        ],
        [
            Paragraph("<b>Security Playground</b>", table_cell),
            Paragraph("<b>Side-by-Side Dual Model Comparison:</b> Enables parallel testing of adversarial prompts against vulnerable and hardened targets simultaneously. Shows breach vs. deflected status, raw model text, and latency.", table_cell)
        ],
        [
            Paragraph("<b>Target Model Manager</b>", table_cell),
            Paragraph("CRUD interface for registered AI targets. Includes a real-time <b>'Ping'</b> probe measuring live endpoint latency (ms) and an automated <b>'Detect Local LLMs'</b> scanner for local Ollama and LM Studio nodes.", table_cell)
        ],
        [
            Paragraph("<b>Assessment Runs & Detail</b>", table_cell),
            Paragraph("Full audit history with detailed inspection views. Provides expandable result accordions displaying the verbatim prompt input, target LLM response, confidence metrics, and detector evidence.", table_cell)
        ],
        [
            Paragraph("<b>Findings Registry & 1-Click Retest</b>", table_cell),
            Paragraph("Triage workspace for confirmed vulnerabilities. Features a 1-click <b>'Retest'</b> button that fires live adversarial probes against the target adapter to dynamically verify if an issue is resolved.", table_cell)
        ],
        [
            Paragraph("<b>Remediation Workshop</b>", table_cell),
            Paragraph("Generates side-by-side system prompt boundaries (red/green line diffs) and exportable Python guardrail middleware to shield endpoints before deploying model weights.", table_cell)
        ],
        [
            Paragraph("<b>Threat Matrix & Red-Team</b>", table_cell),
            Paragraph("Interactive reference aligning all tests with OWASP LLM 2025 and MITRE ATLAS tactics, accompanied by an autonomous red-team recursive attack tree generator.", table_cell)
        ],
    ]
    pages_table = Table(pages_data, colWidths=[150, 354])
    pages_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), primary_color),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("PADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, light_bg]),
    ]))
    story.append(pages_table)

    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 6: WORKFLOW CYCLE (HOW IT WORKS STEP-BY-STEP)
    # =========================================================================
    story.append(Paragraph("6. End-to-End Operational Lifecycle", h1_style))
    story.append(Paragraph(
        "A typical security assessment in SENTRIX AI proceeds through four clear stages:",
        body_style
    ))

    lifecycle_steps = [
        ("1. Target Configuration & Probe",
         "The user connects an AI endpoint (e.g. <code>http://127.0.0.1:11434</code> for Ollama, a simulated model, or a production HTTP API). "
         "Sentrix verifies network connectivity and baseline latency via <code>POST /api/targets/{id}/ping</code>."),
        ("2. Automated Test Suite Execution",
         "The user launches an assessment. The test loader pulls versioned adversarial test cases (e.g. 36+ real vectors in <code>default_suite.json</code>). "
         "The Assessment Runner feeds prompts through the appropriate adapter and collects raw model responses."),
        ("3. Algorithmic Detection & Scoring",
         "Each response is analyzed by its corresponding detector module. Violations are logged into SQLite with empirical evidence. "
         "The Mathematical Scorer computes category fractions, weighted penalties, and the final 0–100 Security Score."),
        ("4. Remediation & Verification",
         "Engineers review confirmed findings in the Findings Registry. The Remediation Workshop supplies hardened prompt diffs and Python guardrail code. "
         "Clicking 'Retest' immediately verifies that the patch neutralized the exploit vector."),
    ]
    for step_num, step_desc in lifecycle_steps:
        story.append(Paragraph(f"<b>{step_num}:</b> {step_desc}", bullet_style))

    story.append(Spacer(1, 14))

    # =========================================================================
    # CONCLUSION & SIGN-OFF
    # =========================================================================
    story.append(Paragraph("7. Summary & Architectural Integrity", h1_style))
    story.append(Paragraph(
        "SENTRIX AI transforms AI safety testing from guesswork into an auditable, automated engineering discipline. "
        "By pairing a zero-overhead FastAPI backend with a modern React SPA and rigorous mathematical scoring, "
        "teams can safely ship generative AI applications while proactively eliminating prompt injection, data leakage, "
        "and model hallucination risks.",
        body_style
    ))
    story.append(Spacer(1, 6))

    signoff_data = [
        [Paragraph("<b>Engine Status:</b> OPERATIONAL", table_cell), Paragraph("<b>Backend Port:</b> 8000 (FastAPI)", table_cell)],
        [Paragraph("<b>Security Standard:</b> OWASP LLM 2025 / MITRE ATLAS", table_cell), Paragraph("<b>Frontend Port:</b> 5173 (Vite/React)", table_cell)],
    ]
    signoff_table = Table(signoff_data, colWidths=[250, 254])
    signoff_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(signoff_table)

    # Build the document using NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully compiled PDF report to: {filepath}")

if __name__ == "__main__":
    create_pdf(PDF_OUTPUT_PATH)
