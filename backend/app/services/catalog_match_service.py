import logging
from app.crud.catalog import list_catalog_books
from app.db.models import CatalogBook
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)

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


def _cosine_similarity(v1: list[float], v2: list[float]) -> float:
    """計算兩向量的餘弦相似度"""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot_product = sum(a * b for a, b in zip(v1, v2))
    mag1 = math.sqrt(sum(a * a for a in v1))
    mag2 = math.sqrt(sum(b * b for b in v2))
    if mag1 == 0.0 or mag2 == 0.0:
        return 0.0
    return dot_product / (mag1 * mag2)


def match_catalog_books(db, keywords: list[str], limit: int = 5) -> list[dict]:
    """
    匹配館藏圖書

    1. 優先使用 pgvector 對已匯入的館藏 embedding 進行 cosine distance 查詢。
    2. 若 AI embedding 或 pgvector 查詢不可用，降級使用關鍵字與分類號文字匹配。
    """
    normalized_keywords = _dedupe_keywords(keywords)
    if not normalized_keywords:
        return []

    try:
        ai_service = AIService()
        query_text = " ".join(normalized_keywords)
        query_emb = ai_service.get_embedding(query_text)
        if query_emb:
            vector_matches = query_catalog_books_by_vector(db, query_emb, limit)
            if vector_matches:
                logger.info("啟用 pgvector 館藏語意匹配 (查詢: %s)", query_text)
                return vector_matches
    except Exception as exc:
        logger.warning("pgvector 語意匹配失敗，自動降級使用純文字匹配：%s", str(exc))

    books = list_catalog_books(db, skip=0, limit=500)
    ranked_books = rank_catalog_books(books, normalized_keywords)
    return [_book_to_match_result(book, score, reasons) for book, score, reasons in ranked_books[:limit]]


def query_catalog_books_by_vector(db, query_embedding: list[float], limit: int = 5) -> list[dict]:
    distance = CatalogBook.embedding.cosine_distance(query_embedding).label("distance")
    rows = (
        db.query(CatalogBook, distance)
        .filter(CatalogBook.embedding.isnot(None))
        .order_by(distance, CatalogBook.publication_year.desc().nullslast(), CatalogBook.title)
        .limit(limit)
        .all()
    )
    return [_book_to_vector_match_result(book, distance_value) for book, distance_value in rows]


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


def _book_to_vector_match_result(book: CatalogBook, distance: float | None) -> dict:
    similarity = _distance_to_similarity(distance)
    return _book_to_match_result(
        book,
        round(similarity * 100, 2),
        [f"pgvector語意相似度: {int(similarity * 100)}%"],
    )


def _distance_to_similarity(distance: float | None) -> float:
    if distance is None:
        return 0.0
    return max(0.0, min(1.0, 1.0 - float(distance)))


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
