"""Assessment endpoints – start, list, detail, results, compare."""

import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Assessment, Target, TestResult, Finding
from app.models.schemas import (
    AssessmentCreate,
    AssessmentSummary,
    AssessmentDetail,
    AssessmentCompare,
    TestResultResponse,
    FindingResponse,
)
from app.engine.runner import run_assessment

router = APIRouter(prefix="/assessments", tags=["Assessments"])


def _enrich_summary(a: Assessment, db: Session) -> dict:
    target = db.query(Target).filter(Target.id == a.target_id).first()
    d = {
        "id": a.id,
        "target_id": a.target_id,
        "target_name": target.name if target else "Unknown",
        "status": a.status,
        "started_at": a.started_at,
        "completed_at": a.completed_at,
        "total_tests": a.total_tests,
        "passed_tests": a.passed_tests,
        "failed_tests": a.failed_tests,
        "inconclusive_tests": a.inconclusive_tests,
        "error_tests": a.error_tests,
        "summary_score": a.summary_score,
        "test_profile": a.test_profile,
        "categories": a.categories,
        "created_at": a.created_at,
    }
    return d


@router.post("", response_model=AssessmentSummary, status_code=201)
def start_assessment(payload: AssessmentCreate, db: Session = Depends(get_db)):
    target = db.query(Target).filter(Target.id == payload.target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")

    assessment = Assessment(
        target_id=payload.target_id,
        test_profile=payload.test_profile,
        status="pending",
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # Run the assessment synchronously (fast for simulators)
    assessment = run_assessment(
        db=db,
        assessment=assessment,
        target=target,
        categories=payload.categories,
    )
    return _enrich_summary(assessment, db)


@router.get("", response_model=list[AssessmentSummary])
def list_assessments(db: Session = Depends(get_db)):
    assessments = db.query(Assessment).order_by(Assessment.id.desc()).all()
    return [_enrich_summary(a, db) for a in assessments]


@router.get("/{assessment_id}", response_model=AssessmentDetail)
def get_assessment(assessment_id: int, db: Session = Depends(get_db)):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    target = db.query(Target).filter(Target.id == assessment.target_id).first()
    results = db.query(TestResult).filter(TestResult.assessment_id == assessment_id).all()
    findings = db.query(Finding).filter(Finding.assessment_id == assessment_id).all()

    return {
        **_enrich_summary(assessment, db),
        "test_results": results,
        "findings": findings,
    }


@router.get("/{assessment_id}/results", response_model=list[TestResultResponse])
def get_assessment_results(assessment_id: int, db: Session = Depends(get_db)):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return db.query(TestResult).filter(TestResult.assessment_id == assessment_id).all()


@router.get("/{aid}/compare/{bid}", response_model=AssessmentCompare)
def compare_assessments(aid: int, bid: int, db: Session = Depends(get_db)):
    a = db.query(Assessment).filter(Assessment.id == aid).first()
    b = db.query(Assessment).filter(Assessment.id == bid).first()
    if not a or not b:
        raise HTTPException(status_code=404, detail="Assessment not found")

    findings_a = {f.title for f in db.query(Finding).filter(Finding.assessment_id == aid).all()}
    findings_b = {f.title for f in db.query(Finding).filter(Finding.assessment_id == bid).all()}

    results_a = db.query(TestResult).filter(TestResult.assessment_id == aid).all()
    results_b = db.query(TestResult).filter(TestResult.assessment_id == bid).all()

    cat_a: dict[str, dict] = {}
    for r in results_a:
        cat_a.setdefault(r.category, {"passed": 0, "failed": 0, "total": 0})
        cat_a[r.category]["total"] += 1
        if r.status == "passed":
            cat_a[r.category]["passed"] += 1
        elif r.status == "failed":
            cat_a[r.category]["failed"] += 1

    cat_b: dict[str, dict] = {}
    for r in results_b:
        cat_b.setdefault(r.category, {"passed": 0, "failed": 0, "total": 0})
        cat_b[r.category]["total"] += 1
        if r.status == "passed":
            cat_b[r.category]["passed"] += 1
        elif r.status == "failed":
            cat_b[r.category]["failed"] += 1

    all_cats = sorted(set(list(cat_a.keys()) + list(cat_b.keys())))
    comparison = {}
    for c in all_cats:
        comparison[c] = {"a": cat_a.get(c, {}), "b": cat_b.get(c, {})}

    score_a = a.summary_score or 0
    score_b = b.summary_score or 0

    return AssessmentCompare(
        assessment_a=_enrich_summary(a, db),
        assessment_b=_enrich_summary(b, db),
        score_delta=round(score_b - score_a, 2),
        new_findings=len(findings_b - findings_a),
        resolved_findings=len(findings_a - findings_b),
        category_comparison=comparison,
    )
