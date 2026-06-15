"""create initial schema

Revision ID: 20260616_0001
Revises:
Create Date: 2026-06-16
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260616_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("username", sa.String(length=100), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("sso_provider", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.create_table(
        "catalog_books",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("isbn", sa.String(length=50), nullable=False),
        sa.Column("author", sa.String(length=255), nullable=True),
        sa.Column("publisher", sa.String(length=255), nullable=True),
        sa.Column("publication_year", sa.Integer(), nullable=True),
        sa.Column("classification_no", sa.String(length=100), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("source_file", sa.String(length=255), nullable=True),
        sa.Column("imported_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_catalog_books_classification_no"), "catalog_books", ["classification_no"], unique=False)
    op.create_index(op.f("ix_catalog_books_id"), "catalog_books", ["id"], unique=False)
    op.create_index(op.f("ix_catalog_books_isbn"), "catalog_books", ["isbn"], unique=False)
    op.create_index(op.f("ix_catalog_books_title"), "catalog_books", ["title"], unique=False)

    op.create_table(
        "system_settings",
        sa.Column("setting_key", sa.String(length=100), nullable=False),
        sa.Column("setting_value", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("setting_key"),
    )

    op.create_table(
        "curation_themes",
        sa.Column("theme_id", sa.String(length=50), nullable=False),
        sa.Column("curation_type", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("outline", sa.Text(), nullable=False),
        sa.Column("target_audience", sa.String(length=255), nullable=False),
        sa.Column("keywords", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=True),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("theme_id"),
    )
    op.create_index(op.f("ix_curation_themes_curation_type"), "curation_themes", ["curation_type"], unique=False)

    op.create_table(
        "cost_benefit_logs",
        sa.Column("log_id", sa.Integer(), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("target_id", sa.String(length=50), nullable=True),
        sa.Column("time_saved_hours", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("cost_saved_amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("log_id"),
    )
    op.create_index(op.f("ix_cost_benefit_logs_action"), "cost_benefit_logs", ["action"], unique=False)
    op.create_index(op.f("ix_cost_benefit_logs_log_id"), "cost_benefit_logs", ["log_id"], unique=False)
    op.create_index(op.f("ix_cost_benefit_logs_timestamp"), "cost_benefit_logs", ["timestamp"], unique=False)
    op.create_index(op.f("ix_cost_benefit_logs_user_id"), "cost_benefit_logs", ["user_id"], unique=False)

    op.create_table(
        "proposals",
        sa.Column("proposal_id", sa.String(length=50), nullable=False),
        sa.Column("theme_id", sa.String(length=50), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("matched_books", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["theme_id"], ["curation_themes.theme_id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("proposal_id"),
    )
    op.create_index(op.f("ix_proposals_status"), "proposals", ["status"], unique=False)

    op.create_table(
        "proposal_books",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("proposal_id", sa.String(length=50), nullable=False),
        sa.Column("catalog_book_id", sa.Integer(), nullable=False),
        sa.Column("match_reason", sa.Text(), nullable=True),
        sa.Column("match_score", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["catalog_book_id"], ["catalog_books.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proposal_id"], ["proposals.proposal_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_proposal_books_catalog_book_id"), "proposal_books", ["catalog_book_id"], unique=False)
    op.create_index(op.f("ix_proposal_books_id"), "proposal_books", ["id"], unique=False)
    op.create_index(op.f("ix_proposal_books_proposal_id"), "proposal_books", ["proposal_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_proposal_books_proposal_id"), table_name="proposal_books")
    op.drop_index(op.f("ix_proposal_books_id"), table_name="proposal_books")
    op.drop_index(op.f("ix_proposal_books_catalog_book_id"), table_name="proposal_books")
    op.drop_table("proposal_books")

    op.drop_index(op.f("ix_proposals_status"), table_name="proposals")
    op.drop_table("proposals")

    op.drop_index(op.f("ix_cost_benefit_logs_user_id"), table_name="cost_benefit_logs")
    op.drop_index(op.f("ix_cost_benefit_logs_timestamp"), table_name="cost_benefit_logs")
    op.drop_index(op.f("ix_cost_benefit_logs_log_id"), table_name="cost_benefit_logs")
    op.drop_index(op.f("ix_cost_benefit_logs_action"), table_name="cost_benefit_logs")
    op.drop_table("cost_benefit_logs")

    op.drop_index(op.f("ix_curation_themes_curation_type"), table_name="curation_themes")
    op.drop_table("curation_themes")

    op.drop_table("system_settings")

    op.drop_index(op.f("ix_catalog_books_title"), table_name="catalog_books")
    op.drop_index(op.f("ix_catalog_books_isbn"), table_name="catalog_books")
    op.drop_index(op.f("ix_catalog_books_id"), table_name="catalog_books")
    op.drop_index(op.f("ix_catalog_books_classification_no"), table_name="catalog_books")
    op.drop_table("catalog_books")

    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_table("users")
