from app.db.models import CatalogBook
from app.services.catalog_match_service import rank_catalog_books


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
