"""Firebase Admin SDK bootstrap + handy auth helpers."""

from __future__ import annotations

import json
import logging
from functools import lru_cache
from typing import Any

import firebase_admin
from firebase_admin import auth, credentials

from app.config import settings

logger = logging.getLogger(__name__)


class FirebaseInitializationError(RuntimeError):
    """Raised when Firebase Admin cannot be initialized."""


def _load_service_account() -> dict[str, Any]:
    """Parse the raw JSON payload into a Python dict."""

    raw_value = settings.firebase_service_account_json.strip()
    if not raw_value:
        raise FirebaseInitializationError(
            "FIREBASE_SERVICE_ACCOUNT_JSON is defined but empty."
        )

    try:
        return json.loads(raw_value)
    except json.JSONDecodeError as exc:
        raise FirebaseInitializationError(
            "FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON."
        ) from exc


@lru_cache(maxsize=1)
def get_firebase_app() -> firebase_admin.App:
    """Lazily initialize and return the singleton Firebase app."""

    try:
        return firebase_admin.get_app()
    except ValueError:
        service_account = _load_service_account()
        credential = credentials.Certificate(service_account)
        app = firebase_admin.initialize_app(credential)
        logger.info("Firebase app initialized.")
        return app


class FirebaseAuthClient:
    """Thin wrapper around firebase_admin.auth to aid dependency injection."""

    def __init__(self, app: firebase_admin.App):
        self._app = app

    def verify_token(
        self, token: str, *, check_revoked: bool = False
    ) -> dict[str, Any]:
        """Verify a Firebase ID token and return its claims."""

        return auth.verify_id_token(token, app=self._app, check_revoked=check_revoked)

    def get_user(self, uid: str) -> auth.UserRecord:
        """Fetch a Firebase user record by UID."""

        return auth.get_user(uid, app=self._app)


def get_firebase_auth_client() -> FirebaseAuthClient:
    """Return a FirebaseAuthClient suitable for FastAPI dependencies."""

    app = get_firebase_app()
    return FirebaseAuthClient(app)


__all__ = [
    "FirebaseAuthClient",
    "FirebaseInitializationError",
    "get_firebase_app",
    "get_firebase_auth_client",
]
