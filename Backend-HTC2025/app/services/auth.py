"""Business logic for Firebase-backed authentication flows."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.firebase import FirebaseAuthClient
from app.models.user import User


class AuthServiceError(Exception):
    """Base error for auth service failures."""


class InvalidCredentialsError(AuthServiceError):
    """Raised when a Firebase token cannot be verified."""


class MissingEmailClaimError(AuthServiceError):
    """Raised when the Firebase token payload omits the email claim."""


class UserNotFoundError(AuthServiceError):
    """Raised when no local user matches the Firebase token."""


class AuthService:
    """Encapsulates Firebase-backed sign-up/sign-in operations."""

    def __init__(
        self,
        session: AsyncSession,
        firebase_auth: FirebaseAuthClient,
    ) -> None:
        self._session = session
        self._firebase_auth = firebase_auth

    async def sign_up(self, token: str, full_name: str) -> tuple[User, bool]:
        """Create or update a local user for the given Firebase token."""

        claims = self._decode_token(token)
        email = self._extract_email(claims)

        normalized_name = full_name.strip()

        user = await self._get_user_by_email(email)
        is_new_user = False

        if user is None:
            user = User(email=email, full_name=normalized_name)
            self._session.add(user)
            await self._session.commit()
            await self._session.refresh(user)
            is_new_user = True
        else:
            if normalized_name and user.full_name != normalized_name:
                user.full_name = normalized_name
                await self._session.commit()
                await self._session.refresh(user)

        return user, is_new_user

    async def sign_in(self, token: str) -> User:
        """Return the existing user that corresponds to the Firebase token."""

        claims = self._decode_token(token)
        email = self._extract_email(claims)

        user = await self._get_user_by_email(email)
        if user is None:
            raise UserNotFoundError(f"No user record found for email '{email}'.")

        return user

    def _decode_token(self, token: str) -> dict[str, Any]:
        try:
            return self._firebase_auth.verify_token(token)
        except Exception as exc:  # firebase_admin raises several custom errors
            raise InvalidCredentialsError("Invalid Firebase ID token.") from exc

    @staticmethod
    def _extract_email(claims: dict[str, Any]) -> str:
        email = claims.get("email")
        if not email:
            raise MissingEmailClaimError("Firebase token is missing the email claim.")
        return email

    async def _get_user_by_email(self, email: str) -> User | None:
        result = await self._session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()


__all__ = [
    "AuthService",
    "AuthServiceError",
    "InvalidCredentialsError",
    "MissingEmailClaimError",
    "UserNotFoundError",
]
