import pytest
import io
from unittest.mock import MagicMock, patch
from fastapi import HTTPException, UploadFile
from app.api.endpoints.catalog import import_catalog, validate_catalog, get_upload_history, match_books
from app.services.catalog_service import CatalogImportError
from app.schemas.catalog import CatalogMatchRequest

class FakeDb:
    def __init__(self):
        self.rolled_back = False

    def rollback(self):
        self.rolled_back = True

@patch("app.api.endpoints.catalog.CatalogService.import_file_upload")
def test_import_catalog_success(mock_import_file):
    # Setup mock
    mock_import_file.return_value = 42
    
    # Create fake file
    mock_file_obj = MagicMock()
    upload_file = UploadFile(file=mock_file_obj, filename="test.csv")
    
    db = FakeDb()
    
    # Call endpoint function directly
    response = import_catalog(file=upload_file, db=db)
    
    # Assert
    assert response["status"] == "success"
    assert response["imported_count"] == 42
    assert response["message"] == "Imported 42 catalog books"
    mock_import_file.assert_called_once_with(db, mock_file_obj, "test.csv")
    assert db.rolled_back is False

@patch("app.api.endpoints.catalog.CatalogService.import_file_upload")
def test_import_catalog_failure(mock_import_file):
    # Setup mock to raise error
    mock_import_file.side_effect = CatalogImportError("Invalid header")
    
    mock_file_obj = MagicMock()
    upload_file = UploadFile(file=mock_file_obj, filename="test.csv")
    
    db = FakeDb()
    
    # Call endpoint function directly and expect HTTPException
    with pytest.raises(HTTPException) as exc_info:
        import_catalog(file=upload_file, db=db)
        
    assert exc_info.value.status_code == 400
    assert "Invalid header" in exc_info.value.detail
    assert db.rolled_back is True

@patch("app.services.catalog_service._decode_upload_file")
@patch("app.api.endpoints.catalog.CatalogService")
def test_validate_catalog_csv_success(mock_service_cls, mock_decode):
    mock_service = MagicMock()
    mock_service_cls.return_value = mock_service
    mock_service._row_to_book.return_value = MagicMock()
    
    mock_decode.return_value = io.StringIO("title,author,isbn,publisher\nTest Book,Author Name,1234567890,Publisher Name")
    
    mock_file_obj = MagicMock()
    upload_file = UploadFile(file=mock_file_obj, filename="test.csv")
    
    response = validate_catalog(file=upload_file)
    assert response["valid"] is True
    assert response["records_count"] == 1
    assert len(response["errors"]) == 0
    mock_service._validate_headers.assert_called_once()

@patch("app.services.catalog_service._decode_upload_file")
@patch("app.api.endpoints.catalog.CatalogService")
def test_validate_catalog_csv_row_error(mock_service_cls, mock_decode):
    mock_service = MagicMock()
    mock_service_cls.return_value = mock_service
    mock_service._row_to_book.side_effect = CatalogImportError("Invalid author")
    
    mock_decode.return_value = io.StringIO("title,author,isbn,publisher\nTest Book,,1234567890,Publisher Name")
    
    mock_file_obj = MagicMock()
    upload_file = UploadFile(file=mock_file_obj, filename="test.csv")
    
    response = validate_catalog(file=upload_file)
    assert response["valid"] is False
    assert response["records_count"] == 1
    assert len(response["errors"]) == 1
    assert "Row 2: Invalid author" in response["errors"][0]

@patch("app.services.catalog_service._read_excel_rows")
@patch("app.api.endpoints.catalog.CatalogService")
def test_validate_catalog_excel_success(mock_service_cls, mock_read_excel):
    mock_service = MagicMock()
    mock_service_cls.return_value = mock_service
    mock_service._row_to_book.return_value = MagicMock()
    
    mock_read_excel.return_value = [{"title": "Test Book", "author": "Author", "isbn": "1234567890", "publisher": "Publisher"}]
    
    mock_file_obj = MagicMock()
    upload_file = UploadFile(file=mock_file_obj, filename="test.xlsx")
    
    response = validate_catalog(file=upload_file)
    assert response["valid"] is True
    assert response["records_count"] == 1
    assert len(response["errors"]) == 0

def test_validate_catalog_unsupported_file():
    mock_file_obj = MagicMock()
    upload_file = UploadFile(file=mock_file_obj, filename="test.txt")
    
    response = validate_catalog(file=upload_file)
    assert response["valid"] is False
    assert "Only CSV and Excel files are supported" in response["errors"][0]

def test_get_upload_history_success():
    mock_db = MagicMock()
    mock_result_1 = MagicMock()
    mock_result_1.source_file = "test1.csv"
    mock_result_1.records_count = 10
    mock_result_1.vectorized_count = 8
    mock_result_1.imported_at = "2026-06-22T00:00:00"
    
    mock_db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = [mock_result_1]
    
    response = get_upload_history(db=mock_db)
    assert len(response) == 1
    assert response[0]["source_file"] == "test1.csv"
    assert response[0]["records_count"] == 10
    assert response[0]["vectorized_count"] == 8

@patch("app.services.catalog_match_service.match_catalog_books")
def test_match_books_success(mock_match):
    mock_db = MagicMock()
    mock_match.return_value = [{"book_id": 1, "title": "Matched Book", "score": 85.0}]
    
    request = CatalogMatchRequest(keywords=["AI", "data"], limit=3)
    response = match_books(request=request, db=mock_db)
    
    assert response["status"] == "success"
    assert response["data"][0]["title"] == "Matched Book"
    mock_match.assert_called_once_with(mock_db, ["AI", "data"], limit=3)

