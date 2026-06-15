from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import CostBenefitLog
from app.db.session import get_db

router = APIRouter()


@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    totals = db.query(
        func.coalesce(func.sum(CostBenefitLog.time_saved_hours), 0),
        func.coalesce(func.sum(CostBenefitLog.cost_saved_amount), 0),
    ).one()

    action_counts = dict(
        db.query(CostBenefitLog.action, func.count(CostBenefitLog.log_id))
        .group_by(CostBenefitLog.action)
        .all()
    )

    monthly_rows = (
        db.query(
            func.to_char(func.date_trunc("month", CostBenefitLog.timestamp), "YYYY-MM").label("month"),
            func.coalesce(func.sum(CostBenefitLog.time_saved_hours), 0).label("hours"),
            func.coalesce(func.sum(CostBenefitLog.cost_saved_amount), 0).label("cost"),
        )
        .group_by(func.date_trunc("month", CostBenefitLog.timestamp))
        .order_by(func.date_trunc("month", CostBenefitLog.timestamp))
        .all()
    )

    return {
        "cumulative_hours_saved": float(totals[0]),
        "cumulative_cost_saved": float(totals[1]),
        "theme_generation_count": action_counts.get("theme_generation", 0),
        "proposal_export_count": action_counts.get("proposal_export", 0),
        "monthly_stats": [
            {
                "month": row.month,
                "hours": float(row.hours),
                "cost": float(row.cost),
            }
            for row in monthly_rows
        ],
    }
