from datetime import datetime

from unittest.mock import patch

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.api.endpoints.proposal import export_to_proposal, get_proposal, update_proposal
from app.db.models import CatalogBook, CurationTheme, Proposal
from app.schemas.proposal import ProposalExportRequest, ProposalUpdateRequest
from app.services.ai_service import AIServiceError


class FakeCatalogQuery:
    def __init__(self, books):
        self.books = books

    def order_by(self, *args):
        return self

    def offset(self, value):
        return self

    def limit(self, value):
        self.books = self.books[:value]
        return self

    def all(self):
        return self.books


class FakeDb:
    def __init__(self, theme=None, catalog_books=None):
        self.theme = theme
        self.catalog_books = catalog_books or []
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

    def query(self, model):
        if model is CatalogBook:
            return FakeCatalogQuery(self.catalog_books)
        raise AssertionError(f"Unexpected query model: {model}")

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


@patch("app.api.endpoints.proposal._ai_service.expand_proposal")
def test_export_to_proposal_creates_proposal_record(mock_expand):
    mock_expand.return_value = "<h1>AI Reading Future</h1><p>Plan a curation area for AI literacy books.</p>"
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
    assert proposal.matched_books == []
    assert "Plan a curation area for AI literacy books." in proposal.content
    assert response == {
        "status": "success",
        "proposal_id": proposal.proposal_id,
        "message": "已成功建立企劃書草案，請至企劃管理中心編輯。",
    }


@patch("app.services.ai_service.AIService.get_embedding")
@patch("app.api.endpoints.proposal._ai_service.expand_proposal")
def test_export_to_proposal_stores_matched_catalog_books(mock_expand, mock_get_embedding):
    mock_get_embedding.return_value = []
    # Depending on python mock decorators, the first argument is mock_expand.
    mock_expand.return_value = "<h1>AI Reading Future</h1><p>Plan a curation area for AI literacy books.</p>"
    theme = CurationTheme(
        theme_id="T001",
        curation_type="trend",
        title="AI Reading Future",
        outline="AI outline",
        target_audience="General readers",
        keywords=["AI", "資料"],
    )
    book = CatalogBook(
        id=10,
        title="AI 時代的資料素養",
        isbn="9789860000016",
        author="資料策展小組",
        publisher="智慧圖書出版",
        publication_year=2026,
        classification_no="540.123",
        summary="介紹人工智慧、資料分析與圖書館應用。",
    )
    db = FakeDb(theme=theme, catalog_books=[book])

    export_to_proposal(make_request(), db=db)

    proposal = db.items[0]
    assert proposal.matched_books == [
        {
            "book_id": 10,
            "title": "AI 時代的資料素養",
            "isbn": "9789860000016",
            "author": "資料策展小組",
            "publisher": "智慧圖書出版",
            "publication_year": 2026,
            "classification_no": "540.123",
            "match_score": 12.0,
            "match_reason": "ai: title, classification; 資料: title, summary, author, classification",
        }
    ]


def test_export_to_proposal_returns_404_when_theme_missing():
    db = FakeDb(theme=None)

    with pytest.raises(HTTPException) as exc_info:
        export_to_proposal(make_request(), db=db)

    assert exc_info.value.status_code == 404
    assert "Curation theme not found" in exc_info.value.detail
    assert db.items == []
    assert db.committed is False


@patch("app.api.endpoints.proposal._ai_service.expand_proposal")
def test_export_to_proposal_does_not_create_fake_draft_when_ai_fails(mock_expand):
    mock_expand.side_effect = AIServiceError("AI unavailable")
    theme = CurationTheme(
        theme_id="T001",
        curation_type="trend",
        title="AI Reading Future",
        outline="AI outline",
        target_audience="General readers",
        keywords=["AI"],
    )
    db = FakeDb(theme=theme)

    with pytest.raises(AIServiceError):
        export_to_proposal(make_request(), db=db)

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


def test_update_proposal_updates_existing_draft():
    proposal = Proposal(
        proposal_id="P001",
        theme_id="T001",
        title="Old Title",
        content="<h1>Old Title</h1>",
        matched_books=None,
        status="draft",
        created_at=datetime(2026, 6, 16, 10, 0, 0),
        updated_at=datetime(2026, 6, 16, 10, 5, 0),
    )
    db = FakeDb()
    db.items.append(proposal)
    request = ProposalUpdateRequest(
        title="Updated Title",
        content="<h1>Updated Title</h1><p>Updated body</p>",
        status="completed",
    )

    response = update_proposal("P001", request, db=db)

    assert db.committed is True
    assert db.refreshed is True
    assert proposal.title == "Updated Title"
    assert proposal.content == "<h1>Updated Title</h1><p>Updated body</p>"
    assert proposal.status == "completed"
    assert response["status"] == "success"
    assert response["data"]["proposal_id"] == "P001"
    assert response["data"]["status"] == "completed"


def test_update_proposal_returns_404_when_missing():
    request = ProposalUpdateRequest(
        title="Updated Title",
        content="<h1>Updated Title</h1>",
        status="completed",
    )

    with pytest.raises(HTTPException) as exc_info:
        update_proposal("missing", request, db=FakeDb())

    assert exc_info.value.status_code == 404
    assert "Proposal not found" in exc_info.value.detail


def test_update_proposal_rejects_invalid_status():
    with pytest.raises(ValidationError):
        ProposalUpdateRequest(
            title="Updated Title",
            content="<h1>Updated Title</h1>",
            status="invalid",
        )
