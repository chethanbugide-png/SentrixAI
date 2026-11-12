"""Dashboard statistics endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import get_db
from app.database.models import Assessment, Target, Finding, TestResult
from app.models.schemas import DashboardStats, RecentAssessment

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_targets = db.query(Target).filter(Target.is_active == True).count()
    total_assessments = db.query(Assessment).count()
    total_findings = db.query(Finding).count()
    high_severity = db.query(Finding).filter(Finding.severity == "high").count()
    critical_findings = db.query(Finding).filter(Finding.severity == "critical").count()

    # Recent assessments
    recent = (
        db.query(Assessment)
        .order_by(Assessment.id.desc())
        .limit(5)
        .all()
    )
    recent_list = []
    for a in recent:
        target = db.query(Target).filter(Target.id == a.target_id).first()
        recent_list.append(
            RecentAssessment(
                id=a.id,
                target_name=target.name if target else "Unknown",
                status=a.status,
                summary_score=a.summary_score,
                started_at=a.started_at,
                total_tests=a.total_tests,
                failed_tests=a.failed_tests,
            )
        )

    # Category distribution of findings
    cat_rows = (
        db.query(Finding.category, func.count(Finding.id))
        .group_by(Finding.category)
        .all()
    )
    category_distribution = {row[0]: row[1] for row in cat_rows}

    # Risk trend (scores over time)
    trend_assessments = (
        db.query(Assessment)
        .filter(Assessment.status == "completed")
        .order_by(Assessment.started_at)
        .all()
    )
    risk_trend = [
        {
            "id": a.id,
            "score": a.summary_score,
            "date": a.started_at.isoformat() if a.started_at else None,
        }
        for a in trend_assessments
    ]

    # Overall pass/fail rates
    total_results = db.query(TestResult).count()
    passed_results = db.query(TestResult).filter(TestResult.status == "passed").count()
    failed_results = db.query(TestResult).filter(TestResult.status == "failed").count()

    pass_rate = (passed_results / total_results * 100) if total_results > 0 else 0
    fail_rate = (failed_results / total_results * 100) if total_results > 0 else 0

    return DashboardStats(
        total_targets=total_targets,
        total_assessments=total_assessments,
        total_findings=total_findings,
        high_severity_findings=high_severity,
        critical_findings=critical_findings,
        recent_assessments=recent_list,
        category_distribution=category_distribution,
        risk_trend=risk_trend,
        pass_rate=round(pass_rate, 1),
        fail_rate=round(fail_rate, 1),
    )
