from fastapi import APIRouter
from app.schemas.curation import CurationRequest

router = APIRouter()

@router.post("/generate_themes")
def generate_themes(request: CurationRequest):
    # Mock Response matching SA Spec
    return {
        "status": "success",
        "data": [
            {
                "theme_id": "T001",
                "title": f"時事熱點主題: {request.keywords[0] if request.keywords else '未定義'}",
                "outline": "策展規劃大綱...",
                "target_audience": "全體市民"
            }
        ]
    }

@router.get("/history")
def get_history(cur_page: int = 1, size: int = 10, curation_type: str = None):
    return {
        "total": 1,
        "data": [
            {
                "theme_id": "T001",
                "curation_type": curation_type or "trend",
                "title": "時事熱點主題",
                "create_time": "2026-06-15 12:00:00"
            }
        ]
    }
