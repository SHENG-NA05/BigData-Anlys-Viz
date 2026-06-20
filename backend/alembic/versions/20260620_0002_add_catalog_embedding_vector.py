"""add catalog embedding vector

Revision ID: 20260620_0002
Revises: 20260616_0001
Create Date: 2026-06-20
"""

from alembic import op


revision = "20260620_0002"
down_revision = "20260616_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("ALTER TABLE catalog_books ADD COLUMN IF NOT EXISTS embedding vector(768)")
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_catalog_books_embedding
        ON catalog_books
        USING hnsw (embedding vector_cosine_ops)
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_catalog_books_embedding")
    op.execute("ALTER TABLE catalog_books DROP COLUMN IF EXISTS embedding")
