from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud.cost_benefit import get_action_counts, get_cost_benefit_totals, get_monthly_cost_benefit_stats
from app.db.session import get_db

router = APIRouter()


@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    totals = get_cost_benefit_totals(db)
    action_counts = get_action_counts(db)
    monthly_rows = get_monthly_cost_benefit_stats(db)

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
