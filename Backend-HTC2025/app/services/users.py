"""Reusable queries for fetching user records."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserLookupService:
    """Expose simple read-only helpers for locating users."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_email(self, email: str) -> User | None:
        """Return the user that matches the given email (if any)."""

        result = await self._session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()


__all__ = ["UserLookupService"]
