from app.crud.catalog import list_catalog_books
from app.db.models import CatalogBook


KEYWORD_CLASSIFICATION_PREFIXES = {
    "ai": ["540"],
    "人工智慧": ["540"],
    "生成式": ["540"],
    "資料": ["540"],
    "數據": ["540"],
    "python": ["540"],
    "城市": ["900"],
    "地方": ["900"],
    "高雄": ["900"],
    "歷史": ["900"],
    "親子": ["800"],
    "閱讀": ["800"],
    "文學": ["850"],
    "健康": ["410"],
    "科學": ["500"],
}


def match_catalog_books(db, keywords: list[str], limit: int = 5) -> list[dict]:
    books = list_catalog_books(db, skip=0, limit=500)
    ranked_books = rank_catalog_books(books, keywords)
    return [_book_to_match_result(book, score, reasons) for book, score, reasons in ranked_books[:limit]]


def rank_catalog_books(books: list[CatalogBook], keywords: list[str]) -> list[tuple[CatalogBook, float, list[str]]]:
    normalized_keywords = _dedupe_keywords(keywords)
    if not normalized_keywords:
        return []

    ranked = []
    for book in books:
        score, reasons = _score_book(book, normalized_keywords)
        if score > 0:
            ranked.append((book, score, reasons))

    return sorted(ranked, key=lambda item: (-item[1], -(item[0].publication_year or 0), item[0].title))


def _score_book(book: CatalogBook, keywords: list[str]) -> tuple[float, list[str]]:
    score = 0.0
    reasons = []
    title = _normalize_keyword(book.title)
    summary = _normalize_keyword(book.summary)
    author = _normalize_keyword(book.author)
    publisher = _normalize_keyword(book.publisher)
    classification_no = str(book.classification_no or "")

    for keyword in keywords:
        matched_fields = []
        if keyword in title:
            score += 3.0
            matched_fields.append("title")
        if keyword in summary:
            score += 2.0
            matched_fields.append("summary")
        if keyword in author:
            score += 1.0
            matched_fields.append("author")
        if keyword in publisher:
            score += 0.5
            matched_fields.append("publisher")
        if _matches_classification(keyword, classification_no):
            score += 1.5
            matched_fields.append("classification")
        if matched_fields:
            reasons.append(f"{keyword}: {', '.join(matched_fields)}")

    return round(score, 2), reasons


def _matches_classification(keyword: str, classification_no: str) -> bool:
    prefixes = KEYWORD_CLASSIFICATION_PREFIXES.get(keyword, [])
    return any(classification_no.startswith(prefix) for prefix in prefixes)


def _book_to_match_result(book: CatalogBook, score: float, reasons: list[str]) -> dict:
    return {
        "book_id": book.id,
        "title": book.title,
        "isbn": book.isbn,
        "author": book.author,
        "publisher": book.publisher,
        "publication_year": book.publication_year,
        "classification_no": book.classification_no,
        "match_score": score,
        "match_reason": "; ".join(reasons),
    }


def _normalize_keyword(value: object | None) -> str:
    return str(value or "").strip().lower()


def _dedupe_keywords(keywords: list[str]) -> list[str]:
    normalized_keywords = []
    seen = set()
    for keyword in keywords:
        normalized = _normalize_keyword(keyword)
        if not normalized or normalized in seen:
            continue
        normalized_keywords.append(normalized)
        seen.add(normalized)
    return normalized_keywords
