"""FastAPI dependencies for opportunity related helpers."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.postgres import get_postgres_session
from app.services.opportunity import OpportunityService


def opportunity_service_dependency(
    session: AsyncSession = Depends(get_postgres_session),
) -> OpportunityService:
    """Provide an OpportunityService backed by a DB session."""

    return OpportunityService(session=session)


__all__ = ["opportunity_service_dependency"]
