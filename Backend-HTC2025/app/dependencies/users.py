"""FastAPI dependencies for user-related helpers."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.postgres import get_postgres_session
from app.services.users import UserLookupService


def user_lookup_service_dependency(
    session: AsyncSession = Depends(get_postgres_session),
) -> UserLookupService:
    """Provide a UserLookupService instance backed by a DB session."""

    return UserLookupService(session=session)


__all__ = ["user_lookup_service_dependency"]
