"""Firebase-related FastAPI dependency helpers."""

from firebase_admin import App

from app.integrations.firebase import FirebaseAuthClient, get_firebase_app, get_firebase_auth_client


def firebase_app_dependency() -> App:
    """Return the lazily initialized Firebase App instance."""

    return get_firebase_app()


def firebase_auth_dependency() -> FirebaseAuthClient:
    """Return a FirebaseAuthClient ready for request handlers."""

    return get_firebase_auth_client()


__all__ = [
    "firebase_app_dependency",
    "firebase_auth_dependency",
]
