from pydantic import BaseModel
from typing import List, Optional

class CurationRequest(BaseModel):
    curation_type: str
    keywords: List[str]
    prompt: Optional[str] = None
    year: Optional[int] = 2026
