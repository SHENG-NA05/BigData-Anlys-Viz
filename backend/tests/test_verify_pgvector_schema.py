from app.db.verify_pgvector_schema import validate_pgvector_schema


def test_validate_pgvector_schema_accepts_expected_state():
    errors = validate_pgvector_schema(
        {
            "vector_extension": True,
            "embedding_type": "vector(768)",
            "hnsw_index": True,
        }
    )

    assert errors == []


def test_validate_pgvector_schema_reports_missing_items():
    errors = validate_pgvector_schema(
        {
            "vector_extension": False,
            "embedding_type": "json",
            "hnsw_index": False,
        }
    )

    assert errors == [
        "missing PostgreSQL vector extension",
        "catalog_books.embedding type is 'json', expected 'vector(768)'",
        "missing idx_catalog_books_embedding HNSW cosine index",
    ]
