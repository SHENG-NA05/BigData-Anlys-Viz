import sys
from pathlib import Path

from sqlalchemy import text

CURRENT_FILE = Path(__file__).resolve()
BACKEND_DIR = CURRENT_FILE.parents[2]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db.session import SessionLocal


EXPECTED_EMBEDDING_TYPE = "vector(768)"


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


def main() -> None:
    state = get_pgvector_schema_state()
    errors = validate_pgvector_schema(state)

    print(f"vector_extension={state['vector_extension']}")
    print(f"embedding_type={state['embedding_type']}")
    print(f"hnsw_index={state['hnsw_index']}")

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)

    print("pgvector_schema=ok")


if __name__ == "__main__":
    main()
