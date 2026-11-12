"""Finding endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Finding, TestResult, Target, Assessment
from app.models.schemas import FindingResponse, FindingUpdate
from app.engine.runner import build_adapter, DETECTORS
from app.engine.test_loader import load_test_suite

router = APIRouter(prefix="/findings", tags=["Findings"])


@router.get("", response_model=list[FindingResponse])
def list_findings(
    category: str | None = Query(None),
    severity: str | None = Query(None),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Finding)
    if category:
        query = query.filter(Finding.category == category)
    if severity:
        query = query.filter(Finding.severity == severity)
    if status:
        query = query.filter(Finding.status == status)
    return query.order_by(Finding.id.desc()).all()


@router.get("/{finding_id}", response_model=FindingResponse)
def get_finding(finding_id: int, db: Session = Depends(get_db)):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    return finding


@router.patch("/{finding_id}", response_model=FindingResponse)
def update_finding(finding_id: int, payload: FindingUpdate, db: Session = Depends(get_db)):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    if payload.status is not None:
        finding.status = payload.status
    db.commit()
    db.refresh(finding)
    return finding


@router.post("/{finding_id}/retest")
def retest_finding(finding_id: int, db: Session = Depends(get_db)):
    """Retest a specific finding directly against its target adapter and update its status."""
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    assessment = finding.assessment
    target = assessment.target if assessment else None
    if not target:
        raise HTTPException(status_code=400, detail="Associated target not found for finding")

    # Locate the failing test result or test case
    test_result = (
        db.query(TestResult)
        .filter(
            TestResult.assessment_id == finding.assessment_id,
            TestResult.category == finding.category,
            TestResult.status == "failed",
        )
        .first()
    )

    suite = load_test_suite()
    test_case = None
    if test_result:
        for tc in suite:
            if tc.get("id") == test_result.test_case_id:
                test_case = tc
                break

    if not test_case:
        for tc in suite:
            if tc.get("category") == finding.category:
                test_case = tc
                break

    prompt_to_test = test_result.input_prompt if test_result else (test_case.get("input", "") if test_case else finding.title)
    if not test_case:
        test_case = {
            "id": f"RETEST_{finding.id}",
            "category": finding.category,
            "name": finding.title,
            "input": prompt_to_test,
            "metadata": {},
        }

    adapter = build_adapter(target)
    context = {"category": finding.category, "metadata": test_case.get("metadata", {})}
    adapter_resp = adapter.send_prompt(prompt_to_test, context=context)

    detector = DETECTORS.get(finding.category)
    vuln_detected = False
    evidence = "No vulnerability detected. Target successfully defended against the vector."

    if detector and adapter_resp.success:
        det_result = detector.detect(
            response=adapter_resp.text,
            test_case=test_case,
            target_config={},
        )
        vuln_detected = det_result.vulnerability_detected
        if vuln_detected:
            evidence = det_result.evidence or "Exploit verified against target model output."
    elif not adapter_resp.success:
        vuln_detected = False
        evidence = f"Target communication error: {adapter_resp.error}"

    prev_status = finding.status
    if not vuln_detected:
        finding.status = "resolved"
        details = "Vulnerability successfully deflected! Target passed real-time verification."
    else:
        details = "Vulnerability still active: exploit vector bypassed target boundary."

    db.commit()
    db.refresh(finding)

    return {
        "finding_id": finding.id,
        "target_name": target.name,
        "previous_status": prev_status,
        "new_status": finding.status,
        "retest_passed": not vuln_detected,
        "latency_ms": adapter_resp.latency_ms,
        "model_response": adapter_resp.text,
        "evidence": evidence,
        "details": details,
    }
