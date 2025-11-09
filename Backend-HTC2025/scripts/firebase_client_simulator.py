#!/usr/bin/env python3
"""Mint Firebase ID/refresh tokens via the email/password flow."""

from __future__ import annotations

import argparse
import os
import sys
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

import requests

IDENTITY_TOOLKIT_BASE = "https://identitytoolkit.googleapis.com/v1"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Call Firebase's Identity Toolkit using the email/password flow to "
            "mint ID and refresh tokens, then write them to disk."
        )
    )
    parser.add_argument(
        "--email",
        required=True,
        help="Email of the Firebase Auth user to sign in as (user is created if needed).",
    )
    parser.add_argument(
        "--password",
        required=True,
        help="Password that would be used by the frontend client.",
    )
    parser.add_argument(
        "--jwt-output",
        default="tmp/id_token.txt",
        help="Destination file for the minted Firebase ID token (default: tmp/id_token.txt).",
    )
    parser.add_argument(
        "--refresh-output",
        default="tmp/refresh_token.txt",
        help="Destination file for the refresh token returned by Firebase (default: tmp/refresh_token.txt).",
    )
    parser.add_argument(
        "--api-key",
        help=(
            "Firebase Web API key used to call the Identity Toolkit REST API. "
            "Defaults to the FIREBASE_WEB_API_KEY environment variable."
        ),
    )
    return parser.parse_args()


class IdentityToolkitError(RuntimeError):
    """Raised when Firebase returns an error payload."""

    def __init__(self, message: str, status: int | None = None):
        super().__init__(message)
        self.status = status


def identity_request(endpoint: str, payload: dict[str, object], api_key: str) -> dict:
    url = f"{IDENTITY_TOOLKIT_BASE}/{endpoint}?key={api_key}"
    try:
        response = requests.post(url, json=payload, timeout=15)
    except requests.RequestException as exc:
        raise RuntimeError(f"Network error calling Firebase: {exc}") from exc

    if response.ok:
        return response.json()

    try:
        error_message = response.json()["error"]["message"]
    except Exception:
        error_message = response.text
    raise IdentityToolkitError(error_message, status=response.status_code)


def sign_up(email: str, password: str, api_key: str) -> dict | None:
    payload = {"email": email, "password": password, "returnSecureToken": True}
    try:
        return identity_request("accounts:signUp", payload, api_key)
    except IdentityToolkitError as exc:
        if exc.status == 400 and exc.args and "EMAIL_EXISTS" in exc.args[0]:
            return None
        raise


def sign_in(email: str, password: str, api_key: str) -> dict:
    payload = {"email": email, "password": password, "returnSecureToken": True}
    return identity_request("accounts:signInWithPassword", payload, api_key)


def mint_tokens(email: str, password: str, api_key: str) -> tuple[str, str]:
    data = sign_up(email, password, api_key)
    if data is None:
        data = sign_in(email, password, api_key)

    id_token = data.get("idToken")
    refresh_token = data.get("refreshToken")
    if not id_token or not refresh_token:
        raise RuntimeError("Firebase response missing idToken or refreshToken.")
    return id_token, refresh_token


def write_token(path_str: str, token: str) -> None:
    path = Path(path_str).expanduser()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(token, encoding="utf-8")


def main() -> int:
    args = parse_args()

    api_key = args.api_key or os.environ.get("FIREBASE_WEB_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Firebase Web API key is required. Pass --api-key or set FIREBASE_WEB_API_KEY."
        )

    id_token, refresh_token = mint_tokens(
        email=args.email, password=args.password, api_key=api_key
    )

    write_token(args.jwt_output, id_token)
    write_token(args.refresh_output, refresh_token)

    print(f"Minted tokens for {args.email} via email/password flow.")
    print(f"ID token written to {args.jwt_output}")
    print(f"Refresh token written to {args.refresh_output}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise SystemExit(1)
