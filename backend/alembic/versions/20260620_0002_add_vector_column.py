"""add vector column

Revision ID: 20260620_0002
Revises: 20260616_0001
Create Date: 2026-06-20
"""

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

revision = "20260620_0002"
down_revision = "20260616_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("ALTER TABLE catalog_books DROP COLUMN IF EXISTS embedding")
    op.add_column("catalog_books", sa.Column("embedding", Vector(768), nullable=True))


def downgrade() -> None:
    op.drop_column("catalog_books", "embedding")
