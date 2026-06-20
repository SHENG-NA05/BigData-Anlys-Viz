from app.db.models import CatalogBook
from app.services import catalog_match_service
from app.services.catalog_match_service import (
    _distance_to_similarity,
    match_catalog_books,
    rank_catalog_books,
)


def test_rank_catalog_books_matches_keywords_and_classification():
    ai_book = CatalogBook(
        id=1,
        title="AI 時代的資料素養",
        isbn="9789860000016",
        author="資料策展小組",
        publisher="智慧圖書出版",
        publication_year=2026,
        classification_no="540.123",
        summary="介紹人工智慧、資料分析與圖書館應用。",
    )
    city_book = CatalogBook(
        id=2,
        title="城市地方記憶",
        isbn="9789860000023",
        author="城市研究小組",
        publisher="地方文化出版",
        publication_year=2024,
        classification_no="900.321",
        summary="整理高雄城市發展與地方故事。",
    )

    ranked = rank_catalog_books([city_book, ai_book], ["AI", "資料"])

    assert len(ranked) == 1
    assert ranked[0][0] is ai_book
    assert "ai: title" in ranked[0][2][0]


def test_rank_catalog_books_returns_empty_when_no_keyword_matches():
    book = CatalogBook(
        id=1,
        title="城市地方記憶",
        isbn="9789860000023",
        classification_no="900.321",
        summary="整理高雄城市發展與地方故事。",
    )

    assert rank_catalog_books([book], ["健康飲食"]) == []


def test_match_catalog_books_uses_pgvector_before_text_fallback(monkeypatch):
    class FakeAIService:
        def get_embedding(self, text):
            assert text == "ai 資料"
            return [0.1] * 768

    expected_matches = [{"book_id": 1, "match_score": 90.0}]
    monkeypatch.setattr(catalog_match_service, "AIService", lambda: FakeAIService())
    monkeypatch.setattr(
        catalog_match_service,
        "query_catalog_books_by_vector",
        lambda db, embedding, limit: expected_matches,
    )
    monkeypatch.setattr(
        catalog_match_service,
        "list_catalog_books",
        lambda db, skip=0, limit=500: (_ for _ in ()).throw(AssertionError("fallback should not run")),
    )

    assert match_catalog_books(object(), ["AI", "資料"]) == expected_matches


def test_match_catalog_books_falls_back_to_text_when_vector_unavailable(monkeypatch):
    book = CatalogBook(
        id=1,
        title="AI 時代的資料素養",
        isbn="9789860000016",
        publication_year=2026,
        classification_no="540.123",
        summary="介紹人工智慧、資料分析與圖書館應用。",
    )

    class FakeAIService:
        def get_embedding(self, text):
            return []

    monkeypatch.setattr(catalog_match_service, "AIService", lambda: FakeAIService())
    monkeypatch.setattr(catalog_match_service, "list_catalog_books", lambda db, skip=0, limit=500: [book])

    results = match_catalog_books(object(), ["AI"], limit=1)

    assert results[0]["book_id"] == 1
    assert "ai: title" in results[0]["match_reason"]


def test_distance_to_similarity_is_clamped():
    assert _distance_to_similarity(None) == 0.0
    assert _distance_to_similarity(-0.5) == 1.0
    assert _distance_to_similarity(0.25) == 0.75
    assert _distance_to_similarity(1.5) == 0.0
