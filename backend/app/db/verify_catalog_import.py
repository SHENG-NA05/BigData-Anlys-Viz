import argparse
import sys
from pathlib import Path

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy import func
from sqlalchemy.engine import make_url

CURRENT_FILE = Path(__file__).resolve()
BACKEND_DIR = CURRENT_FILE.parents[2]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings
from app.db.init_db import init_db
from app.db.models import CatalogBook
from app.db.session import SessionLocal
from app.services.catalog_service import CatalogService


def create_database_if_missing(database_url: str) -> str:
    url = make_url(database_url)
    database_name = url.database
    if not database_name:
        raise RuntimeError("DATABASE_URL must include a database name")

    maintenance_url = url.set(database="postgres")
    rendered_url = maintenance_url.render_as_string(hide_password=False)

    try:
        connection = psycopg2.connect(rendered_url, connect_timeout=5)
    except psycopg2.OperationalError as exc:
        raise RuntimeError(
            "Cannot connect to PostgreSQL. Make sure PostgreSQL is running and DATABASE_URL is correct."
        ) from exc

    connection.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (database_name,))
            exists = cursor.fetchone() is not None
            if not exists:
                cursor.execute(f'CREATE DATABASE "{database_name}"')
                return f"created database {database_name}"
            return f"database {database_name} already exists"
    finally:
        connection.close()


def import_catalog(csv_path: Path, clear_catalog: bool) -> int:
    if not csv_path.exists():
        raise RuntimeError(f"CSV file not found: {csv_path}")

    db = SessionLocal()
    try:
        if clear_catalog:
            db.query(CatalogBook).delete()
            db.commit()
        return CatalogService().import_csv_path(db, csv_path)
    finally:
        db.close()


def count_catalog_books() -> int:
    db = SessionLocal()
    try:
        return db.query(func.count(CatalogBook.id)).scalar() or 0
    finally:
        db.close()


def parse_args():
    parser = argparse.ArgumentParser(description="Initialize PostgreSQL and verify catalog CSV import.")
    parser.add_argument(
        "--csv",
        type=Path,
        default=Path("data/fake_catalog_sample.csv"),
        help="CSV file to import.",
    )
    parser.add_argument(
        "--clear-catalog",
        action="store_true",
        help="Delete catalog_books rows before importing the CSV.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    try:
        print(create_database_if_missing(settings.DATABASE_URL))
        init_db()
        imported_count = import_catalog(args.csv, clear_catalog=args.clear_catalog)
        total_count = count_catalog_books()
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc

    print(f"imported_count={imported_count}")
    print(f"catalog_books_total={total_count}")


if __name__ == "__main__":
    main()
