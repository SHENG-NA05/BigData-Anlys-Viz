import argparse
import os
import subprocess
import sys
import uuid
from pathlib import Path

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy.engine import make_url

CURRENT_FILE = Path(__file__).resolve()
BACKEND_DIR = CURRENT_FILE.parents[2]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings


def build_check_database_names(base_name: str, suffix: str) -> tuple[str, str]:
    safe_base = "".join(char if char.isalnum() else "_" for char in base_name)
    return (
        f"{safe_base}_pgvector_fresh_{suffix}",
        f"{safe_base}_pgvector_legacy_{suffix}",
    )


def maintenance_url(database_url: str) -> str:
    return make_url(database_url).set(database="postgres").render_as_string(hide_password=False)


def database_url_for(database_url: str, database_name: str) -> str:
    return make_url(database_url).set(database=database_name).render_as_string(hide_password=False)


def connect_maintenance(database_url: str):
    connection = psycopg2.connect(maintenance_url(database_url), connect_timeout=5)
    connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    return connection


def create_database(database_url: str, database_name: str) -> None:
    connection = connect_maintenance(database_url)
    try:
        with connection.cursor() as cursor:
            cursor.execute(f'CREATE DATABASE "{database_name}"')
    finally:
        connection.close()


def drop_database(database_url: str, database_name: str) -> None:
    connection = connect_maintenance(database_url)
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = %s
                  AND pid <> pg_backend_pid()
                """,
                (database_name,),
            )
            cursor.execute(f'DROP DATABASE IF EXISTS "{database_name}"')
    finally:
        connection.close()


def vector_extension_is_available(database_url: str) -> bool:
    with psycopg2.connect(maintenance_url(database_url), connect_timeout=5) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector')")
            return bool(cursor.fetchone()[0])


def run_alembic(database_url: str, revision: str) -> None:
    env = os.environ.copy()
    env["DATABASE_URL"] = database_url
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", revision],
        cwd=BACKEND_DIR,
        env=env,
        check=True,
    )


def fetch_pgvector_schema_state(database_url: str) -> dict[str, object]:
    with psycopg2.connect(database_url, connect_timeout=5) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')")
            vector_extension = cursor.fetchone()[0]
            cursor.execute(
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
            embedding_row = cursor.fetchone()
            cursor.execute(
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
            hnsw_index = cursor.fetchone()[0]

    return {
        "vector_extension": bool(vector_extension),
        "embedding_type": embedding_row[0] if embedding_row else None,
        "hnsw_index": bool(hnsw_index),
    }


def validate_pgvector_state(state: dict[str, object]) -> list[str]:
    errors = []
    if not state.get("vector_extension"):
        errors.append("missing vector extension")
    if state.get("embedding_type") != "vector(768)":
        errors.append(f"unexpected embedding type: {state.get('embedding_type')!r}")
    if not state.get("hnsw_index"):
        errors.append("missing HNSW cosine embedding index")
    return errors


def verify_database(database_url: str, database_name: str, revisions: list[str]) -> list[str]:
    target_url = database_url_for(database_url, database_name)
    create_database(database_url, database_name)
    for revision in revisions:
        run_alembic(target_url, revision)
    return validate_pgvector_state(fetch_pgvector_schema_state(target_url))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Verify pgvector Alembic migration paths with temporary databases.")
    parser.add_argument(
        "--keep-databases",
        action="store_true",
        help="Keep temporary verification databases instead of dropping them.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not vector_extension_is_available(settings.DATABASE_URL):
        print(
            "ERROR: PostgreSQL server does not have pgvector installed. "
            "Start the project Docker Compose postgres service or install pgvector on the current server.",
            file=sys.stderr,
        )
        raise SystemExit(1)

    base_database = make_url(settings.DATABASE_URL).database or "curation_db"
    suffix = uuid.uuid4().hex[:8]
    fresh_db, legacy_db = build_check_database_names(base_database, suffix)
    created_databases = []
    errors = []

    try:
        print(f"fresh_database={fresh_db}")
        created_databases.append(fresh_db)
        fresh_errors = verify_database(settings.DATABASE_URL, fresh_db, ["head"])
        if fresh_errors:
            errors.extend([f"fresh: {error}" for error in fresh_errors])
        else:
            print("fresh_migration=ok")

        print(f"legacy_database={legacy_db}")
        created_databases.append(legacy_db)
        legacy_errors = verify_database(settings.DATABASE_URL, legacy_db, ["20260616_0001", "head"])
        if legacy_errors:
            errors.extend([f"legacy: {error}" for error in legacy_errors])
        else:
            print("legacy_migration=ok")
    finally:
        if not args.keep_databases:
            for database_name in created_databases:
                drop_database(settings.DATABASE_URL, database_name)

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)

    print("pgvector_migration=ok")


if __name__ == "__main__":
    main()
