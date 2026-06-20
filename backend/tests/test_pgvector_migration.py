from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory


BACKEND_DIR = Path(__file__).resolve().parents[1]
MIGRATION_PATH = BACKEND_DIR / "alembic" / "versions" / "20260620_0002_add_catalog_embedding_vector.py"


def test_alembic_has_single_pgvector_head():
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    script = ScriptDirectory.from_config(config)

    assert script.get_heads() == ["20260620_0002"]
    revision = script.get_revision("20260620_0002")
    assert revision is not None
    assert revision.down_revision == "20260616_0001"


def test_pgvector_migration_contains_required_schema_changes():
    migration = MIGRATION_PATH.read_text(encoding="utf-8")

    assert "CREATE EXTENSION IF NOT EXISTS vector" in migration
    assert "embedding vector(768)" in migration
    assert "idx_catalog_books_embedding" in migration
    assert "USING hnsw" in migration
    assert "vector_cosine_ops" in migration
    assert "DROP INDEX IF EXISTS idx_catalog_books_embedding" in migration
    assert "DROP COLUMN IF EXISTS embedding" in migration
