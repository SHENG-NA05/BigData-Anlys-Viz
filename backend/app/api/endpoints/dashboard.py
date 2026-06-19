from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.crud.cost_benefit import get_action_counts, get_cost_benefit_totals, get_monthly_cost_benefit_stats
from app.crud.system_setting import get_system_setting, upsert_system_setting
from app.db.session import get_db
from app.db.models import CostBenefitLog

router = APIRouter()


class DashboardSettingsRequest(BaseModel):
    hourly_rate: float
    base_hours: float


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


@router.get("/dashboard/monthly-stats")
def get_monthly_stats(db: Session = Depends(get_db)):
    rows = get_monthly_cost_benefit_stats(db)
    return [
        {
            "month": row.month,
            "hours": float(row.hours),
            "cost": float(row.cost),
        }
        for row in rows
    ]


@router.get("/dashboard/quarterly-stats")
def get_quarterly_stats(db: Session = Depends(get_db)):
    quarter_expr = func.date_trunc("quarter", CostBenefitLog.timestamp)
    rows = (
        db.query(
            func.concat(
                func.to_char(quarter_expr, "YYYY"),
                "-Q",
                func.to_char(quarter_expr, "Q")
            ).label("quarter"),
            func.coalesce(func.sum(CostBenefitLog.time_saved_hours), 0).label("hours"),
            func.coalesce(func.sum(CostBenefitLog.cost_saved_amount), 0).label("cost"),
        )
        .group_by(quarter_expr)
        .order_by(quarter_expr)
        .all()
    )
    return [
        {
            "quarter": row.quarter,
            "hours": float(row.hours),
            "cost": float(row.cost),
        }
        for row in rows
    ]


@router.get("/dashboard/settings")
def get_dashboard_settings(db: Session = Depends(get_db)):
    hourly_rate_setting = get_system_setting(db, "hourly_rate")
    base_hours_setting = get_system_setting(db, "base_hours")
    
    hourly_rate = float(hourly_rate_setting.setting_value) if hourly_rate_setting else 200.0
    base_hours = float(base_hours_setting.setting_value) if base_hours_setting else 8.0
    
    return {
        "hourly_rate": hourly_rate,
        "base_hours": base_hours,
    }


@router.post("/dashboard/settings")
def update_dashboard_settings(request: DashboardSettingsRequest, db: Session = Depends(get_db)):
    upsert_system_setting(db, "hourly_rate", str(request.hourly_rate), "Average hourly rate for library staff in NTD")
    upsert_system_setting(db, "base_hours", str(request.base_hours), "Baseline work hours per day")
    return {"status": "success", "message": "Settings updated successfully"}
