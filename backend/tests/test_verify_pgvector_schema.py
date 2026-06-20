from app.db.verify_pgvector_schema import (
    validate_catalog_embeddings,
    validate_pgvector_schema,
)


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


def test_validate_catalog_embeddings_accepts_imported_768_dimension_embeddings():
    errors = validate_catalog_embeddings(
        {
            "total_count": 50,
            "embedded_count": 50,
            "invalid_dimension_count": 0,
        }
    )

    assert errors == []


def test_validate_catalog_embeddings_reports_missing_or_invalid_embeddings():
    errors = validate_catalog_embeddings(
        {
            "total_count": 0,
            "embedded_count": 0,
            "invalid_dimension_count": 2,
        }
    )

    assert errors == [
        "catalog_books has no rows",
        "catalog_books has no stored embeddings",
        "catalog_books has 2 embeddings with dimension other than 768",
    ]
