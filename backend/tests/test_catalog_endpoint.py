import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException, UploadFile
from app.api.endpoints.catalog import import_catalog
from app.services.catalog_service import CatalogImportError

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
