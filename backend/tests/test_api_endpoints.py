"""Integration tests for all FastAPI endpoints."""

from fastapi.testclient import TestClient
from app.main import app

def test_all_endpoints():
    with TestClient(app) as client:
        # 1. Health
        r = client.get("/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

        # 2. Dashboard
        r = client.get("/api/dashboard/stats")
        assert r.status_code == 200
        data = r.json()
        assert "total_targets" in data
        assert "total_assessments" in data
        assert "pass_rate" in data

        # 3. Targets
        r = client.get("/api/targets")
        assert r.status_code == 200
        targets = r.json()
        assert len(targets) >= 3

        # 4. Target creation
        new_t = {
            "name": "Integration Test Target",
            "description": "Created during pytest execution",
            "target_type": "simulated_vulnerable",
        }
        r = client.post("/api/targets", json=new_t)
        assert r.status_code == 201
        created_target = r.json()
        target_id = created_target["id"]

        # 5. Assessments list
        r = client.get("/api/assessments")
        assert r.status_code == 200
        assessments = r.json()
        assert len(assessments) >= 2

        # 6. Run new assessment
        new_assess_payload = {
            "target_id": target_id,
            "test_profile": "default",
            "categories": ["prompt_injection", "secret_exposure"],
        }
        r = client.post("/api/assessments", json=new_assess_payload)
        assert r.status_code == 201
        new_assess = r.json()
        aid = new_assess["id"]
        assert new_assess["status"] == "completed"
        assert new_assess["total_tests"] > 0

        # 7. Assessment detail
        r = client.get(f"/api/assessments/{aid}")
        assert r.status_code == 200
        detail = r.json()
        assert "test_results" in detail
        assert "findings" in detail
        assert len(detail["test_results"]) == new_assess["total_tests"]

        # 8. Assessment results
        r = client.get(f"/api/assessments/{aid}/results")
        assert r.status_code == 200
        assert len(r.json()) > 0

        # 9. Compare assessments
        first_id = assessments[0]["id"]
        second_id = assessments[1]["id"]
        r = client.get(f"/api/assessments/{first_id}/compare/{second_id}")
        assert r.status_code == 200
        diff = r.json()
        assert "score_delta" in diff
        assert "category_comparison" in diff

        # 10. Findings
        r = client.get("/api/findings")
        assert r.status_code == 200
        findings = r.json()
        assert len(findings) > 0

        # 11. Finding update status
        fid = findings[0]["id"]
        r = client.patch(f"/api/findings/{fid}", json={"status": "acknowledged"})
        assert r.status_code == 200
        assert r.json()["status"] == "acknowledged"

        # 12. JSON report
        r = client.get(f"/api/assessments/{aid}/report?format=json")
        assert r.status_code == 200
        assert "report" in r.json()

        # 13. PDF report
        r = client.get(f"/api/assessments/{aid}/report?format=pdf")
        assert r.status_code == 200
        assert r.headers["content-type"] == "application/pdf"
        assert len(r.content) > 1000  # Valid binary PDF stream
