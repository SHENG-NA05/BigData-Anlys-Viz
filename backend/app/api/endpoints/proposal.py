from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.crud.curation import get_curation_theme
from app.crud.proposal import create_proposal, get_proposal as get_proposal_record
from app.crud.proposal import update_proposal as update_proposal_record
from app.db.models import Proposal
from app.db.session import get_db
from app.schemas.proposal import ProposalExportRequest, ProposalUpdateRequest
from app.services.ai_service import AIService, AIServiceError
from app.services.catalog_match_service import match_catalog_books

router = APIRouter()

# 共用 AI 服務實例（延遲初始化 Gemini 模型）
_ai_service = AIService()


@router.get("/proposals/{proposal_id}")
def get_proposal(proposal_id: str, db: Session = Depends(get_db)):
    proposal = get_proposal_record(db, proposal_id)
    if proposal is None:
        raise HTTPException(status_code=404, detail=f"Proposal not found: {proposal_id}")

    return {
        "status": "success",
        "data": _proposal_to_response(proposal),
    }


@router.put("/proposals/{proposal_id}")
def update_proposal(
    proposal_id: str,
    request: ProposalUpdateRequest,
    db: Session = Depends(get_db),
):
    proposal = get_proposal_record(db, proposal_id)
    if proposal is None:
        raise HTTPException(status_code=404, detail=f"Proposal not found: {proposal_id}")

    try:
        update_proposal_record(db, proposal, request.title, request.content, request.status)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update proposal") from exc

    return {
        "status": "success",
        "data": _proposal_to_response(proposal),
    }


@router.post("/export_to_proposal")
def export_to_proposal(request: ProposalExportRequest, db: Session = Depends(get_db)):
    """
    拋轉至企劃管理中心（建立企劃草案）

    1. 驗證來源策展主題存在
    2. 呼叫 AI 擴寫企劃書草案（HTML 格式）
    3. 匹配相關館藏書籍
    4. 建立企劃書記錄存入資料庫
    """
    theme = get_curation_theme(db, request.theme_id)
    if theme is None:
        raise HTTPException(status_code=404, detail=f"Curation theme not found: {request.theme_id}")

    # 呼叫 AI 擴寫企劃書內容（HTML 格式）
    try:
        ai_content = _ai_service.expand_proposal(
            title=request.title,
            outline=request.outline,
            target_audience=request.target_audience,
        )
    except AIServiceError as exc:
        # AI 擴寫失敗時，使用基礎模板作為降級方案（Fallback）
        ai_content = _build_fallback_content(request)
        import logging
        logging.getLogger(__name__).warning(
            "AI 企劃書擴寫失敗，使用降級模板：%s", str(exc)
        )

    # 匹配館藏書籍
    matched_books = match_catalog_books(db, _build_match_keywords(theme, request))

    proposal = Proposal(
        proposal_id=_generate_proposal_id(),
        theme_id=request.theme_id,
        title=request.title,
        content=ai_content,
        matched_books=matched_books,
        status="draft",
    )

    try:
        create_proposal(db, proposal)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create proposal") from exc

    return {
        "status": "success",
        "proposal_id": proposal.proposal_id,
        "message": "已成功建立企劃書草案，請至企劃管理中心編輯。",
    }


def _generate_proposal_id() -> str:
    return "P" + datetime.now().strftime("%Y%m%d%H%M%S%f")


def _build_fallback_content(request: ProposalExportRequest) -> str:
    """AI 擴寫失敗時的降級方案：使用基礎 HTML 模板。"""
    return (
        f"<h1>策展宗旨與目標</h1>"
        f"<p>本次策展主題為「{request.title}」，"
        f"旨在為{request.target_audience}提供豐富的閱讀體驗。</p>"
        f"<h1>展區規劃與空間佈置</h1>"
        f"<p>{request.outline}</p>"
        f"<p>（本草案因 AI 服務暫時無法使用，僅提供基礎架構，請於編輯器中自行補充完善。）</p>"
        f"<h1>宣傳與推廣時程</h1>"
        f"<p>請依據實際展期規劃前、中、後期之宣傳活動。</p>"
        f"<h1>預算與資源評估</h1>"
        f"<p>請依據展覽規模編列相關預算。</p>"
    )


def _build_match_keywords(theme, request: ProposalExportRequest) -> list[str]:
    return [
        *(theme.keywords or []),
        theme.title,
        request.title,
        request.outline,
        request.target_audience,
    ]


def _proposal_to_response(proposal: Proposal) -> dict:
    return {
        "proposal_id": proposal.proposal_id,
        "theme_id": proposal.theme_id,
        "title": proposal.title,
        "content": proposal.content,
        "matched_books": proposal.matched_books,
        "status": proposal.status,
        "created_at": proposal.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": proposal.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
    }
