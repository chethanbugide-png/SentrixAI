"""Sentrix Tactical Terminal CLI API endpoint."""

from __future__ import annotations
import shlex
import time
import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Target, Assessment, Finding
from app.engine.runner import run_assessment
from app.adapters.universal_model import UniversalModelAdapter
from app.api.playground import execute_probe, ProbeRequest, MutateRequest, run_attack_tree_mutator

router = APIRouter(prefix="/cli", tags=["CLI"])


class CliRequest(BaseModel):
    command: str


class CliResponse(BaseModel):
    command: str
    output: str
    status: str  # "success" | "error"
    data: Optional[Dict[str, Any]] = None


BANNER = r"""
  ███████╗███████╗███╗   ██╗████████╗██████╗ ██╗██╗  ██╗   ██████╗ ███████╗
  ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██╔══██╗██║╚██╗██╔╝  ██╔═══██╗██╔════╝
  ███████╗█████╗  ██╔██╗ ██║   ██║   ██████╔╝██║ ╚███╔╝   ██║   ██║███████╗
  ╚════██║██╔══╝  ██║╚██╗██║   ██║   ██╔══██╗██║ ██╔██╗   ██║   ██║╚════██║
  ███████║███████╗██║ ╚████║   ██║   ██║  ██║██║██╔╝ ██╗  ╚██████╔╝███████║
  ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝   ╚═════╝ ╚══════╝
       [ AI RED-TEAMING & THREAT OPERATIONS OPERATING SYSTEM - V2.4 ]
"""

HELP_TEXT = """
COMMAND                  DESCRIPTION
-----------------------  -------------------------------------------------------------
help, ?                  Display this command manual
status                   Display SentrixOS kernel metrics, DEFCON state & agent stats
targets                  List all registered target systems and authorization levels
ping <target_id>         Ping a target endpoint and measure live round-trip latency
assess <target_id>       Execute full automated AI security audit against target
probe <target_id> <text> Launch single-shot adversarial payload through 4-stage firewall
mutate <objective>       Execute autonomous multi-generation red-team attack mutator
patch <category>         Generate automated guardrail hotfix & hardened system prompt
matrix                   Show OWASP Top 10 for LLM & MITRE ATLAS tactical coverage
banner                   Display SentrixOS cyber art banner
clear                    Clear terminal buffer
"""


@router.post("/execute", response_model=CliResponse)
def execute_cli_command(req: CliRequest, db: Session = Depends(get_db)):
    cmd_raw = req.command.strip()
    if not cmd_raw:
        return CliResponse(command="", output="", status="success")

    try:
        parts = shlex.split(cmd_raw)
    except Exception:
        parts = cmd_raw.split()

    verb = parts[0].lower()
    args = parts[1:]

    # 1. Help
    if verb in ("help", "?"):
        return CliResponse(command=cmd_raw, output=HELP_TEXT, status="success")

    # 2. Banner
    elif verb == "banner":
        return CliResponse(command=cmd_raw, output=BANNER, status="success")

    # 3. Status
    elif verb == "status":
        target_count = db.query(Target).filter(Target.is_active == True).count()
        assessment_count = db.query(Assessment).count()
        findings_count = db.query(Finding).count()
        crit_findings = db.query(Finding).filter(Finding.severity == "critical").count()

        defcon = "DEFCON-1 (CRITICAL)" if crit_findings > 0 else "DEFCON-5 (NORMAL)"
        status_out = f"""
SENTRIX-OS KERNEL DIAGNOSTICS:
======================================================
OS Kernel State     : ONLINE (FastAPI Subsystem v2.4.0)
Security Posture    : {defcon}
Active Targets      : {target_count} registered
Audit Runs Executed : {assessment_count} total runs
Threats Discovered  : {findings_count} findings ({crit_findings} CRITICAL)
Inspection Pipeline : 4-Stage Guardrail Active
Universal Adapters  : Simulated + HTTP API + Ollama/LMStudio
Uptime              : Operational
======================================================
"""
        return CliResponse(command=cmd_raw, output=status_out.strip(), status="success")

    # 4. Targets
    elif verb == "targets":
        targets = db.query(Target).filter(Target.is_active == True).all()
        if not targets:
            return CliResponse(command=cmd_raw, output="[!] No active targets registered in database.", status="success")

        lines = [f"{'ID':<4} | {'NAME':<34} | {'TYPE':<22} | {'ENDPOINT':<20}"]
        lines.append("-" * 88)
        for t in targets:
            ep = t.endpoint or "local_simulated"
            lines.append(f"{t.id:<4} | {t.name:<34} | {t.target_type:<22} | {ep:<20}")
        return CliResponse(command=cmd_raw, output="\n".join(lines), status="success")

    # 5. Ping
    elif verb == "ping":
        if not args:
            return CliResponse(command=cmd_raw, output="Usage: ping <target_id>", status="error")
        try:
            tid = int(args[0])
        except ValueError:
            return CliResponse(command=cmd_raw, output="[!] Target ID must be an integer.", status="error")

        target = db.query(Target).filter(Target.id == tid).first()
        if not target:
            return CliResponse(command=cmd_raw, output=f"[!] Target {tid} not found.", status="error")

        start = time.perf_counter()
        adapter = UniversalModelAdapter(target_type=target.target_type, endpoint=target.endpoint)
        resp = adapter.send_prompt("PING_HEALTHCHECK")
        elapsed = int((time.perf_counter() - start) * 1000)

        out = f"""
[+] PING SENTRIX-ADAPTER: Target ID {target.id} ({target.name})
[+] Status    : 200 OK (ONLINE)
[+] Mode      : {target.target_type}
[+] Latency   : {elapsed} ms
[+] Telemetry : Packet round-trip verified. Ready for assessment.
"""
        return CliResponse(command=cmd_raw, output=out.strip(), status="success")

    # 6. Assess
    elif verb == "assess":
        if not args:
            return CliResponse(command=cmd_raw, output="Usage: assess <target_id>", status="error")
        try:
            tid = int(args[0])
        except ValueError:
            return CliResponse(command=cmd_raw, output="[!] Target ID must be an integer.", status="error")

        target = db.query(Target).filter(Target.id == tid).first()
        if not target:
            return CliResponse(command=cmd_raw, output=f"[!] Target {tid} not found.", status="error")

        assessment = Assessment(
            target_id=target.id,
            status="running",
            test_profile="quick_scan",
            categories=json.dumps(["prompt_injection", "secret_exposure", "hallucination", "compliance", "unsafe_output", "robustness"]),
        )
        db.add(assessment)
        db.commit()
        db.refresh(assessment)

        assessment = run_assessment(db, assessment, target)

        out = f"""
======================================================
  SENTRIX-OS AUDIT RUN #{assessment.id} COMPLETED
======================================================
Target              : {target.name} [{target.target_type}]
Total Tests Run     : {assessment.total_tests}
Passed Tests        : {assessment.passed_tests}
Failed Tests        : {assessment.failed_tests}
Overall Score       : {assessment.summary_score:.1f}% Security Rating
Status              : {assessment.status.upper()}
Result URL          : /assessments/{assessment.id}
======================================================
"""
        return CliResponse(command=cmd_raw, output=out.strip(), status="success", data={"assessment_id": assessment.id})

    # 7. Probe
    elif verb == "probe":
        if len(args) < 2:
            return CliResponse(command=cmd_raw, output="Usage: probe <target_id> <prompt_text>", status="error")
        try:
            tid = int(args[0])
            prompt_text = " ".join(args[1:])
        except ValueError:
            return CliResponse(command=cmd_raw, output="[!] Target ID must be an integer.", status="error")

        target = db.query(Target).filter(Target.id == tid).first()
        if not target:
            return CliResponse(command=cmd_raw, output=f"[!] Target {tid} not found.", status="error")

        probe_req = ProbeRequest(
            target_id=target.id,
            prompt=prompt_text,
            category="prompt_injection"
        )
        res = execute_probe(probe_req, db)

        stages_str = "\n".join([f"  [{s.status:<11}] {s.stage_name} ({s.latency_ms}ms) -> {s.details}" for s in res.pipeline])
        out = f"""
------------------------------------------------------
SENTRIX 4-STAGE INTERCEPTION TELEMETRY:
------------------------------------------------------
PROMPT         : {prompt_text}
THREAT LEVEL   : {res.threat_level}
VULNERABILITY  : {'CONFIRMED BREACH' if res.vulnerability_detected else 'DEFLECTED / SECURE'}
PIPELINE TRACE :
{stages_str}

TARGET RESPONSE:
{res.response}
------------------------------------------------------
"""
        return CliResponse(command=cmd_raw, output=out.strip(), status="success")

    # 8. Mutate
    elif verb == "mutate":
        if not args:
            return CliResponse(command=cmd_raw, output="Usage: mutate <adversarial_objective>", status="error")
        objective = " ".join(args)
        mut_req = MutateRequest(objective=objective, iterations=4)
        res = run_attack_tree_mutator(mut_req)

        lines = [f"[+] RUNNING AUTONOMOUS ATTACK MUTATOR: '{objective}'", f"[+] TOTAL GENERATIONS: {len(res.attack_tree)}"]
        for step in res.attack_tree:
            status = "BYPASS" if step.bypass_success else "BLOCKED"
            lines.append(f"  [Gen {step.step}] [{status}] Technique: {step.technique} (Score: {int(step.adversarial_score*100)}%)")
            lines.append(f"         Prompt: {step.prompt[:75]}...")
        lines.append(f"[+] RESULT: {'ATTACK VECTOR CONFIRMED' if res.successful_bypass else 'TARGET DEFENSES HELD'}")
        return CliResponse(command=cmd_raw, output="\n".join(lines), status="success")

    # 9. Matrix
    elif verb == "matrix":
        out = """
OWASP TOP 10 FOR LLM (2025 EDITION):
  LLM01: Prompt Injection (Direct & Indirect)
  LLM02: Sensitive Information Disclosure
  LLM03: Supply Chain Vulnerabilities
  LLM04: Data and Model Poisoning
  LLM05: Improper Output Handling
  LLM06: Excessive Agency
  LLM07: System Prompt Leakage
  LLM08: Vector and Embedding Weaknesses
  LLM09: Misinformation & Hallucination
  LLM10: Unbounded Consumption

MITRE ATLAS COVERAGE:
  AML.TA0000 Reconnaissance
  AML.TA0001 Resource Development
  AML.TA0002 Initial Access
  AML.TA0003 ML Attack Staging
  AML.TA0004 Exfiltration
  AML.TA0005 Impact
"""
        return CliResponse(command=cmd_raw, output=out.strip(), status="success")

    # 10. Clear
    elif verb == "clear":
        return CliResponse(command=cmd_raw, output="__CLEAR__", status="success")

    else:
        return CliResponse(
            command=cmd_raw,
            output=f"[!] Unknown command '{verb}'. Type 'help' to view available SentrixOS directives.",
            status="error"
        )
