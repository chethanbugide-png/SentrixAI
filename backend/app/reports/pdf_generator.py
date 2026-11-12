"""PDF report generation using ReportLab."""

from __future__ import annotations

import io
from datetime import datetime, timezone
from typing import Any
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)


def _safe_text(val: Any, max_len: int | None = None) -> str:
    """Safely truncate and XML-escape dynamic text for ReportLab Paragraphs."""
    if val is None:
        return ""
    text = str(val).replace("\r\n", "\n").replace("\r", "\n")
    if max_len is not None and len(text) > max_len:
        text = text[:max_len] + "..."
    # Escape &, <, > so ReportLab paraparser never treats model output as markup tags
    escaped = escape(text)
    return escaped.replace("\n", "<br/>")


def generate_pdf_report(
    assessment: dict,
    test_results: list[dict],
    findings: list[dict],
    target_name: str,
) -> bytes:
    """Generate a PDF assessment report.

    Returns the PDF as bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        spaceAfter=10,
        textColor=colors.HexColor("#000000"),
    )
    heading_style = ParagraphStyle(
        "CustomHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        spaceBefore=16,
        spaceAfter=8,
        textColor=colors.HexColor("#111114"),
    )
    body_style = ParagraphStyle(
        "CustomBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#1c1c22"),
    )
    small_style = ParagraphStyle(
        "Small",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8,
        textColor=colors.HexColor("#555560"),
    )

    elements: list[Any] = []

    # ── Title Page ───────────────────────────────────────────────
    elements.append(Spacer(1, 1.4 * inch))
    elements.append(Paragraph("SENTRIX AI", title_style))
    elements.append(
        Paragraph("Security & Vulnerability Assessment Dossier", heading_style)
    )
    elements.append(Spacer(1, 0.3 * inch))
    elements.append(Paragraph(f"<b>Target:</b> {_safe_text(target_name)}", body_style))
    elements.append(
        Paragraph(
            f"<b>Assessment ID:</b> {_safe_text(assessment.get('id', 'N/A'))}",
            body_style,
        )
    )
    elements.append(
        Paragraph(
            f"<b>Status:</b> {_safe_text(assessment.get('status', 'N/A'))}",
            body_style,
        )
    )
    elements.append(
        Paragraph(
            f"<b>Date:</b> {_safe_text(assessment.get('started_at', 'N/A'))}",
            body_style,
        )
    )
    score = assessment.get("summary_score")
    score_display = f"{score:.1f}" if score is not None else "N/A"
    elements.append(
        Paragraph(f"<b>Security Score:</b> {score_display} / 100", body_style)
    )
    elements.append(Spacer(1, 0.3 * inch))
    elements.append(
        Paragraph(
            f"Generated on {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
            small_style,
        )
    )
    elements.append(PageBreak())

    # ── Executive Summary ────────────────────────────────────────
    elements.append(Paragraph("Executive Summary", heading_style))
    total = assessment.get("total_tests", 0)
    passed = assessment.get("passed_tests", 0)
    failed_count = assessment.get("failed_tests", 0)
    error_count = assessment.get("error_tests", 0)
    inconclusive = assessment.get("inconclusive_tests", 0)

    summary_data = [
        ["Metric", "Value"],
        ["Total Tests", str(total)],
        ["Passed", str(passed)],
        ["Failed", str(failed_count)],
        ["Errors", str(error_count)],
        ["Inconclusive", str(inconclusive)],
        ["Security Score", f"{score_display} / 100"],
    ]
    summary_table = Table(summary_data, colWidths=[3 * inch, 2.2 * inch])
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111114")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 4),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#555560")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f4f4f6")]),
            ]
        )
    )
    elements.append(summary_table)
    elements.append(Spacer(1, 0.4 * inch))

    # ── Findings ─────────────────────────────────────────────────
    elements.append(Paragraph("Findings & Vulnerabilities", heading_style))

    if findings:
        severity_colors = {
            "critical": colors.HexColor("#000000"),
            "high": colors.HexColor("#1c1c22"),
            "medium": colors.HexColor("#33333d"),
            "low": colors.HexColor("#555560"),
            "info": colors.HexColor("#6e6e78"),
        }

        for i, finding in enumerate(findings, 1):
            sev = str(finding.get("severity", "info"))
            sev_color = severity_colors.get(sev.lower(), colors.HexColor("#33333d"))
            title = _safe_text(finding.get("title", "Untitled"))
            elements.append(
                Paragraph(
                    f"<b>{i}. [{escape(sev.upper())}]</b> {title}",
                    ParagraphStyle(
                        f"finding_{i}",
                        parent=body_style,
                        fontName="Helvetica-Bold",
                        textColor=sev_color,
                        fontSize=11,
                        spaceBefore=10,
                    ),
                )
            )
            elements.append(
                Paragraph(
                    f"<b>Category:</b> {_safe_text(finding.get('category', 'N/A'))}",
                    body_style,
                )
            )
            desc = _safe_text(finding.get("description", ""), max_len=500)
            if desc:
                elements.append(Paragraph(f"<b>Description:</b> {desc}", body_style))

            evidence = _safe_text(finding.get("evidence", ""), max_len=400)
            if evidence:
                elements.append(
                    Paragraph(f"<b>Evidence:</b> {evidence}", body_style)
                )

            remediation = _safe_text(finding.get("remediation", ""), max_len=600)
            if remediation:
                elements.append(
                    Paragraph(
                        f"<b>Remediation:</b> {remediation}", body_style
                    )
                )
            elements.append(Spacer(1, 0.15 * inch))
    else:
        elements.append(
            Paragraph(
                "No findings were detected. All tests passed.",
                body_style,
            )
        )

    elements.append(PageBreak())

    # ── Test Results Detail ──────────────────────────────────────
    elements.append(Paragraph("Test Results", heading_style))

    if test_results:
        result_header = ["ID", "Category", "Status", "Severity", "Confidence"]
        result_rows = [result_header]
        for tr in test_results:
            conf = tr.get("confidence")
            conf_str = f"{float(conf):.0%}" if conf is not None else "0%"
            result_rows.append(
                [
                    str(tr.get("test_case_id", "")),
                    str(tr.get("category", "")),
                    str(tr.get("status", "")),
                    str(tr.get("severity", "")),
                    conf_str,
                ]
            )

        result_table = Table(
            result_rows,
            colWidths=[1.1 * inch, 1.4 * inch, 0.9 * inch, 0.9 * inch, 1.0 * inch],
        )
        result_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111114")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#555560")),
                    (
                        "ROWBACKGROUNDS",
                        (0, 1),
                        (-1, -1),
                        [colors.white, colors.HexColor("#f4f4f6")],
                    ),
                ]
            )
        )
        elements.append(result_table)
    else:
        elements.append(Paragraph("No test results available.", body_style))

    # ── Footer ───────────────────────────────────────────────────
    elements.append(Spacer(1, 0.5 * inch))
    elements.append(
        Paragraph(
            "This report was generated automatically by SENTRIX AI. "
            "All findings should be reviewed by a qualified security professional.",
            small_style,
        )
    )

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
