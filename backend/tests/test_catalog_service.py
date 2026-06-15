import io

import pytest

from app.services.catalog_service import CatalogImportError, CatalogService


class FakeDb:
    def __init__(self):
        self.items = []
        self.committed = False

    def add_all(self, items):
        self.items.extend(items)

    def commit(self):
        self.committed = True


def test_import_csv_success():
    db = FakeDb()
    csv_file = io.StringIO(
        "title,isbn,classification_no,author,publisher,publication_year,summary\n"
        "圖解資料視覺化,9789860000016,540.123,王小明,測試出版,2024,資料視覺化入門\n"
    )

    imported_count = CatalogService().import_csv(db, csv_file, source_file="sample.csv")

    assert imported_count == 1
    assert db.committed is True
    assert db.items[0].title == "圖解資料視覺化"
    assert db.items[0].source_file == "sample.csv"


def test_import_csv_missing_required_column():
    db = FakeDb()
    csv_file = io.StringIO("title,isbn\n圖解資料視覺化,9789860000016\n")

    with pytest.raises(CatalogImportError, match="Missing required columns"):
        CatalogService().import_csv(db, csv_file)


def test_import_csv_invalid_publication_year():
    db = FakeDb()
    csv_file = io.StringIO(
        "title,isbn,classification_no,publication_year\n"
        "圖解資料視覺化,9789860000016,540.123,not-a-year\n"
    )

    with pytest.raises(CatalogImportError, match="publication_year must be an integer"):
        CatalogService().import_csv(db, csv_file)
