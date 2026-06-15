from sqlalchemy.orm import Session

from app.db.models import Proposal


def create_proposal(db: Session, proposal: Proposal) -> Proposal:
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    return proposal


def get_proposal(db: Session, proposal_id: str) -> Proposal | None:
    return db.get(Proposal, proposal_id)


def update_proposal(
    db: Session,
    proposal: Proposal,
    title: str,
    content: str,
    status: str,
) -> Proposal:
    proposal.title = title
    proposal.content = content
    proposal.status = status
    db.commit()
    db.refresh(proposal)
    return proposal
