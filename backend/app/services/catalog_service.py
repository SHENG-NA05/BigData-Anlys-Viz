import csv
from pathlib import Path
from typing import BinaryIO, TextIO

from sqlalchemy.orm import Session

from app.db.models import CatalogBook


REQUIRED_COLUMNS = {"title", "isbn", "classification_no"}
OPTIONAL_COLUMNS = {
    "author",
    "publisher",
    "publication_year",
    "summary",
}
SUPPORTED_COLUMNS = REQUIRED_COLUMNS | OPTIONAL_COLUMNS


class CatalogImportError(ValueError):
    pass


class CatalogService:
    def import_csv_path(self, db: Session, csv_path: str | Path) -> int:
        path = Path(csv_path)
        if not path.exists():
            raise CatalogImportError(f"CSV file not found: {path}")

        with path.open("r", encoding="utf-8-sig", newline="") as file:
            return self.import_csv(db, file, source_file=path.name)

    def import_csv_upload(self, db: Session, upload_file: BinaryIO, filename: str) -> int:
        text_file = _decode_upload_file(upload_file)
        return self.import_csv(db, text_file, source_file=filename)

    def import_csv(self, db: Session, csv_file: TextIO, source_file: str | None = None) -> int:
        reader = csv.DictReader(csv_file)
        self._validate_headers(reader.fieldnames)

        books = []
        errors = []
        for row_number, row in enumerate(reader, start=2):
            try:
                books.append(self._row_to_book(row, source_file))
            except CatalogImportError as exc:
                errors.append(f"row {row_number}: {exc}")

        if errors:
            raise CatalogImportError("; ".join(errors[:10]))

        if not books:
            raise CatalogImportError("CSV file has no catalog rows")

        db.add_all(books)
        db.commit()
        return len(books)

    def _validate_headers(self, fieldnames: list[str] | None) -> None:
        if not fieldnames:
            raise CatalogImportError("CSV file has no header row")

        normalized = {_normalize_header(name) for name in fieldnames}
        missing = REQUIRED_COLUMNS - normalized
        if missing:
            raise CatalogImportError(f"Missing required columns: {', '.join(sorted(missing))}")

    def _row_to_book(self, row: dict[str, str], source_file: str | None) -> CatalogBook:
        normalized_row = {_normalize_header(key): _clean_value(value) for key, value in row.items()}

        title = normalized_row.get("title")
        isbn = normalized_row.get("isbn")
        classification_no = normalized_row.get("classification_no")
        if not title:
            raise CatalogImportError("title is required")
        if not isbn:
            raise CatalogImportError("isbn is required")
        if not classification_no:
            raise CatalogImportError("classification_no is required")

        publication_year = _parse_publication_year(normalized_row.get("publication_year"))

        return CatalogBook(
            title=title,
            isbn=isbn,
            author=normalized_row.get("author"),
            publisher=normalized_row.get("publisher"),
            publication_year=publication_year,
            classification_no=classification_no,
            summary=normalized_row.get("summary"),
            source_file=source_file,
        )


def _decode_upload_file(upload_file: BinaryIO) -> TextIO:
    import io

    raw = upload_file.read()
    if isinstance(raw, str):
        return io.StringIO(raw)
    return io.StringIO(raw.decode("utf-8-sig"))


def _normalize_header(value: str | None) -> str:
    return (value or "").strip().lower()


def _clean_value(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _parse_publication_year(value: str | None) -> int | None:
    if not value:
        return None
    try:
        year = int(value)
    except ValueError as exc:
        raise CatalogImportError(f"publication_year must be an integer: {value}") from exc
    if year < 0:
        raise CatalogImportError(f"publication_year must be positive: {value}")
    return year
