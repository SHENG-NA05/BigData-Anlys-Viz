from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="curator")
    sso_provider = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    curation_themes = relationship("CurationTheme", back_populates="creator")
    proposals = relationship("Proposal", back_populates="creator")
    cost_benefit_logs = relationship("CostBenefitLog", back_populates="user")


class CatalogBook(Base):
    __tablename__ = "catalog_books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    isbn = Column(String(50), nullable=False, index=True)
    author = Column(String(255), nullable=True)
    publisher = Column(String(255), nullable=True)
    publication_year = Column(Integer, nullable=True)
    classification_no = Column(String(100), nullable=False, index=True)
    summary = Column(Text, nullable=True)
    source_file = Column(String(255), nullable=True)
    imported_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    proposal_books = relationship("ProposalBook", back_populates="catalog_book")


class CurationTheme(Base):
    __tablename__ = "curation_themes"

    theme_id = Column(String(50), primary_key=True)
    curation_type = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    outline = Column(Text, nullable=False)
    target_audience = Column(String(255), nullable=False)
    keywords = Column(JSONB, nullable=False)
    prompt = Column(Text, nullable=True)
    year = Column(Integer, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    creator = relationship("User", back_populates="curation_themes")
    proposals = relationship("Proposal", back_populates="theme")


class Proposal(Base):
    __tablename__ = "proposals"

    proposal_id = Column(String(50), primary_key=True)
    theme_id = Column(
        String(50),
        ForeignKey("curation_themes.theme_id", ondelete="SET NULL"),
        nullable=True,
    )
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    matched_books = Column(JSONB, nullable=True)
    status = Column(String(50), nullable=False, default="draft", index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    theme = relationship("CurationTheme", back_populates="proposals")
    creator = relationship("User", back_populates="proposals")
    proposal_books = relationship(
        "ProposalBook",
        back_populates="proposal",
        cascade="all, delete-orphan",
    )


class ProposalBook(Base):
    __tablename__ = "proposal_books"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(
        String(50),
        ForeignKey("proposals.proposal_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    catalog_book_id = Column(
        Integer,
        ForeignKey("catalog_books.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    match_reason = Column(Text, nullable=True)
    match_score = Column(Numeric(5, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    proposal = relationship("Proposal", back_populates="proposal_books")
    catalog_book = relationship("CatalogBook", back_populates="proposal_books")


class CostBenefitLog(Base):
    __tablename__ = "cost_benefit_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    target_id = Column(String(50), nullable=True)
    time_saved_hours = Column(Numeric(5, 2), nullable=False)
    cost_saved_amount = Column(Numeric(10, 2), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    user = relationship("User", back_populates="cost_benefit_logs")


class SystemSetting(Base):
    __tablename__ = "system_settings"

    setting_key = Column(String(100), primary_key=True)
    setting_value = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
