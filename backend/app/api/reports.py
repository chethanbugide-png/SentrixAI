"""Report generation endpoints (PDF + JSON)."""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response, JSONResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Assessment, Target, TestResult, Finding
from app.reports.pdf_generator import generate_pdf_report

router = APIRouter(tags=["Reports"])


@router.get("/assessments/{assessment_id}/report")
def download_report(
    assessment_id: int,
    format: str = Query("json", pattern="^(json|pdf)$"),
    db: Session = Depends(get_db),
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    target = db.query(Target).filter(Target.id == assessment.target_id).first()
    target_name = target.name if target else "Unknown"

    results = db.query(TestResult).filter(TestResult.assessment_id == assessment_id).all()
    findings = db.query(Finding).filter(Finding.assessment_id == assessment_id).all()

    assessment_dict = {
        "id": assessment.id,
        "target_id": assessment.target_id,
        "status": assessment.status,
        "started_at": str(assessment.started_at) if assessment.started_at else None,
        "completed_at": str(assessment.completed_at) if assessment.completed_at else None,
        "total_tests": assessment.total_tests,
        "passed_tests": assessment.passed_tests,
        "failed_tests": assessment.failed_tests,
        "inconclusive_tests": assessment.inconclusive_tests,
        "error_tests": assessment.error_tests,
        "summary_score": assessment.summary_score,
    }

    results_dicts = [
        {
            "id": r.id,
            "test_case_id": r.test_case_id,
            "category": r.category,
            "test_name": r.test_name,
            "input_prompt": r.input_prompt,
            "response": r.response,
            "status": r.status,
            "severity": r.severity,
            "confidence": r.confidence,
            "evidence": r.evidence,
            "latency_ms": r.latency_ms,
        }
        for r in results
    ]

    findings_dicts = [
        {
            "id": f.id,
            "category": f.category,
            "severity": f.severity,
            "title": f.title,
            "description": f.description,
            "evidence": f.evidence,
            "remediation": f.remediation,
            "status": f.status,
        }
        for f in findings
    ]

    if format == "pdf":
        pdf_bytes = generate_pdf_report(
            assessment=assessment_dict,
            test_results=results_dicts,
            findings=findings_dicts,
            target_name=target_name,
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=sentrix_report_{assessment_id}.pdf"
            },
        )

    # JSON format
    report = {
        "report": {
            "generated_by": "SENTRIX AI",
            "version": "1.0.0",
            "target": target_name,
            "assessment": assessment_dict,
            "findings": findings_dicts,
            "test_results": results_dicts,
            "methodology": (
                "Automated assessment using deterministic detectors and "
                "controlled test cases across six vulnerability categories."
            ),
            "limitations": (
                "Results reflect observed behavior under specific test conditions. "
                "A passing test does not guarantee the absence of vulnerabilities."
            ),
        }
    }
    return JSONResponse(content=report)
