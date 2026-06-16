from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.crud.curation import create_curation_theme, list_curation_themes
from app.db.models import CurationTheme
from app.db.session import get_db
from app.schemas.curation import CurationRequest
from app.services.ai_service import AIService, AIServiceError

router = APIRouter()

# 共用 AI 服務實例（延遲初始化 Gemini 模型）
_ai_service = AIService()


@router.post("/generate_themes")
def generate_themes(request: CurationRequest, db: Session = Depends(get_db)):
    """
    AI 智慧策展主題生成

    接收策展類型、關鍵字等參數，呼叫 Gemini API 生成 3 個策展主題大綱，
    並將每個主題存入資料庫，回傳主題清單。
    """
    try:
        ai_themes = _ai_service.generate_themes(
            curation_type=request.curation_type,
            keywords=request.keywords,
            prompt=request.prompt,
            year=request.year,
        )
    except AIServiceError as exc:
        raise HTTPException(status_code=502, detail=f"AI 服務錯誤：{str(exc)}") from exc

    # 將 AI 生成的每個主題存入資料庫
    saved_themes = []
    for ai_theme in ai_themes:
        theme = CurationTheme(
            theme_id=_generate_theme_id(),
            curation_type=request.curation_type,
            title=ai_theme["title"],
            outline=ai_theme["outline"],
            target_audience=ai_theme["target_audience"],
            keywords=request.keywords,
            prompt=request.prompt,
            year=request.year,
        )
        create_curation_theme(db, theme)
        saved_themes.append({
            "theme_id": theme.theme_id,
            "title": theme.title,
            "outline": theme.outline,
            "target_audience": theme.target_audience,
        })

    return {
        "status": "success",
        "data": saved_themes,
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
