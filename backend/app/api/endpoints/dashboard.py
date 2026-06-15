from fastapi import APIRouter

router = APIRouter()

@router.get("/dashboard/stats")
def get_dashboard_stats():
    return {
        "cumulative_hours_saved": 0.0,
        "cumulative_cost_saved": 0.0,
        "theme_generation_count": 0,
        "proposal_export_count": 0,
        "monthly_stats": []
    }
