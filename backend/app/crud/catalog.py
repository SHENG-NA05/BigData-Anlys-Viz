from sqlalchemy.orm import Session

from app.db.models import CatalogBook


def create_catalog_books(db: Session, books: list[CatalogBook]) -> int:
    db.add_all(books)
    db.commit()
    return len(books)


def get_catalog_book(db: Session, book_id: int) -> CatalogBook | None:
    return db.get(CatalogBook, book_id)


def list_catalog_books(db: Session, skip: int = 0, limit: int = 100) -> list[CatalogBook]:
    return db.query(CatalogBook).order_by(CatalogBook.imported_at.desc()).offset(skip).limit(limit).all()
