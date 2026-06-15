from pydantic import BaseModel


class ProposalExportRequest(BaseModel):
    theme_id: str
    title: str
    outline: str
    target_audience: str
