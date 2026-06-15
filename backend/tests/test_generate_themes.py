from app.api.endpoints.curation import generate_themes
from app.schemas.curation import CurationRequest


class FakeDb:
    def __init__(self):
        self.items = []
        self.committed = False
        self.refreshed = False

    def add(self, item):
        self.items.append(item)

    def commit(self):
        self.committed = True

    def refresh(self, item):
        self.refreshed = True


def test_generate_themes_creates_curation_theme_record():
    db = FakeDb()
    request = CurationRequest(
        curation_type="trend",
        keywords=["AI", "library"],
        prompt="Generate a public library curation theme.",
        year=2026,
    )

    response = generate_themes(request, db=db)

    assert db.committed is True
    assert db.refreshed is True
    assert len(db.items) == 1

    theme = db.items[0]
    assert theme.theme_id.startswith("T")
    assert theme.curation_type == "trend"
    assert theme.title == "Curation theme: AI"
    assert theme.outline == "A mock curation outline for integration testing."
    assert theme.target_audience == "General readers"
    assert theme.keywords == ["AI", "library"]
    assert theme.prompt == "Generate a public library curation theme."
    assert theme.year == 2026

    assert response == {
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


def test_generate_themes_uses_default_keyword_when_empty():
    db = FakeDb()
    request = CurationRequest(curation_type="custom", keywords=[])

    response = generate_themes(request, db=db)

    assert db.items[0].title == "Curation theme: general reading"
    assert response["data"][0]["title"] == "Curation theme: general reading"
