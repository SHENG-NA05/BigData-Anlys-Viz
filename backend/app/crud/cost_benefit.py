from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import CostBenefitLog


def get_cost_benefit_totals(db: Session) -> tuple:
    return db.query(
        func.coalesce(func.sum(CostBenefitLog.time_saved_hours), 0),
        func.coalesce(func.sum(CostBenefitLog.cost_saved_amount), 0),
    ).one()


def get_action_counts(db: Session) -> dict[str, int]:
    return dict(
        db.query(CostBenefitLog.action, func.count(CostBenefitLog.log_id))
        .group_by(CostBenefitLog.action)
        .all()
    )


def get_monthly_cost_benefit_stats(db: Session) -> list:
    month_expr = func.date_trunc("month", CostBenefitLog.timestamp)
    return (
        db.query(
            func.to_char(month_expr, "YYYY-MM").label("month"),
            func.coalesce(func.sum(CostBenefitLog.time_saved_hours), 0).label("hours"),
            func.coalesce(func.sum(CostBenefitLog.cost_saved_amount), 0).label("cost"),
        )
        .group_by(month_expr)
        .order_by(month_expr)
        .all()
    )
