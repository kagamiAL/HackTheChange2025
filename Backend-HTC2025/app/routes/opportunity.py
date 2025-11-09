"""FastAPI routes for opportunity endpoints."""

from fastapi import APIRouter, Depends, status

from app.dependencies.auth import get_current_user
from app.dependencies.opportunity import opportunity_service_dependency
from app.models.user import User
from app.schemas.opportunity import (
    OpportunityCreateSchema,
    OpportunityResponseSchema,
    SaveOpportunityResponse,
    SavedOpportunitiesResponse,
    OpportunitySavedUserSchema,
    OpportunitySavedUsersResponse,
)
from app.services.opportunity import OpportunityService

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])


@router.post(
    "/save",
    response_model=SaveOpportunityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save an opportunity for the current user",
)
async def save_opportunity(
    payload: OpportunityCreateSchema,
    user: User = Depends(get_current_user),
    service: OpportunityService = Depends(opportunity_service_dependency),
) -> SaveOpportunityResponse:
    """Persist an opportunity and link it to the current user."""

    await service.save_opportunity(user=user, opportunity_data=payload)
    return SaveOpportunityResponse(message="Opportunity saved successfully.")


@router.get(
    "/saved",
    response_model=SavedOpportunitiesResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve saved opportunities for the current user",
)
async def list_saved_opportunities(
    user: User = Depends(get_current_user),
    service: OpportunityService = Depends(opportunity_service_dependency),
) -> SavedOpportunitiesResponse:
    """Return the opportunities saved by the current user."""

    opportunities = await service.get_saved_opportunities(user=user)
    payload = SavedOpportunitiesResponse(
        opportunities=[
            OpportunityResponseSchema.model_validate(opportunity)
            for opportunity in opportunities
        ]
    )
    return payload




__all__ = ["router"]
