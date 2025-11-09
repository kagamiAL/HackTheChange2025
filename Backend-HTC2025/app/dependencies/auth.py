"""Reusable authentication dependencies."""

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.postgres import get_postgres_session
from app.dependencies.firebase import firebase_auth_dependency
from app.integrations.firebase import FirebaseAuthClient
from app.models.user import User
from app.services.auth import (
    AuthService,
    InvalidCredentialsError,
    MissingEmailClaimError,
    UserNotFoundError,
)

BEARER_PREFIX = "Bearer "


async def get_current_user(
    authorization: str | None = Header(default=None, alias="Authorization"),
    session: AsyncSession = Depends(get_postgres_session),
    firebase_auth: FirebaseAuthClient = Depends(firebase_auth_dependency),
) -> User:
    """Resolve and return the current user from a Firebase bearer token."""

    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is required.",
        )

    if not authorization.startswith(BEARER_PREFIX):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must be a Bearer token.",
        )

    token = authorization[len(BEARER_PREFIX) :].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token is missing.",
        )

    auth_service = AuthService(session=session, firebase_auth=firebase_auth)

    try:
        user = await auth_service.sign_in(token=token)
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase token.",
        ) from exc
    except MissingEmailClaimError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Firebase token is missing the email claim.",
        ) from exc
    except UserNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        ) from exc

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    return user


__all__ = ["get_current_user"]

