from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.crud.curation import create_curation_theme, list_curation_themes
from app.db.models import CurationTheme
from app.db.session import get_db
from app.schemas.curation import CurationRequest
from app.services.ai_service import AIService, AIServiceError
from app.services.rss_service import RSSService

router = APIRouter()

# 共用服務實例
_ai_service = AIService()
_rss_service = RSSService()



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

    # 紀錄效益日誌 (每次點擊發想生成：省下 2.0 小時)
    try:
        from app.db.models import CostBenefitLog, SystemSetting
        rate_setting = db.query(SystemSetting).filter(SystemSetting.setting_key == "hourly_rate").first()
        hourly_rate = float(rate_setting.setting_value) if rate_setting else 200.0
        target_id = saved_themes[0]["theme_id"] if saved_themes else None
        log = CostBenefitLog(
            action="theme_generation",
            target_id=target_id,
            time_saved_hours=2.0,
            cost_saved_amount=2.0 * hourly_rate,
        )
        db.add(log)
        db.commit()
    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning("記錄效益日誌失敗：%s", str(exc))

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


@router.get("/rss/trends")
def get_rss_trends():
    """
    時事熱門話題抓取
    """
    keywords = _rss_service.get_trending_keywords()
    return {
        "status": "success",
        "data": keywords
    }


def _generate_theme_id() -> str:
    return "T" + datetime.now().strftime("%Y%m%d%H%M%S%f")


@router.delete("/themes/{theme_id}")
def delete_theme(theme_id: str, db: Session = Depends(get_db)):
    theme = db.query(CurationTheme).filter(CurationTheme.theme_id == theme_id).first()
    if not theme:
        raise HTTPException(status_code=404, detail="Theme not found")
    
    db.delete(theme)
    db.commit()
    return {"status": "success", "message": f"Theme {theme_id} deleted"}

