from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.models import CurationTheme
from app.db.session import get_db
from app.schemas.curation import CurationRequest

router = APIRouter()


@router.post("/generate_themes")
def generate_themes(request: CurationRequest):
    keyword = request.keywords[0] if request.keywords else "general reading"
    return {
        "status": "success",
        "data": [
            {
                "theme_id": "T001",
                "title": f"Curation theme: {keyword}",
                "outline": "A mock curation outline for integration testing.",
                "target_audience": "General readers",
            }
        ],
    }


@router.get("/history")
def get_history(
    cur_page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    curation_type: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(CurationTheme)
    if curation_type:
        query = query.filter(CurationTheme.curation_type == curation_type)

    total = query.count()
    themes = (
        query.order_by(CurationTheme.created_at.desc())
        .offset((cur_page - 1) * size)
        .limit(size)
        .all()
    )

    return {
        "total": total,
        "data": [
            {
                "theme_id": theme.theme_id,
                "curation_type": theme.curation_type,
                "title": theme.title,
                "create_time": theme.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            }
            for theme in themes
        ],
    }
