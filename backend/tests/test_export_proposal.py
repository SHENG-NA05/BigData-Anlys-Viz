import pytest
from datetime import datetime
from app.api.endpoints.proposal import export_proposal
from app.db.models import Proposal

class FakeDb:
    def __init__(self, proposal=None):
        self.proposal = proposal
        self.added = []
        self.committed = False

    def get(self, model, key):
        if model is Proposal and self.proposal and self.proposal.proposal_id == key:
            return self.proposal
        return None

    def query(self, model):
        return self

    def filter(self, *args):
        return self

    def first(self):
        return None  # Will fallback to default hourly_rate of 200.0

    def add(self, item):
        self.added.append(item)

    def commit(self):
        self.committed = True

def test_export_proposal_docx():
    proposal = Proposal(
        proposal_id="P001",
        theme_id="T001",
        title="AI Reading Future",
        content="<h1>AI Reading Future</h1><p>Some content</p><table><tr><td>Row 1</td></tr></table>",
        matched_books=[{"title": "Book A", "author": "Author A", "isbn": "123", "classification_no": "456"}],
        status="draft",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    db = FakeDb(proposal=proposal)
    
    response = export_proposal("P001", format="docx", db=db)
    assert response is not None
    assert response.media_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    assert "Content-Disposition" in response.headers

def test_export_proposal_pdf():
    proposal = Proposal(
        proposal_id="P001",
        theme_id="T001",
        title="AI Reading Future",
        content="<h1>AI Reading Future</h1><h2>H2 Heading</h2><p>Some content</p><ul><li>Item 1</li></ul><table><tr><td>Row 1</td></tr></table>",
        matched_books=[{"title": "Book A", "author": "Author A", "isbn": "123", "classification_no": "456"}],
        status="draft",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    db = FakeDb(proposal=proposal)
    
    response = export_proposal("P001", format="pdf", db=db)
    assert response is not None
    assert response.media_type == "application/pdf"
    assert "Content-Disposition" in response.headers
