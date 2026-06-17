import io

import pytest
from openpyxl import Workbook

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


def test_import_csv_invalid_classification_no():
    db = FakeDb()
    csv_file = io.StringIO(
        "title,isbn,classification_no,publication_year\n"
        "圖解資料視覺化,9789860000016,not-a-class,2024\n"
    )

    with pytest.raises(CatalogImportError, match="classification_no must be 3 digits"):
        CatalogService().import_csv(db, csv_file)


def test_import_excel_upload_success():
    db = FakeDb()
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.append(["title", "isbn", "classification_no", "author", "publisher", "publication_year", "summary"])
    worksheet.append(["圖解資料視覺化", "9789860000016", "540.123", "王小明", "測試出版", 2024, "資料視覺化入門"])
    file = io.BytesIO()
    workbook.save(file)
    file.seek(0)

    imported_count = CatalogService().import_excel_upload(db, file, "sample.xlsx")

    assert imported_count == 1
    assert db.committed is True
    assert db.items[0].title == "圖解資料視覺化"
    assert db.items[0].publication_year == 2024
    assert db.items[0].source_file == "sample.xlsx"


def test_import_excel_upload_missing_required_column():
    db = FakeDb()
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.append(["title", "isbn"])
    worksheet.append(["圖解資料視覺化", "9789860000016"])
    file = io.BytesIO()
    workbook.save(file)
    file.seek(0)

    with pytest.raises(CatalogImportError, match="Missing required columns"):
        CatalogService().import_excel_upload(db, file, "missing-columns.xlsx")


from unittest.mock import patch

@patch("app.services.ai_service.AIService.get_embeddings_batch")
def test_import_csv_generates_embeddings(mock_get_embeddings):
    mock_get_embeddings.return_value = [[0.1] * 768]
    db = FakeDb()
    csv_file = io.StringIO(
        "title,isbn,classification_no,author,publisher,publication_year,summary\n"
        "圖解資料視覺化,9789860000016,540.123,王小明,測試出版,2024,資料視覺化入門\n"
    )

    imported_count = CatalogService().import_csv(db, csv_file, source_file="sample.csv")

    assert imported_count == 1
    assert db.committed is True
    assert db.items[0].title == "圖解資料視覺化"
    assert db.items[0].embedding == [0.1] * 768
    mock_get_embeddings.assert_called_once_with(["圖解資料視覺化 資料視覺化入門"])

