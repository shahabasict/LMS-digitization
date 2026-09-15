from typing import Optional

from ..models.common import PyObjectId
from fastapi import APIRouter, Depends, Response

from ..core.database import db
from ..core.deps import require_roles
from ..models.enums import Role
from ..services import stats_service

router = APIRouter(prefix="/reports", tags=["Reports"])



@router.get("/summary")
def summary(team_id: Optional[PyObjectId] = None, manager: dict = Depends(require_roles(Role.manager))):
    return stats_service.dashboard_summary(db, manager, team_id=team_id)


@router.get("/team")
def team_report(
    team_id: Optional[PyObjectId] = None,
    format: str = "json",
    manager: dict = Depends(require_roles(Role.manager)),
):
    rows = stats_service.team_report(db, manager, team_id=team_id)
    if format.lower() == "csv":
        csv_data = stats_service.report_to_csv(rows)
        return Response(
            content=csv_data,
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": "attachment; filename=training-report.csv"},
        )
    return {"count": len(rows), "rows": rows}