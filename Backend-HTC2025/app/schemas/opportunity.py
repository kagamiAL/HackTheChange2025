from pydantic import BaseModel
from typing import Optional


class OpportunityCreateSchema(BaseModel):
    api_id: int
    title: str
    description: str
    url: str
    organization: str
    organization_logo: Optional[str] = None
    dates: Optional[str] = None
    duration: Optional[str] = None
