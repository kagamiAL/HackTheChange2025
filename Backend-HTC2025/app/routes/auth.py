"""FastAPI router for authentication endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies.auth import get_auth_service
from app.schemas.auth import AuthResponse, SignInRequest, SignUpRequest, UserPayload
from app.services.auth import (
    AuthService,
    InvalidCredentialsError,
    MissingEmailClaimError,
    UserNotFoundError,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Sign up via Firebase ID token",
)
async def sign_up(
    payload: SignUpRequest,
    service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    """Verify the Firebase token, create/update the user, and return profile data."""

    try:
        user, is_new_user = await service.sign_up(
            token=payload.id_token, full_name=payload.full_name
        )
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)
        ) from exc
    except MissingEmailClaimError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc

    user_payload = UserPayload.model_validate(user)
    return AuthResponse(user=user_payload, is_new_user=is_new_user)


@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Log in via Firebase ID token",
)
async def login(
    payload: SignInRequest,
    service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    """Verify the Firebase token and return the associated user profile."""

    try:
        user = await service.sign_in(token=payload.id_token)
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)
        ) from exc
    except MissingEmailClaimError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    except UserNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc

    user_payload = UserPayload.model_validate(user)
    return AuthResponse(user=user_payload, is_new_user=False)


__all__ = ["router"]
