from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.crud.curation import create_curation_theme, list_curation_themes
from app.db.models import CurationTheme
from app.db.session import get_db
from app.schemas.curation import CurationRequest

router = APIRouter()


@router.post("/generate_themes")
def generate_themes(request: CurationRequest, db: Session = Depends(get_db)):
    keyword = request.keywords[0] if request.keywords else "general reading"
    theme = CurationTheme(
        theme_id=_generate_theme_id(),
        curation_type=request.curation_type,
        title=f"Curation theme: {keyword}",
        outline="A mock curation outline for integration testing.",
        target_audience="General readers",
        keywords=request.keywords,
        prompt=request.prompt,
        year=request.year,
    )
    create_curation_theme(db, theme)

    return {
        "status": "success",
        "data": [
            {
                "theme_id": theme.theme_id,
                "title": theme.title,
                "outline": theme.outline,
                "target_audience": theme.target_audience,
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
    total, themes = list_curation_themes(db, cur_page=cur_page, size=size, curation_type=curation_type)

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


def _generate_theme_id() -> str:
    return "T" + datetime.now().strftime("%Y%m%d%H%M%S%f")
