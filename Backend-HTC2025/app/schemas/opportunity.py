from pydantic import BaseModel
from typing import Optional, List


class OpportunityBase(BaseModel):
    api_id: int
    title: str
    description: str
    url: str
    organization: str
    organization_logo: Optional[str] = None
    dates: Optional[str] = None
    duration: Optional[str] = None


class OpportunityCreateSchema(OpportunityBase):
    """Payload used when saving a new opportunity."""


class OpportunityResponseSchema(OpportunityBase):
    id: int

    class Config:
        from_attributes = True


class SaveOpportunityResponse(BaseModel):
    message: str


class SavedOpportunitiesResponse(BaseModel):
    opportunities: List[OpportunityResponseSchema]


class OpportunitySavedUserSchema(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


class OpportunitySavedUsersResponse(BaseModel):
    api_id: int
    users: List[OpportunitySavedUserSchema]


__all__ = [
    "OpportunityCreateSchema",
    "OpportunityResponseSchema",
    "SaveOpportunityResponse",
    "SavedOpportunitiesResponse",
    "OpportunitySavedUserSchema",
    "OpportunitySavedUsersResponse",
]
