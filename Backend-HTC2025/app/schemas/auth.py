"""Pydantic models for authentication endpoints."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SignUpRequest(BaseModel):
    """Request payload for /auth/signup."""

    id_token: str = Field(..., min_length=1, description="Firebase ID token.")
    full_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="User's full name collected during onboarding.",
    )


class SignInRequest(BaseModel):
    """Request payload for /auth/login."""

    id_token: str = Field(..., min_length=1, description="Firebase ID token.")


class UserPayload(BaseModel):
    """Serialized representation of the local user."""

    id: int
    email: EmailStr
    full_name: str | None = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    """Standard envelope returned by auth endpoints."""

    user: UserPayload
    is_new_user: bool = False


__all__ = [
    "AuthResponse",
    "SignInRequest",
    "SignUpRequest",
    "UserPayload",
]
