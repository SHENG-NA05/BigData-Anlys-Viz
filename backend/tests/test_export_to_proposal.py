from datetime import datetime

import pytest
from fastapi import HTTPException

from app.api.endpoints.proposal import export_to_proposal, get_proposal
from app.db.models import CurationTheme, Proposal
from app.schemas.proposal import ProposalExportRequest


class FakeDb:
    def __init__(self, theme=None):
        self.theme = theme
        self.items = []
        self.committed = False
        self.refreshed = False
        self.rolled_back = False

    def get(self, model, key):
        if model is CurationTheme and self.theme and self.theme.theme_id == key:
            return self.theme
        if model is Proposal and self.items:
            return next((item for item in self.items if item.proposal_id == key), None)
        return None

    def add(self, item):
        self.items.append(item)

    def commit(self):
        self.committed = True

    def refresh(self, item):
        self.refreshed = True

    def rollback(self):
        self.rolled_back = True


def make_request():
    return ProposalExportRequest(
        theme_id="T001",
        title="AI Reading Future",
        outline="Plan a curation area for AI literacy books.",
        target_audience="General readers",
    )


def test_export_to_proposal_creates_proposal_record():
    theme = CurationTheme(
        theme_id="T001",
        curation_type="trend",
        title="AI Reading Future",
        outline="AI outline",
        target_audience="General readers",
        keywords=["AI"],
    )
    db = FakeDb(theme=theme)

    response = export_to_proposal(make_request(), db=db)

    assert db.committed is True
    assert db.refreshed is True
    assert len(db.items) == 1

    proposal = db.items[0]
    assert proposal.proposal_id.startswith("P")
    assert proposal.theme_id == "T001"
    assert proposal.title == "AI Reading Future"
    assert proposal.status == "draft"
    assert "Plan a curation area for AI literacy books." in proposal.content
    assert response == {
        "status": "success",
        "proposal_id": proposal.proposal_id,
        "message": "Proposal draft created successfully",
    }


def test_export_to_proposal_returns_404_when_theme_missing():
    db = FakeDb(theme=None)

    with pytest.raises(HTTPException) as exc_info:
        export_to_proposal(make_request(), db=db)

    assert exc_info.value.status_code == 404
    assert "Curation theme not found" in exc_info.value.detail
    assert db.items == []
    assert db.committed is False


def test_get_proposal_returns_proposal_draft():
    proposal = Proposal(
        proposal_id="P001",
        theme_id="T001",
        title="AI Reading Future",
        content="<h1>AI Reading Future</h1>",
        matched_books=None,
        status="draft",
        created_at=datetime(2026, 6, 16, 10, 0, 0),
        updated_at=datetime(2026, 6, 16, 10, 5, 0),
    )
    db = FakeDb()
    db.items.append(proposal)

    response = get_proposal("P001", db=db)

    assert response == {
        "status": "success",
        "data": {
            "proposal_id": "P001",
            "theme_id": "T001",
            "title": "AI Reading Future",
            "content": "<h1>AI Reading Future</h1>",
            "matched_books": None,
            "status": "draft",
            "created_at": "2026-06-16 10:00:00",
            "updated_at": "2026-06-16 10:05:00",
        },
    }


def test_get_proposal_returns_404_when_missing():
    with pytest.raises(HTTPException) as exc_info:
        get_proposal("missing", db=FakeDb())

    assert exc_info.value.status_code == 404
    assert "Proposal not found" in exc_info.value.detail
