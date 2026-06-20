from app.db.verify_pgvector_migration import (
    build_check_database_names,
    database_url_for,
    validate_pgvector_state,
)


def test_build_check_database_names_uses_safe_suffixes():
    fresh, legacy = build_check_database_names("curation-db", "abc123")

    assert fresh == "curation_db_pgvector_fresh_abc123"
    assert legacy == "curation_db_pgvector_legacy_abc123"


def test_database_url_for_replaces_database_name():
    url = database_url_for("postgresql://postgres:postgres@localhost:5432/curation_db", "target_db")

    assert url == "postgresql://postgres:postgres@localhost:5432/target_db"


def test_validate_pgvector_state_accepts_expected_schema():
    assert validate_pgvector_state(
        {
            "vector_extension": True,
            "embedding_type": "vector(768)",
            "hnsw_index": True,
        }
    ) == []


def test_validate_pgvector_state_reports_schema_errors():
    assert validate_pgvector_state(
        {
            "vector_extension": False,
            "embedding_type": "json",
            "hnsw_index": False,
        }
    ) == [
        "missing vector extension",
        "unexpected embedding type: 'json'",
        "missing HNSW cosine embedding index",
    ]
