"""FastAPI routes for opportunity endpoints."""

from fastapi import APIRouter, Depends, status

from app.dependencies.auth import get_current_user
from app.dependencies.opportunity import opportunity_service_dependency
from app.models.user import User
from app.schemas.opportunity import OpportunityCreateSchema
from app.services.opportunity import OpportunityService

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])


@router.post(
    "/save",
    status_code=status.HTTP_201_CREATED,
    summary="Save an opportunity for the current user",
)
async def save_opportunity(
    payload: OpportunityCreateSchema,
    user: User = Depends(get_current_user),
    service: OpportunityService = Depends(opportunity_service_dependency),
) -> dict[str, str]:
    """Persist an opportunity and link it to the current user."""

    await service.save_opportunity(user=user, opportunity_data=payload)
    return {"message": "Opportunity saved successfully."}


@router.get(
    "/saved",
    status_code=status.HTTP_200_OK,
    summary="Retrieve saved opportunities for the current user",
)
async def list_saved_opportunities(
    user: User = Depends(get_current_user),
    service: OpportunityService = Depends(opportunity_service_dependency),
) -> dict[str, list[dict]]:
    """Return the opportunities saved by the current user."""

    opportunities = await service.get_saved_opportunities(user=user)
    serialized = [
        {
            "id": opportunity.id,
            "api_id": opportunity.api_id,
            "title": opportunity.title,
            "description": opportunity.description,
            "url": opportunity.url,
            "organization": opportunity.organization,
            "organization_logo": opportunity.organization_logo,
            "dates": opportunity.dates,
            "duration": opportunity.duration,
        }
        for opportunity in opportunities
    ]
    return {"opportunities": serialized}


__all__ = ["router"]
