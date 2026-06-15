from fastapi import APIRouter

router = APIRouter()

@router.post("/export_to_proposal")
def export_to_proposal():
    return {"status": "success", "proposal_id": "P001", "message": "已成功建立企劃書草案"}
