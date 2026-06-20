from app.db.verify_pgvector_query import validate_pgvector_query_results


def test_validate_pgvector_query_results_accepts_semantic_matches():
    errors = validate_pgvector_query_results(
        [
            {
                "book_id": 1,
                "match_reason": "pgvector語意相似度: 93%",
            }
        ]
    )

    assert errors == []


def test_validate_pgvector_query_results_rejects_empty_matches():
    assert validate_pgvector_query_results([]) == ["pgvector query returned no catalog matches"]


def test_validate_pgvector_query_results_rejects_text_fallback_only():
    errors = validate_pgvector_query_results(
        [
            {
                "book_id": 1,
                "match_reason": "ai: title",
            }
        ]
    )

    assert errors == ["catalog matching did not use pgvector semantic results"]
