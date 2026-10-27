"""Entrego el historial de reportes de IA y su exportación a CSV/PDF."""
import csv
import io
from datetime import date

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

from app.auth import require_role
from app.db import query

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("")
def get_reports(
    user: dict = Depends(require_role("viewer", "admin")),
    page: int = 1,
    page_size: int = 10,
    start_date: date | None = None,
    end_date: date | None = None,
):
    conditions = []
    params: list = []
    if start_date:
        conditions.append("report_date >= %s")
        params.append(start_date)
    if end_date:
        conditions.append("report_date <= %s")
        params.append(end_date)
    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    total = query(f"SELECT count(*) AS n FROM curated.ai_reports {where_clause}", tuple(params))[0]["n"]

    offset = (page - 1) * page_size
    rows = query(
        f"""
        SELECT report_id, report_date, summary_text, model, stats_json, created_at
        FROM curated.ai_reports
        {where_clause}
        ORDER BY report_date DESC
        LIMIT %s OFFSET %s
        """,
        tuple(params + [page_size, offset]),
    )
    return {"page": page, "page_size": page_size, "total": total, "reports": rows}


@router.get("/export")
def export_reports(
    user: dict = Depends(require_role("viewer", "admin")),
    format: str = "csv",
    start_date: date | None = None,
    end_date: date | None = None,
):
    conditions = []
    params: list = []
    if start_date:
        conditions.append("report_date >= %s")
        params.append(start_date)
    if end_date:
        conditions.append("report_date <= %s")
        params.append(end_date)
    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    rows = query(
        f"SELECT report_date, summary_text, model, created_at FROM curated.ai_reports {where_clause} ORDER BY report_date DESC",
        tuple(params),
    )

    if format == "pdf":
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = [Paragraph("Reportes SismoWatch", styles["Title"])]
        for row in rows:
            elements.append(Paragraph(f"{row['report_date']} ({row['created_at']}): {row['summary_text']}", styles["BodyText"]))
        doc.build(elements)
        buffer.seek(0)
        return StreamingResponse(buffer, media_type="application/pdf", headers={
            "Content-Disposition": "attachment; filename=reportes.pdf"
        })

    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=["report_date", "summary_text", "model", "created_at"])
    writer.writeheader()
    writer.writerows(rows)
    buffer.seek(0)
    return StreamingResponse(iter([buffer.getvalue()]), media_type="text/csv", headers={
        "Content-Disposition": "attachment; filename=reportes.csv"
    })
