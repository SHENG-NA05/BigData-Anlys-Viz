from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.catalog_service import CatalogImportError, CatalogService

router = APIRouter()


@router.post("/catalog/import")
def import_catalog(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported now")

    service = CatalogService()
    try:
        imported_count = service.import_csv_upload(db, file.file, file.filename)
    except CatalogImportError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "status": "success",
        "imported_count": imported_count,
        "message": f"Imported {imported_count} catalog books",
    }
