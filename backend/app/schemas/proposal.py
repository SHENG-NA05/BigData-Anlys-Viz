from typing import Literal

from pydantic import BaseModel


class ProposalExportRequest(BaseModel):
    theme_id: str
    title: str
    outline: str
    target_audience: str


class ProposalUpdateRequest(BaseModel):
    title: str
    content: str
    status: Literal["draft", "completed", "exported"]
