import argparse
import sys
from pathlib import Path

from sqlalchemy import text

CURRENT_FILE = Path(__file__).resolve()
BACKEND_DIR = CURRENT_FILE.parents[2]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db.session import SessionLocal


EXPECTED_EMBEDDING_TYPE = "vector(768)"
EXPECTED_EMBEDDING_DIMENSION = 768


def get_pgvector_schema_state() -> dict[str, object]:
    db = SessionLocal()
    try:
        vector_extension = db.execute(
            text("SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')")
        ).scalar()
        embedding_type = db.execute(
            text(
                """
                SELECT format_type(attribute.atttypid, attribute.atttypmod)
                FROM pg_attribute AS attribute
                JOIN pg_class AS relation ON relation.oid = attribute.attrelid
                JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
                WHERE namespace.nspname = 'public'
                  AND relation.relname = 'catalog_books'
                  AND attribute.attname = 'embedding'
                  AND attribute.attnum > 0
                  AND NOT attribute.attisdropped
                """
            )
        ).scalar()
        hnsw_index = db.execute(
            text(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM pg_indexes
                    WHERE schemaname = 'public'
                      AND tablename = 'catalog_books'
                      AND indexname = 'idx_catalog_books_embedding'
                      AND indexdef ILIKE '%USING hnsw%'
                      AND indexdef ILIKE '%vector_cosine_ops%'
                )
                """
            )
        ).scalar()
    finally:
        db.close()

    return {
        "vector_extension": bool(vector_extension),
        "embedding_type": embedding_type,
        "hnsw_index": bool(hnsw_index),
    }


def validate_pgvector_schema(state: dict[str, object]) -> list[str]:
    errors = []
    if not state.get("vector_extension"):
        errors.append("missing PostgreSQL vector extension")
    if state.get("embedding_type") != EXPECTED_EMBEDDING_TYPE:
        errors.append(
            f"catalog_books.embedding type is {state.get('embedding_type')!r}, "
            f"expected {EXPECTED_EMBEDDING_TYPE!r}"
        )
    if not state.get("hnsw_index"):
        errors.append("missing idx_catalog_books_embedding HNSW cosine index")
    return errors


def get_catalog_embedding_state() -> dict[str, int]:
    db = SessionLocal()
    try:
        row = db.execute(
            text(
                """
                SELECT
                    COUNT(*) AS total_count,
                    COUNT(embedding) AS embedded_count,
                    COUNT(*) FILTER (
                        WHERE embedding IS NOT NULL
                          AND vector_dims(embedding) <> :expected_dimension
                    ) AS invalid_dimension_count
                FROM catalog_books
                """
            ),
            {"expected_dimension": EXPECTED_EMBEDDING_DIMENSION},
        ).mappings().one()
    finally:
        db.close()

    return {
        "total_count": int(row["total_count"] or 0),
        "embedded_count": int(row["embedded_count"] or 0),
        "invalid_dimension_count": int(row["invalid_dimension_count"] or 0),
    }


def validate_catalog_embeddings(state: dict[str, int]) -> list[str]:
    errors = []
    if state.get("total_count", 0) <= 0:
        errors.append("catalog_books has no rows")
    if state.get("embedded_count", 0) <= 0:
        errors.append("catalog_books has no stored embeddings")
    if state.get("invalid_dimension_count", 0) > 0:
        errors.append(
            f"catalog_books has {state['invalid_dimension_count']} embeddings "
            f"with dimension other than {EXPECTED_EMBEDDING_DIMENSION}"
        )
    return errors


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Verify PostgreSQL pgvector catalog schema.")
    parser.add_argument(
        "--require-catalog-embeddings",
        action="store_true",
        help="Also require imported catalog rows to have 768-dimension embeddings.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    state = get_pgvector_schema_state()
    errors = validate_pgvector_schema(state)

    print(f"vector_extension={state['vector_extension']}")
    print(f"embedding_type={state['embedding_type']}")
    print(f"hnsw_index={state['hnsw_index']}")

    if args.require_catalog_embeddings:
        embedding_state = get_catalog_embedding_state()
        errors.extend(validate_catalog_embeddings(embedding_state))
        print(f"catalog_books_total={embedding_state['total_count']}")
        print(f"catalog_books_with_embedding={embedding_state['embedded_count']}")
        print(f"invalid_embedding_dimensions={embedding_state['invalid_dimension_count']}")

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)

    print("pgvector_schema=ok")


if __name__ == "__main__":
    main()
