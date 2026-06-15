from fastapi import APIRouter

router = APIRouter()

@router.post("/catalog/import")
def import_catalog():
    return {"status": "success", "imported_count": 0, "message": "Catalog import endpoint"}
