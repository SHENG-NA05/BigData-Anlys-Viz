from app.db.models import Proposal
from app.api.endpoints.proposal import generate_docx, generate_pdf

def make_fake_proposal():
    return Proposal(
        proposal_id="P123",
        title="AI Curation Proposal",
        content=(
            "<h1>AI Curation</h1>"
            "<p>This is a paragraph.</p>"
            "<ul><li>Item 1</li><li>Item 2</li></ul>"
            "<table><tr><td>Cell 1</td><td>Cell 2</td></tr></table>"
        ),
        matched_books=[
            {"title": "AI Book 1", "author": "Author 1", "isbn": "11111", "classification_no": "540"}
        ],
        status="draft"
    )

def test_generate_docx_success():
    proposal = make_fake_proposal()
    content_bytes = generate_docx(proposal)
    assert content_bytes is not None
    assert len(content_bytes) > 0
    # docx starts with zip file signature 'PK\x03\x04'
    assert content_bytes.startswith(b"PK\x03\x04")

def test_generate_pdf_success():
    proposal = make_fake_proposal()
    content_bytes = generate_pdf(proposal)
    assert content_bytes is not None
    assert len(content_bytes) > 0
    # pdf starts with PDF magic '%PDF'
    assert content_bytes.startswith(b"%PDF")
