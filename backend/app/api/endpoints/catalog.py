from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import func
import csv

from app.db.session import get_db
from app.db.models import CatalogBook
from app.services.catalog_service import CatalogImportError, CatalogService
from app.schemas.catalog import CatalogMatchRequest

router = APIRouter()


@router.post("/catalog/import")
def import_catalog(file: UploadFile = File(...), db: Session = Depends(get_db)):
    service = CatalogService()
    try:
        imported_count = service.import_file_upload(db, file.file, file.filename)
    except CatalogImportError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "status": "success",
        "imported_count": imported_count,
        "message": f"Imported {imported_count} catalog books",
    }


@router.post("/catalog/validate")
def validate_catalog(file: UploadFile = File(...)):
    filename = file.filename or ""
    lower_filename = filename.lower()
    service = CatalogService()
    
    try:
        if lower_filename.endswith(".csv"):
            from app.services.catalog_service import _decode_upload_file
            text_file = _decode_upload_file(file.file)
            reader = csv.DictReader(text_file)
            service._validate_headers(reader.fieldnames)
            rows = list(reader)
            start_row = 2
        elif lower_filename.endswith((".xlsx", ".xls")):
            from app.services.catalog_service import _read_excel_rows
            rows = _read_excel_rows(file.file)
            start_row = 2
        else:
            return {"valid": False, "records_count": 0, "errors": ["Only CSV and Excel files are supported"]}
    except CatalogImportError as exc:
        return {"valid": False, "records_count": 0, "errors": [str(exc)]}
    except Exception as exc:
        return {"valid": False, "records_count": 0, "errors": [f"Failed to parse file: {exc}"]}
        
    errors = []
    for row_number, row in enumerate(rows, start=start_row):
        try:
            service._row_to_book(row, source_file=filename)
        except CatalogImportError as exc:
            errors.append(f"Row {row_number}: {exc}")
        except Exception as exc:
            errors.append(f"Row {row_number}: unexpected error: {exc}")
            
    return {
        "valid": len(errors) == 0,
        "records_count": len(rows),
        "errors": errors
    }


@router.get("/catalog/upload-history")
def get_upload_history(db: Session = Depends(get_db)):
    results = (
        db.query(
            CatalogBook.source_file,
            func.count(CatalogBook.id).label("records_count"),
            func.count(CatalogBook.embedding).label("vectorized_count"),
            func.max(CatalogBook.imported_at).label("imported_at"),
        )
        .filter(CatalogBook.source_file.isnot(None))
        .group_by(CatalogBook.source_file)
        .order_by(func.max(CatalogBook.imported_at).desc())
        .all()
    )
    return [
        {
            "source_file": r.source_file,
            "records_count": r.records_count,
            "vectorized_count": r.vectorized_count,
            "imported_at": r.imported_at,
        }
        for r in results
    ]


@router.post("/catalog/match")
def match_books(request: CatalogMatchRequest, db: Session = Depends(get_db)):
    from app.services.catalog_match_service import match_catalog_books
    results = match_catalog_books(db, request.keywords, limit=request.limit)
    return {
        "status": "success",
        "data": results
    }
