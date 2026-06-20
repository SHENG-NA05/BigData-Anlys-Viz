from typing import List
from pydantic import BaseModel

class CatalogMatchRequest(BaseModel):
    keywords: List[str]
    limit: int = 5
