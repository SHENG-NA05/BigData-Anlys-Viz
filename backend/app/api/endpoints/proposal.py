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

router = APIRouter()


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
    theme = get_curation_theme(db, request.theme_id)
    if theme is None:
        raise HTTPException(status_code=404, detail=f"Curation theme not found: {request.theme_id}")

    proposal = Proposal(
        proposal_id=_generate_proposal_id(),
        theme_id=request.theme_id,
        title=request.title,
        content=_build_proposal_content(request),
        matched_books=None,
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
        "message": "Proposal draft created successfully",
    }


def _generate_proposal_id() -> str:
    return "P" + datetime.now().strftime("%Y%m%d%H%M%S%f")


def _build_proposal_content(request: ProposalExportRequest) -> str:
    return (
        f"<h1>{request.title}</h1>"
        f"<h2>Target Audience</h2><p>{request.target_audience}</p>"
        f"<h2>Curation Outline</h2><p>{request.outline}</p>"
    )


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
